use std::sync::Mutex;
use std::thread::JoinHandle;

/// 用于标识“以管理员重启时等待旧进程退出”的命令行参数名
pub const RELAUNCH_WAIT_PID_ARG: &str = "--relaunch-wait-pid";

#[cfg(windows)]
const DEFAULT_MUTEX_NAME: &str = "Local\\com.flingtrainer.manager.single_instance.mutex";
#[cfg(windows)]
const DEFAULT_EVENT_NAME: &str = "Local\\com.flingtrainer.manager.single_instance.wakeup";

/// 单实例检测结果
pub enum AcquireOutcome {
    /// 当前进程成功抢占唯一主实例锁
    Primary(SingleInstanceGuard),
    /// 已有主实例正在运行（且已向其发送唤醒信号），当前次级进程应立即退出
    SecondaryNotified,
}

/// 主实例守卫：持有跨进程互斥体与唤醒事件句柄，并在释放时安全回收后台监听线程
pub struct SingleInstanceGuard {
    #[cfg(windows)]
    mutex_handle: isize,
    #[cfg(windows)]
    wakeup_event_handle: isize,
    #[cfg(windows)]
    stop_event_handle: isize,
    #[cfg(windows)]
    listener_handle: Option<JoinHandle<()>>,
}

impl SingleInstanceGuard {
    #[cfg(not(windows))]
    fn empty() -> Self {
        Self {}
    }

    /// 在守卫生命周期内启动后台唤醒监听线程；当次级进程发出唤醒信号时执行回调
    pub fn start_wakeup_listener<F>(&mut self, on_wakeup: F)
    where
        F: Fn() + Send + 'static,
    {
        #[cfg(windows)]
        {
            use windows_sys::Win32::Foundation::{HANDLE, WAIT_OBJECT_0};
            use windows_sys::Win32::System::Threading::{INFINITE, WaitForMultipleObjects};

            if self.listener_handle.is_some()
                || self.wakeup_event_handle == 0
                || self.stop_event_handle == 0
            {
                return;
            }

            let stop_raw = self.stop_event_handle;
            let wakeup_raw = self.wakeup_event_handle;

            if let Ok(handle) = std::thread::Builder::new()
                .name("single-instance-wakeup".to_string())
                .spawn(move || {
                    let handles = [stop_raw as HANDLE, wakeup_raw as HANDLE];
                    loop {
                        // 0 号位为退出事件、1 号位为唤醒事件；二者同时就绪时优先响应退出事件
                        let wait_res =
                            unsafe { WaitForMultipleObjects(2, handles.as_ptr(), 0, INFINITE) };
                        if wait_res == WAIT_OBJECT_0 {
                            break;
                        } else if wait_res == WAIT_OBJECT_0 + 1 {
                            on_wakeup();
                        } else {
                            break;
                        }
                    }
                })
            {
                self.listener_handle = Some(handle);
            }
        }
        #[cfg(not(windows))]
        {
            let _ = on_wakeup;
        }
    }
}

impl Drop for SingleInstanceGuard {
    fn drop(&mut self) {
        #[cfg(windows)]
        {
            use windows_sys::Win32::Foundation::{CloseHandle, HANDLE};
            use windows_sys::Win32::System::Threading::SetEvent;

            // 先触发停止事件唤醒阻塞中的 WaitForMultipleObjects，再回收线程句柄，避免句柄提前关闭造成竞态
            if self.stop_event_handle != 0 {
                unsafe {
                    let _ = SetEvent(self.stop_event_handle as HANDLE);
                }
            }

            if let Some(join_handle) = self.listener_handle.take() {
                if std::thread::current().id() != join_handle.thread().id() {
                    let _ = join_handle.join();
                }
            }

            unsafe {
                if self.mutex_handle != 0 {
                    let _ = CloseHandle(self.mutex_handle as HANDLE);
                    self.mutex_handle = 0;
                }
                if self.wakeup_event_handle != 0 {
                    let _ = CloseHandle(self.wakeup_event_handle as HANDLE);
                    self.wakeup_event_handle = 0;
                }
                if self.stop_event_handle != 0 {
                    let _ = CloseHandle(self.stop_event_handle as HANDLE);
                    self.stop_event_handle = 0;
                }
            }
        }
    }
}

