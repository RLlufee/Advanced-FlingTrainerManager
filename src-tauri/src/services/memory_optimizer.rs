use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemMemoryInfo {
    pub total_phys_bytes: u64,
    pub avail_phys_bytes: u64,
    pub used_phys_bytes: u64,
    pub used_percent: f32,
    pub total_pagefile_bytes: u64,
    pub avail_pagefile_bytes: u64,
    pub is_admin: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryOptimizeOptions {
    pub empty_working_sets: bool,
    pub flush_file_cache: bool,
    pub flush_modified_list: bool,
    pub purge_standby_list: bool,
    pub purge_low_priority_standby: bool,
    pub combine_physical_memory: bool,
    pub registry_reconciliation: bool,
}

impl Default for MemoryOptimizeOptions {
    fn default() -> Self {
        Self {
            empty_working_sets: true,
            flush_file_cache: true,
            flush_modified_list: true,
            purge_standby_list: true,
            purge_low_priority_standby: true,
            combine_physical_memory: true,
            registry_reconciliation: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryOptimizeResult {
    pub success: bool,
    pub freed_bytes: u64,
    pub before: SystemMemoryInfo,
    pub after: SystemMemoryInfo,
    pub logs: Vec<String>,
    pub is_admin: bool,
}

#[cfg(windows)]
#[repr(C)]
struct SystemFileCacheInformation {
    current_size: usize,
    peak_size: usize,
    page_fault_count: u32,
    minimum_working_set: usize,
    maximum_working_set: usize,
    current_size_including_transition_in_pages: usize,
    peak_size_including_transition_in_pages: usize,
    transition_repurpose_count: u32,
    flags: u32,
}

#[cfg(windows)]
#[repr(C)]
struct MemoryCombineInformationEx {
    handle: *mut std::ffi::c_void,
    pages_combined: usize,
    flags: u32,
}

#[cfg(windows)]
struct NtFunctions {
    rtl_adjust_privilege: Option<unsafe extern "system" fn(u32, u8, u8, *mut u8) -> u32>,
    nt_set_system_information:
        Option<unsafe extern "system" fn(u32, *const std::ffi::c_void, u32) -> u32>,
}

#[cfg(windows)]
impl NtFunctions {
    fn load() -> Self {
        use windows_sys::Win32::System::LibraryLoader::{GetModuleHandleA, GetProcAddress};
        unsafe {
            let h_ntdll = GetModuleHandleA(c"ntdll.dll".as_ptr() as *const u8);
            if h_ntdll.is_null() {
                return Self {
                    rtl_adjust_privilege: None,
                    nt_set_system_information: None,
                };
            }

            let adj_addr = GetProcAddress(h_ntdll, c"RtlAdjustPrivilege".as_ptr() as *const u8);
            let rtl_adjust_privilege = adj_addr.map(|addr| {
                std::mem::transmute::<
                    unsafe extern "system" fn() -> isize,
                    unsafe extern "system" fn(u32, u8, u8, *mut u8) -> u32,
                >(addr)
            });

            let set_addr = GetProcAddress(h_ntdll, c"NtSetSystemInformation".as_ptr() as *const u8);
            let nt_set_system_information = set_addr.map(|addr| {
                std::mem::transmute::<
                    unsafe extern "system" fn() -> isize,
                    unsafe extern "system" fn(u32, *const std::ffi::c_void, u32) -> u32,
                >(addr)
            });

            Self {
                rtl_adjust_privilege,
                nt_set_system_information,
            }
        }
    }

    fn enable_privileges(&self) -> bool {
        if let Some(adj_fn) = self.rtl_adjust_privilege {
            let mut enabled: u8 = 0;
            unsafe {
                // SeIncreaseQuotaPrivilege = 5
                let _ = adj_fn(5, 1, 0, &mut enabled);
                // SeProfileSingleProcessPrivilege = 13
                let _ = adj_fn(13, 1, 0, &mut enabled);
                // SeDebugPrivilege = 20
                let _ = adj_fn(20, 1, 0, &mut enabled);
            }
            true
        } else {
            false
        }
    }
}

pub fn get_system_memory_info() -> Result<SystemMemoryInfo, String> {
    #[cfg(windows)]
    {
        use windows_sys::Win32::System::SystemInformation::{GlobalMemoryStatusEx, MEMORYSTATUSEX};
        use windows_sys::Win32::UI::Shell::IsUserAnAdmin;

        let mut mem_status = MEMORYSTATUSEX {
            dwLength: std::mem::size_of::<MEMORYSTATUSEX>() as u32,
            dwMemoryLoad: 0,
            ullTotalPhys: 0,
            ullAvailPhys: 0,
            ullTotalPageFile: 0,
            ullAvailPageFile: 0,
            ullTotalVirtual: 0,
            ullAvailVirtual: 0,
            ullAvailExtendedVirtual: 0,
        };

        let ret = unsafe { GlobalMemoryStatusEx(&mut mem_status) };
        if ret == 0 {
            return Err("无法获取系统内存信息".into());
        }

        let is_admin = unsafe { IsUserAnAdmin() != 0 };
        let total = mem_status.ullTotalPhys;
        let avail = mem_status.ullAvailPhys;
        let used = total.saturating_sub(avail);
        let used_percent = if total > 0 {
            (used as f64 / total as f64 * 100.0) as f32
        } else {
            0.0
        };

        Ok(SystemMemoryInfo {
            total_phys_bytes: total,
            avail_phys_bytes: avail,
            used_phys_bytes: used,
            used_percent,
            total_pagefile_bytes: mem_status.ullTotalPageFile,
            avail_pagefile_bytes: mem_status.ullAvailPageFile,
            is_admin,
        })
    }
    #[cfg(not(windows))]
    {
        Err("仅支持 Windows 操作系统".into())
    }
}

pub fn optimize_memory(
    options: Option<MemoryOptimizeOptions>,
) -> Result<MemoryOptimizeResult, String> {
    #[cfg(windows)]
    {
        use windows_sys::Win32::System::ProcessStatus::K32EmptyWorkingSet;
        use windows_sys::Win32::System::Threading::GetCurrentProcess;
        use windows_sys::Win32::UI::Shell::IsUserAnAdmin;

        let before = get_system_memory_info()?;
        let opts = options.unwrap_or_default();
        let is_admin = unsafe { IsUserAnAdmin() != 0 };
        let mut logs = Vec::new();

        let nt = NtFunctions::load();
        if is_admin {
            nt.enable_privileges();
            logs.push("已成功获取内核级特权 (SeIncreaseQuota & SeProfileSingleProcess)".into());
        } else {
            logs.push(
                "当前为普通用户权限，运行基础进程工作集优化（内核待机列表清空需管理员权限）".into(),
            );
        }

        // 1. 回收当前进程及基础工作集
        if opts.empty_working_sets {
            unsafe {
                let cur_proc = GetCurrentProcess();
                K32EmptyWorkingSet(cur_proc);
            }
            logs.push("已回收本程序进程工作集 (EmptyWorkingSet)".into());
        }

        // 2. 内核级深层优化 (基于 PCL2 CE MemSwapWorks 原理)
        if let Some(set_sys_info) = nt.nt_set_system_information {
            // 清理全系统进程工作集 (SystemMemoryListInformation = 80, infoValue = 2)
            if opts.empty_working_sets {
                let info_val: i32 = 2;
                let status = unsafe {
                    set_sys_info(
                        80,
                        &info_val as *const i32 as *const std::ffi::c_void,
                        std::mem::size_of::<i32>() as u32,
                    )
                };
                if status == 0 {
                    logs.push("已清空全系统进程工作集 (MemoryEmptyWorkingSets)".into());
                } else if is_admin {
                    logs.push(format!("清空全系统工作集状态码: 0x{:08X}", status));
                }
            }

            // 刷写脏页与修改列表 (SystemMemoryListInformation = 80, infoValue = 3)
            if opts.flush_modified_list {
                let info_val: i32 = 3;
                let status = unsafe {
                    set_sys_info(
                        80,
                        &info_val as *const i32 as *const std::ffi::c_void,
                        std::mem::size_of::<i32>() as u32,
                    )
                };
                if status == 0 {
                    logs.push("已刷写修改页列表至分页文件 (MemoryFlushModifiedList)".into());
                }
            }

            // 清空待机内存列表 (核心大头: SystemMemoryListInformation = 80, infoValue = 4)
            if opts.purge_standby_list {
                let info_val: i32 = 4;
                let status = unsafe {
                    set_sys_info(
                        80,
                        &info_val as *const i32 as *const std::ffi::c_void,
                        std::mem::size_of::<i32>() as u32,
                    )
                };
                if status == 0 {
                    logs.push("已彻底释放 Windows 待机与缓存内存 (MemoryPurgeStandbyList)".into());
                } else if is_admin {
                    logs.push(format!("清空待机列表状态码: 0x{:08X}", status));
                }
            }

            // 清空低优先级待机内存 (SystemMemoryListInformation = 80, infoValue = 5)
            if opts.purge_low_priority_standby {
                let info_val: i32 = 5;
                let status = unsafe {
                    set_sys_info(
                        80,
                        &info_val as *const i32 as *const std::ffi::c_void,
                        std::mem::size_of::<i32>() as u32,
                    )
                };
                if status == 0 {
                    logs.push("已清空低优先级待机列表 (MemoryPurgeLowPriorityStandbyList)".into());
                }
            }

            // 清理系统文件缓存 (SystemFileCacheInformationEx = 81)
            if opts.flush_file_cache {
                let scfi = SystemFileCacheInformation {
                    current_size: 0,
                    peak_size: 0,
                    page_fault_count: 0,
                    minimum_working_set: usize::MAX,
                    maximum_working_set: usize::MAX,
                    current_size_including_transition_in_pages: 0,
                    peak_size_including_transition_in_pages: 0,
                    transition_repurpose_count: 0,
                    flags: 0,
                };
                let status = unsafe {
                    set_sys_info(
                        81,
                        &scfi as *const SystemFileCacheInformation as *const std::ffi::c_void,
                        std::mem::size_of::<SystemFileCacheInformation>() as u32,
                    )
                };
                if status == 0 {
                    logs.push("已重置并刷新系统文件缓存 (SystemFileCacheInformation)".into());
                }
            }

            // 注册表协调释放 (SystemRegistryReconciliationInformation = 155)
            if opts.registry_reconciliation {
                let status = unsafe { set_sys_info(155, std::ptr::null(), 0) };
                if status == 0 {
                    logs.push(
                        "已协调并优化系统注册表内存占用 (SystemRegistryReconciliation)".into(),
                    );
                }
            }

            // 物理内存合并去重 (SystemCombinePhysicalMemoryInformation = 130)
            if opts.combine_physical_memory {
                let combine_info = MemoryCombineInformationEx {
                    handle: std::ptr::null_mut(),
                    pages_combined: 0,
                    flags: 0,
                };
                let status = unsafe {
                    set_sys_info(
                        130,
                        &combine_info as *const MemoryCombineInformationEx
                            as *const std::ffi::c_void,
                        std::mem::size_of::<MemoryCombineInformationEx>() as u32,
                    )
                };
                if status == 0 {
                    logs.push("已执行物理内存冗余页合并压缩 (SystemCombinePhysicalMemory)".into());
                }
            }
        }

        // 短暂让系统状态更新
        std::thread::sleep(std::time::Duration::from_millis(150));
        let after = get_system_memory_info()?;

        let freed_bytes = after
            .avail_phys_bytes
            .saturating_sub(before.avail_phys_bytes);

        logs.push(format!(
            "优化完成：可用内存从 {:.2} GB 提升至 {:.2} GB，共释放 {:.1} MB",
            before.avail_phys_bytes as f64 / 1024.0 / 1024.0 / 1024.0,
            after.avail_phys_bytes as f64 / 1024.0 / 1024.0 / 1024.0,
            freed_bytes as f64 / 1024.0 / 1024.0
        ));

        Ok(MemoryOptimizeResult {
            success: true,
            freed_bytes,
            before,
            after,
            logs,
            is_admin,
        })
    }
    #[cfg(not(windows))]
    {
        Err("仅支持 Windows 操作系统".into())
    }
}

pub fn restart_as_admin() -> Result<(), String> {
    restart_as_admin_with_cleanup(|| {})
}

pub fn restart_as_admin_with_cleanup<F>(before_exit: F) -> Result<(), String>
where
    F: FnOnce(),
{
    #[cfg(windows)]
    {
        use std::ffi::OsStr;
        use std::os::windows::ffi::OsStrExt;
        use windows_sys::Win32::UI::Shell::ShellExecuteW;
        use windows_sys::Win32::UI::WindowsAndMessaging::SW_SHOWNORMAL;

        fn to_wide(s: &OsStr) -> Vec<u16> {
            s.encode_wide().chain(std::iter::once(0)).collect()
        }

        let exe_path =
            std::env::current_exe().map_err(|e| format!("获取当前可执行文件路径失败: {}", e))?;

        let relaunch_arg = format!(
            "{} {}",
            crate::services::single_instance::RELAUNCH_WAIT_PID_ARG,
            std::process::id()
        );
        let op = to_wide(OsStr::new("runas"));
        let file = to_wide(exe_path.as_os_str());
        let params = to_wide(OsStr::new(&relaunch_arg));

        let res = unsafe {
            ShellExecuteW(
                std::ptr::null_mut(),
                op.as_ptr(),
                file.as_ptr(),
                params.as_ptr(),
                std::ptr::null(),
                SW_SHOWNORMAL,
            )
        };

        if res as usize > 32 {
            // 提权子进程已拉起：先执行旧进程清理回调（释放托盘图标与单实例锁），再退出当前非管理员进程
            before_exit();
            std::process::exit(0);
        } else {
            Err(format!(
                "UAC 提升管理员权限被取消或失败，错误代码: {}",
                res as usize
            ))
        }
    }
    #[cfg(not(windows))]
    {
        let _ = before_exit;
        Err("仅支持 Windows 操作系统".into())
    }
}

pub fn open_system_tool(tool_name: &str) -> Result<(), String> {
    #[cfg(windows)]
    {
        match tool_name {
            "dxdiag" => {
                std::process::Command::new("dxdiag")
                    .spawn()
                    .map_err(|e| format!("启动 dxdiag 失败: {}", e))?;
            }
            "joy.cpl" => {
                std::process::Command::new("control")
                    .arg("joy.cpl")
                    .spawn()
                    .map_err(|e| format!("启动游戏控制器设置失败: {}", e))?;
            }
            "taskmgr" => {
                std::process::Command::new("taskmgr")
                    .spawn()
                    .map_err(|e| format!("启动任务管理器失败: {}", e))?;
            }
            "sysdm.cpl" => {
                std::process::Command::new("control")
                    .arg("sysdm.cpl")
                    .spawn()
                    .map_err(|e| format!("启动系统属性失败: {}", e))?;
            }
            "temp" => {
                let temp = std::env::temp_dir();
                let _ = std::process::Command::new("explorer")
                    .arg(temp)
                    .spawn()
                    .map_err(|e| format!("打开临时目录失败: {}", e))?;
            }
            _ => return Err(format!("未知系统工具: {}", tool_name)),
        }
        Ok(())
    }
    #[cfg(not(windows))]
    {
        Err("仅支持 Windows 操作系统".into())
    }
}
