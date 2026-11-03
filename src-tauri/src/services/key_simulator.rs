use std::time::Duration;
use tokio::time::sleep;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ParsedHotkey {
    pub raw: String,
    pub ctrl: bool,
    pub alt: bool,
    pub shift: bool,
    pub vk: u16,
}

/// 从可能包含描述的字符串中提取纯热键部分
/// 例如: "Num 1 - Infinite Health" -> "Num 1"
/// 例如: "Ctrl+Num 1 – Infinite Ammo" -> "Ctrl+Num 1"
pub fn extract_hotkey_from_title(title: &str) -> String {
    let t = title.trim();
    // 按照常见分隔符切分
    if let Some((prefix, _)) = t.split_once(" – ") {
        return prefix.trim().to_string();
    }
    if let Some((prefix, _)) = t.split_once(" - ") {
        return prefix.trim().to_string();
    }
    if let Some((prefix, _)) = t.split_once(":") {
        return prefix.trim().to_string();
    }
    t.to_string()
}

/// 解析热键字符串为虚拟键码和修饰键 (P1-11)
pub fn parse_hotkey(input: &str) -> Option<ParsedHotkey> {
    let hotkey_str = extract_hotkey_from_title(input);
    let trimmed = hotkey_str.trim();
    if trimmed.is_empty() {
        return None;
    }

    // 预处理小键盘加号：将 "num +" 或 "numpad +" 归一化为 "num_add"，避免 split('+') 破坏键位 (RUST-10)
    let lower_raw = trimmed.to_lowercase();
    let normalized = if lower_raw.contains("num +")
        || lower_raw.contains("numpad +")
        || lower_raw.contains("num+")
        || lower_raw.contains("numpad+")
    {
        lower_raw
            .replace("numpad +", "num_add")
            .replace("numpad+", "num_add")
            .replace("num +", "num_add")
            .replace("num+", "num_add")
    } else {
        lower_raw
    };

    let parts: Vec<&str> = normalized
        .split('+')
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .collect();
    if parts.is_empty() {
        return None;
    }

    let mut ctrl = false;
    let mut alt = false;
    let mut shift = false;
    let mut main_key_str: Option<&str> = None;

    for part in parts {
        match part {
            "ctrl" | "control" => ctrl = true,
            "alt" => alt = true,
            "shift" => shift = true,
            other => {
                // 单主键约束校验：遇到诸如 Ctrl+A+B 等非法多主键组合时，直接拒绝 (RUST-10)
                if main_key_str.is_some() {
                    return None;
                }
                main_key_str = Some(other);
            }
        }
    }

    let main_key = main_key_str?;
    let vk = resolve_virtual_key(main_key)?;

    Some(ParsedHotkey {
        raw: hotkey_str,
        ctrl,
        alt,
        shift,
        vk,
    })
}