static ACTIVE_GUARD: Mutex<Option<SingleInstanceGuard>> = Mutex::new(None);

/// 从当前进程命令行参数解析提权重启前旧进程的 PID
pub fn parse_relaunch_wait_pid() -> Option<u32> {
    parse_relaunch_wait_pid_from_args(std::env::args())
}

/// 从给定参数迭代器中解析 `--relaunch-wait-pid <pid>` 或 `--relaunch-wait-pid=<pid>`
pub fn parse_relaunch_wait_pid_from_args<I, S>(args: I) -> Option<u32>
where
    I: IntoIterator<Item = S>,
    S: AsRef<str>,
{
    let self_pid = std::process::id();
    let eq_prefix = format!("{}=", RELAUNCH_WAIT_PID_ARG);
    let mut iter = args.into_iter();

    while let Some(arg) = iter.next() {
        let s = arg.as_ref();
        if s == RELAUNCH_WAIT_PID_ARG {
            if let Some(next_val) = iter.next() {
                if let Ok(pid) = next_val.as_ref().trim().parse::<u32>() {
                    if pid != 0 && pid != self_pid {
                        return Some(pid);
                    }
                }
            }
        } else if let Some(rest) = s.strip_prefix(&eq_prefix) {
            if let Ok(pid) = rest.trim().parse::<u32>() {
                if pid != 0 && pid != self_pid {
                    return Some(pid);
                }
            }
        }
    }

    None
}

/// 注册当前主实例守卫到全局槽位
pub fn set_active_guard(guard: SingleInstanceGuard) {
    if let Ok(mut slot) = ACTIVE_GUARD.lock() {
        *slot = Some(guard);
    }
}

/// 在全局主实例守卫上挂载唤醒回调监听线程
pub fn start_active_wakeup_listener<F>(on_wakeup: F)
where
    F: Fn() + Send + 'static,
{
    if let Ok(mut slot) = ACTIVE_GUARD.lock() {
        if let Some(guard) = slot.as_mut() {
            guard.start_wakeup_listener(on_wakeup);
        }
    }
}

/// 主动释放全局主实例守卫（用于退出或提权重启前清理锁与监听线程）
pub fn release_active_guard() {
    let taken = ACTIVE_GUARD
        .lock()
        .ok()
        .and_then(|mut slot| slot.take());
    // 在释放全局互斥锁后再执行 Drop（其中包含 thread.join），防止任何潜在锁序死锁
    drop(taken);
}

/// 生命周期作用域守卫：确保 `run()` 正常返回或意外展开时同样清理全局单实例守卫
pub struct ActiveGuardScope;

impl Drop for ActiveGuardScope {
    fn drop(&mut self) {
        release_active_guard();
    }
}

/// 尝试抢占全局单实例锁；若已有实例运行则唤醒旧实例并返回 `SecondaryNotified`
pub fn acquire_or_notify(relaunch_wait_pid: Option<u32>) -> AcquireOutcome {
    #[cfg(windows)]
    {
        acquire_or_notify_with_names(DEFAULT_MUTEX_NAME, DEFAULT_EVENT_NAME, relaunch_wait_pid)
    }
    #[cfg(not(windows))]
    {
        let _ = relaunch_wait_pid;
        AcquireOutcome::Primary(SingleInstanceGuard::empty())
    }
}

#[cfg(windows)]
enum AcquireAttempt {
    Acquired(SingleInstanceGuard),
    AlreadyRunning,
    Failed,
}

#[cfg(windows)]
fn to_wide(s: &str) -> Vec<u16> {
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;
    OsStr::new(s)
        .encode_wide()
        .chain(std::iter::once(0))
        .collect()
}

#[cfg(windows)]
struct OwnedSecurityAttributes {
    sd: windows_sys::Win32::Security::PSECURITY_DESCRIPTOR,
    sa: windows_sys::Win32::Security::SECURITY_ATTRIBUTES,
}

#[cfg(windows)]
impl OwnedSecurityAttributes {
    /// 构造允许同会话标准权限（Medium IL）与管理员提权（High IL）互通的内核对象安全属性
    fn new_cross_il() -> Option<Self> {
        use windows_sys::Win32::Security::Authorization::{
            ConvertStringSecurityDescriptorToSecurityDescriptorW, SDDL_REVISION_1,
        };
        use windows_sys::Win32::Security::{PSECURITY_DESCRIPTOR, SECURITY_ATTRIBUTES};

        // 授予 System、Built-in Administrators、Authenticated Users 完全访问权，
        // 并将强制完整性标签设置为 Medium (ME) + No-Write-Up (NW)，
        // 确保管理员主实例驻留托盘时，普通权限双击启动的新进程依然能检测到并唤醒它。
        let sddl = to_wide("D:(A;;GA;;;SY)(A;;GA;;;BA)(A;;GA;;;AU)S:(ML;;NW;;;ME)");
        let mut sd: PSECURITY_DESCRIPTOR = std::ptr::null_mut();
        let ok = unsafe {
            ConvertStringSecurityDescriptorToSecurityDescriptorW(
                sddl.as_ptr(),
                SDDL_REVISION_1,
                &mut sd,
                std::ptr::null_mut(),
            )
        };
        if ok == 0 || sd.is_null() {
            return None;
        }
        let sa = SECURITY_ATTRIBUTES {
            nLength: std::mem::size_of::<SECURITY_ATTRIBUTES>() as u32,
            lpSecurityDescriptor: sd,
            bInheritHandle: 0,
        };
        Some(Self { sd, sa })
    }

    fn as_ptr(&self) -> *const windows_sys::Win32::Security::SECURITY_ATTRIBUTES {
        &self.sa as *const windows_sys::Win32::Security::SECURITY_ATTRIBUTES
    }
}

#[cfg(windows)]
impl Drop for OwnedSecurityAttributes {
    fn drop(&mut self) {
        if !self.sd.is_null() {
            unsafe {
                let _ = windows_sys::Win32::Foundation::LocalFree(
                    self.sd as windows_sys::Win32::Foundation::HLOCAL,
                );
            }
            self.sd = std::ptr::null_mut();
        }
    }
}

#[cfg(windows)]
fn acquire_once_with_names(mutex_name: &str, event_name: &str) -> AcquireAttempt {
    use windows_sys::Win32::Foundation::{
        CloseHandle, ERROR_ACCESS_DENIED, ERROR_ALREADY_EXISTS, GetLastError,
    };
    use windows_sys::Win32::System::Threading::{CreateEventW, CreateMutexW};

    let mutex_wide = to_wide(mutex_name);
    let event_wide = to_wide(event_name);
    let sa_opt = OwnedSecurityAttributes::new_cross_il();
    let sa_ptr = sa_opt
        .as_ref()
        .map_or(std::ptr::null(), |sa| sa.as_ptr());

    // 先尝试附带跨完整性级别安全属性创建互斥体；若极端系统策略拒绝自定义安全描述符则回退默认安全属性
    let (mutex, last_err) = unsafe {
        let m = CreateMutexW(sa_ptr, 0, mutex_wide.as_ptr());
        let e = GetLastError();
        if m.is_null() && e != ERROR_ACCESS_DENIED && e != ERROR_ALREADY_EXISTS && !sa_ptr.is_null()
        {
            let fallback_m = CreateMutexW(std::ptr::null(), 0, mutex_wide.as_ptr());
            let fallback_e = GetLastError();
            (fallback_m, fallback_e)
        } else {
            (m, e)
        }
    };

    if mutex.is_null() {
        return if last_err == ERROR_ACCESS_DENIED || last_err == ERROR_ALREADY_EXISTS {
            AcquireAttempt::AlreadyRunning
        } else {
            AcquireAttempt::Failed
        };
    }

    if last_err == ERROR_ALREADY_EXISTS {
        // 已有主实例持有该互斥体，立即关闭自身重复句柄避免延长互斥体内核对象生命周期
        unsafe {
            let _ = CloseHandle(mutex);
        }
        return AcquireAttempt::AlreadyRunning;
    }

    // 主实例紧接着创建自动复位命名唤醒事件，防止并发双击启动时出现事件未就绪窗口
    let wakeup_event = unsafe {
        let ev = CreateEventW(sa_ptr, 0, 0, event_wide.as_ptr());
        if ev.is_null() && !sa_ptr.is_null() {
            CreateEventW(std::ptr::null(), 0, 0, event_wide.as_ptr())
        } else {
            ev
        }
    };

    let stop_event = unsafe { CreateEventW(std::ptr::null(), 1, 0, std::ptr::null()) };

    AcquireAttempt::Acquired(SingleInstanceGuard {
        mutex_handle: mutex as isize,
        wakeup_event_handle: if wakeup_event.is_null() {
            0
        } else {
            wakeup_event as isize
        },
        stop_event_handle: if stop_event.is_null() {
            0
        } else {
            stop_event as isize
        },
        listener_handle: None,
    })
}