/// 将键位名称解析为 Windows 虚拟键码 (补全常见缺失键位与小键盘加号 P1-11)
pub fn resolve_virtual_key(key: &str) -> Option<u16> {
    let k = key.trim().to_lowercase();

    // 1. 小键盘数字键与操作符
    if k == "num_add" || k == "add" {
        return Some(0x6B); // VK_ADD
    }
    if k.starts_with("num") {
        let rest = k
            .trim_start_matches("numpad")
            .trim_start_matches("num")
            .trim();
        match rest {
            "0" => return Some(0x60),                      // VK_NUMPAD0
            "1" => return Some(0x61),                      // VK_NUMPAD1
            "2" => return Some(0x62),                      // VK_NUMPAD2
            "3" => return Some(0x63),                      // VK_NUMPAD3
            "4" => return Some(0x64),                      // VK_NUMPAD4
            "5" => return Some(0x65),                      // VK_NUMPAD5
            "6" => return Some(0x66),                      // VK_NUMPAD6
            "7" => return Some(0x67),                      // VK_NUMPAD7
            "8" => return Some(0x68),                      // VK_NUMPAD8
            "9" => return Some(0x69),                      // VK_NUMPAD9
            "." | "decimal" | "dot" => return Some(0x6E),  // VK_DECIMAL
            "+" | "add" => return Some(0x6B),              // VK_ADD
            "-" | "sub" | "subtract" => return Some(0x6D), // VK_SUBTRACT
            "*" | "mul" | "multiply" => return Some(0x6A), // VK_MULTIPLY
            "/" | "div" | "divide" => return Some(0x6F),   // VK_DIVIDE
            _ => {}
        }
    }

    // 2. 功能键 F1 ~ F24
    if k.starts_with('f')
        && let Ok(num) = k[1..].parse::<u16>()
        && (1..=24).contains(&num)
    {
        return Some(0x70 + (num - 1)); // VK_F1 is 0x70, VK_F13 is 0x7C, VK_F24 is 0x87
    }

    // 3. 特殊导航键与常用键
    match k.as_str() {
        "page up" | "pageup" | "pgup" => return Some(0x21), // VK_PRIOR
        "page down" | "pagedown" | "pgdn" => return Some(0x22), // VK_NEXT
        "end" => return Some(0x23),                         // VK_END
        "home" => return Some(0x24),                        // VK_HOME
        "insert" | "ins" => return Some(0x2D),              // VK_INSERT
        "delete" | "del" => return Some(0x2E),              // VK_DELETE
        "space" | "spacebar" => return Some(0x20),          // VK_SPACE
        "tab" => return Some(0x09),                         // VK_TAB
        "esc" | "escape" => return Some(0x1B),              // VK_ESCAPE
        "enter" | "return" => return Some(0x0D),            // VK_RETURN
        "backspace" | "back" => return Some(0x08),          // VK_BACK
        "caps lock" | "caps" | "capslock" => return Some(0x14), // VK_CAPITAL
        "up" | "arrow up" | "arrowup" => return Some(0x26), // VK_UP
        "down" | "arrow down" | "arrowdown" => return Some(0x28), // VK_DOWN
        "left" | "arrow left" | "arrowleft" => return Some(0x25), // VK_LEFT
        "right" | "arrow right" | "arrowright" => return Some(0x27), // VK_RIGHT
        _ => {}
    }

    // 4. 主键盘普通数字 0 ~ 9 与字母 A ~ Z
    if k.len() == 1 {
        let ch = k.chars().next().unwrap();
        if ch.is_ascii_digit() {
            return Some(ch as u16); // '0' is 0x30 ~ '9' is 0x39
        }
        if ch.is_ascii_alphabetic() {
            return Some(ch.to_ascii_uppercase() as u16); // 'A' is 0x41 ~ 'Z' is 0x5A
        }
    }

    None
}

/// 执行单次热键序列模拟 (带修饰键、时序保护与 SendInput 返回值核验 P1-07)
#[cfg(target_os = "windows")]
pub async fn send_single_hotkey_with_hold(
    hotkey: &ParsedHotkey,
    hold_ms: u64,
) -> Result<(), String> {
    use windows_sys::Win32::UI::Input::KeyboardAndMouse::*;

    unsafe {
        let send_key = |vk: u16, is_up: bool, is_extended: bool| -> bool {
            let mut flags = 0u32;
            if is_up {
                flags |= KEYEVENTF_KEYUP;
            }
            if is_extended {
                flags |= KEYEVENTF_EXTENDEDKEY;
            }

            let input = INPUT {
                r#type: INPUT_KEYBOARD,
                Anonymous: INPUT_0 {
                    ki: KEYBDINPUT {
                        wVk: vk,
                        wScan: 0,
                        dwFlags: flags,
                        time: 0,
                        dwExtraInfo: 0,
                    },
                },
            };
            let ret = SendInput(1, &input, std::mem::size_of::<INPUT>() as i32);
            ret == 1
        };

        // 1. 压栈修饰键
        if hotkey.ctrl && !send_key(VK_CONTROL, false, false) {
            return Err("模拟按下 Ctrl 键失败，可能被 Windows UIPI 或权限拦截".to_string());
        }
        if hotkey.alt && !send_key(VK_MENU, false, false) {
            return Err("模拟按下 Alt 键失败，可能被 Windows UIPI 或权限拦截".to_string());
        }
        if hotkey.shift && !send_key(VK_SHIFT, false, false) {
            return Err("模拟按下 Shift 键失败，可能被 Windows UIPI 或权限拦截".to_string());
        }

        sleep(Duration::from_millis(30)).await;

        // 2. 发送主键 (KeyDown -> 延时 -> KeyUp)
        let is_extended = matches!(hotkey.vk, 0x21 | 0x22 | 0x23 | 0x24 | 0x2D | 0x2E | 0x6F);
        if !send_key(hotkey.vk, false, is_extended) {
            if hotkey.shift {
                send_key(VK_SHIFT, true, false);
            }
            if hotkey.alt {
                send_key(VK_MENU, true, false);
            }
            if hotkey.ctrl {
                send_key(VK_CONTROL, true, false);
            }
            return Err(format!(
                "模拟发送主键 (0x{:X}) 失败，SendInput 返回 0",
                hotkey.vk
            ));
        }
        sleep(Duration::from_millis(hold_ms)).await;
        send_key(hotkey.vk, true, is_extended);

        sleep(Duration::from_millis(25)).await;

        // 3. 弹栈释放修饰键
        if hotkey.shift {
            send_key(VK_SHIFT, true, false);
        }
        if hotkey.alt {
            send_key(VK_MENU, true, false);
        }
        if hotkey.ctrl {
            send_key(VK_CONTROL, true, false);
        }
    }

    Ok(())
}