#[cfg(windows)]
fn wait_for_old_process_exit(old_pid: u32) {
    use windows_sys::Win32::Foundation::CloseHandle;
    use windows_sys::Win32::System::Threading::{
        OpenProcess, PROCESS_SYNCHRONIZE, WaitForSingleObject,
    };

    let proc_handle = unsafe { OpenProcess(PROCESS_SYNCHRONIZE, 0, old_pid) };
    if !proc_handle.is_null() {
        unsafe {
            let _ = WaitForSingleObject(proc_handle, 5000);
            let _ = CloseHandle(proc_handle);
        }
    }
}

#[cfg(windows)]
fn notify_existing_instance(event_name: &str) -> bool {
    use windows_sys::Win32::Foundation::{
        CloseHandle, ERROR_ACCESS_DENIED, ERROR_FILE_NOT_FOUND, GetLastError,
    };
    use windows_sys::Win32::System::Threading::{EVENT_MODIFY_STATE, OpenEventW, SetEvent};
    use windows_sys::Win32::UI::WindowsAndMessaging::{ASFW_ANY, AllowSetForegroundWindow};

    let event_wide = to_wide(event_name);

    // 应对极短时间窗口内的并发双击：若主实例刚拿到互斥体但尚未完成 CreateEventW，短暂重试打开唤醒事件
    for attempt in 0..20 {
        let h_event = unsafe { OpenEventW(EVENT_MODIFY_STATE, 0, event_wide.as_ptr()) };
        if !h_event.is_null() {
            unsafe {
                // 次级进程由用户刚触发启动，拥有系统前台激活权，提前放行 AllowSetForegroundWindow 让旧主窗能顺利置顶
                let _ = AllowSetForegroundWindow(ASFW_ANY);
                let _ = SetEvent(h_event);
                let _ = CloseHandle(h_event);
            }
            return true;
        }

        let err = unsafe { GetLastError() };
        if err == ERROR_FILE_NOT_FOUND && attempt < 19 {
            std::thread::sleep(std::time::Duration::from_millis(25));
            continue;
        }
        if err == ERROR_ACCESS_DENIED {
            break;
        }
        break;
    }

    false
}