/// 寻找指定修改器主程序的窗口并置前激活 (P1-07)
#[cfg(target_os = "windows")]
pub fn focus_window_for_exe(exe_name: &str) -> bool {
    use windows_sys::Win32::Foundation::*;
    use windows_sys::Win32::System::ProcessStatus::*;
    use windows_sys::Win32::System::Threading::*;
    use windows_sys::Win32::UI::WindowsAndMessaging::*;

    struct SearchCtx<'a> {
        target_exe: &'a str,
        found_hwnd: Option<HWND>,
    }

    unsafe extern "system" fn enum_windows_proc(hwnd: HWND, lparam: isize) -> BOOL {
        unsafe {
            let ctx = &mut *(lparam as *mut SearchCtx);
            if IsWindowVisible(hwnd) == 0 {
                return 1;
            }

            let mut pid: u32 = 0;
            GetWindowThreadProcessId(hwnd, &mut pid);
            if pid == 0 {
                return 1;
            }

            let handle = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, 0, pid);
            if !handle.is_null() {
                let mut name_buf = [0u16; 260];
                let len =
                    GetModuleBaseNameW(handle, std::ptr::null_mut(), name_buf.as_mut_ptr(), 260);
                CloseHandle(handle);
                if len > 0 {
                    let name = String::from_utf16_lossy(&name_buf[..len as usize]);
                    if name.eq_ignore_ascii_case(ctx.target_exe) {
                        ctx.found_hwnd = Some(hwnd);
                        return 0; // 找到目标窗口，停止遍历
                    }
                }
            }

            1
        }
    }

    let mut ctx = SearchCtx {
        target_exe: exe_name,
        found_hwnd: None,
    };

    unsafe {
        EnumWindows(Some(enum_windows_proc), &mut ctx as *mut SearchCtx as isize);
        if let Some(hwnd) = ctx.found_hwnd {
            SetForegroundWindow(hwnd);
            BringWindowToTop(hwnd);
            return true;
        }
    }
    false
}

#[cfg(target_os = "windows")]
pub async fn send_single_hotkey(hotkey: &ParsedHotkey) -> Result<(), String> {
    let config = crate::services::config::load_config();
    send_single_hotkey_with_hold(hotkey, config.hotkey.key_hold_ms).await
}

#[cfg(not(target_os = "windows"))]
pub async fn send_single_hotkey_with_hold(
    hotkey: &ParsedHotkey,
    hold_ms: u64,
) -> Result<(), String> {
    println!(
        "[Non-Windows Mock] Simulating hotkey: {:?} with hold {}ms",
        hotkey, hold_ms
    );
    sleep(Duration::from_millis(hold_ms)).await;
    Ok(())
}

#[cfg(not(target_os = "windows"))]
pub async fn send_single_hotkey(hotkey: &ParsedHotkey) -> Result<(), String> {
    send_single_hotkey_with_hold(hotkey, 40).await
}

/// 批量按序模拟热键列表（动态根据 AppConfig 读取间隔与按住时长）
pub async fn simulate_hotkeys_sequence(hotkey_strings: &[String]) -> Result<u32, String> {
    let config = crate::services::config::load_config();
    let interval_ms = config.hotkey.key_interval_ms.max(10);
    let hold_ms = config.hotkey.key_hold_ms.max(10);
    let mut success_count = 0u32;

    for raw in hotkey_strings {
        if let Some(parsed) = parse_hotkey(raw) {
            send_single_hotkey_with_hold(&parsed, hold_ms).await?;
            success_count += 1;
            // 每个热键之间间隔按照配置延时，给游戏和修改器充足的消息处理与反应周期
            sleep(Duration::from_millis(interval_ms)).await;
        }
    }

    Ok(success_count)
}