#[cfg(windows)]
pub fn acquire_or_notify_with_names(
    mutex_name: &str,
    event_name: &str,
    relaunch_wait_pid: Option<u32>,
) -> AcquireOutcome {
    match acquire_once_with_names(mutex_name, event_name) {
        AcquireAttempt::Acquired(guard) => return AcquireOutcome::Primary(guard),
        AcquireAttempt::Failed => {
            // 极端系统故障时为避免死锁拒绝启动，放行当前进程运行
            return AcquireOutcome::Primary(SingleInstanceGuard {
                mutex_handle: 0,
                wakeup_event_handle: 0,
                stop_event_handle: 0,
                listener_handle: None,
            });
        }
        AcquireAttempt::AlreadyRunning => {}
    }

    // 若本次启动由“以管理员重启”拉起，先等待旧进程退出并释放互斥体，彻底消除提权交接竞态
    if let Some(old_pid) = relaunch_wait_pid {
        wait_for_old_process_exit(old_pid);

        for attempt in 0..20 {
            match acquire_once_with_names(mutex_name, event_name) {
                AcquireAttempt::Acquired(guard) => return AcquireOutcome::Primary(guard),
                AcquireAttempt::AlreadyRunning if attempt < 19 => {
                    std::thread::sleep(std::time::Duration::from_millis(25));
                }
                _ => break,
            }
        }
    }

    let _ = notify_existing_instance(event_name);
    AcquireOutcome::SecondaryNotified
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_relaunch_wait_pid_variants() {
        assert_eq!(
            parse_relaunch_wait_pid_from_args(["app.exe", "--relaunch-wait-pid", "4242"]),
            Some(4242)
        );
        assert_eq!(
            parse_relaunch_wait_pid_from_args(["app.exe", "--foo", "--relaunch-wait-pid=9876"]),
            Some(9876)
        );
        assert_eq!(
            parse_relaunch_wait_pid_from_args(["app.exe", "--relaunch-wait-pid", "0"]),
            None
        );
        assert_eq!(
            parse_relaunch_wait_pid_from_args([
                "app.exe",
                "--relaunch-wait-pid",
                &std::process::id().to_string(),
            ]),
            None
        );
        assert_eq!(
            parse_relaunch_wait_pid_from_args(["app.exe", "--relaunch-wait-pid", "not-a-number"]),
            None
        );
        assert_eq!(parse_relaunch_wait_pid_from_args(["app.exe"]), None);
    }

    #[cfg(windows)]
    #[test]
    fn test_single_instance_primary_secondary_wakeup_and_release() {
        use std::sync::Arc;
        use std::sync::atomic::{AtomicUsize, Ordering};

        let unique = format!(
            "{}_{}",
            std::process::id(),
            chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0)
        );
        let mutex_name = format!("Local\\fling_test_mutex_{}", unique);
        let event_name = format!("Local\\fling_test_event_{}", unique);

        // 1. 首次获取：必须成功成为主实例
        let mut primary_guard = match acquire_or_notify_with_names(&mutex_name, &event_name, None) {
            AcquireOutcome::Primary(guard) => guard,
            AcquireOutcome::SecondaryNotified => panic!("首次抢占单实例锁不应被判定为次级实例"),
        };

        let wakeup_count = Arc::new(AtomicUsize::new(0));
        let wakeup_count_clone = Arc::clone(&wakeup_count);
        primary_guard.start_wakeup_listener(move || {
            wakeup_count_clone.fetch_add(1, Ordering::SeqCst);
        });

        // 2. 第二次、第三次获取：必须被拦截并返回 SecondaryNotified，同时累加唤醒主实例次数
        for expected in 1..=2 {
            match acquire_or_notify_with_names(&mutex_name, &event_name, None) {
                AcquireOutcome::Primary(_) => panic!("主实例仍在运行时，重复启动绝对不能再次拿到锁"),
                AcquireOutcome::SecondaryNotified => {}
            }

            let deadline = std::time::Instant::now() + std::time::Duration::from_secs(2);
            while wakeup_count.load(Ordering::SeqCst) < expected
                && std::time::Instant::now() < deadline
            {
                std::thread::sleep(std::time::Duration::from_millis(10));
            }
            assert_eq!(
                wakeup_count.load(Ordering::SeqCst),
                expected,
                "第 {} 次重复启动应精确触发 1 次主实例唤醒信号",
                expected
            );
        }

        // 3. 释放主实例守卫后，再次启动应能够正常接管成为新的主实例
        drop(primary_guard);

        let third_guard = match acquire_or_notify_with_names(&mutex_name, &event_name, None) {
            AcquireOutcome::Primary(guard) => guard,
            AcquireOutcome::SecondaryNotified => panic!("主实例退出释放锁后，新启动应能正常成为主实例"),
        };
        drop(third_guard);
    }

    #[cfg(windows)]
    #[test]
    fn test_relaunch_wait_pid_succeeds_after_old_lock_released() {
        let unique = format!(
            "relaunch_{}_{}",
            std::process::id(),
            chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0)
        );
        let mutex_name = format!("Local\\fling_test_mutex_{}", unique);
        let event_name = format!("Local\\fling_test_event_{}", unique);

        let primary_guard = match acquire_or_notify_with_names(&mutex_name, &event_name, None) {
            AcquireOutcome::Primary(guard) => guard,
            AcquireOutcome::SecondaryNotified => panic!("首次获取锁失败"),
        };

        // 模拟旧进程在 80ms 后才完成清理并释放锁，同时传入一个不存在的旧 PID 触发重试等待窗口
        let releaser = std::thread::spawn(move || {
            std::thread::sleep(std::time::Duration::from_millis(80));
            drop(primary_guard);
        });

        let relaunched = acquire_or_notify_with_names(&mutex_name, &event_name, Some(u32::MAX));
        releaser.join().unwrap();

        match relaunched {
            AcquireOutcome::Primary(guard) => drop(guard),
            AcquireOutcome::SecondaryNotified => {
                panic!("提权重启交接期在旧锁释放后应顺利接管主实例")
            }
        }
    }
}
