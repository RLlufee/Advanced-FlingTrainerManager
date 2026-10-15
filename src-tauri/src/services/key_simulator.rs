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

/// 解析热键字符串为虚拟键码和修饰键
pub fn parse_hotkey(input: &str) -> Option<ParsedHotkey> {
    let hotkey_str = extract_hotkey_from_title(input);
    let parts: Vec<&str> = hotkey_str.split('+').map(|s| s.trim()).collect();
    if parts.is_empty() {
        return None;
    }

    let mut ctrl = false;
    let mut alt = false;
    let mut shift = false;
    let mut main_key_str = "";

    for part in parts {
        let lower = part.to_lowercase();
        if lower == "ctrl" || lower == "control" {
            ctrl = true;
        } else if lower == "alt" {
            alt = true;
        } else if lower == "shift" {
            shift = true;
        } else {
            main_key_str = part;
        }
    }

    if main_key_str.is_empty() {
        return None;
    }

    let vk = resolve_virtual_key(main_key_str)?;

    Some(ParsedHotkey {
        raw: hotkey_str,
        ctrl,
        alt,
        shift,
        vk,
    })
}

/// 将键位名称解析为 Windows 虚拟键码
fn resolve_virtual_key(key: &str) -> Option<u16> {
    let k = key.trim().to_lowercase();

    // 1. 小键盘数字键 "num 1", "num1", "numpad 1", "numpad1"
    if k.starts_with("num") {
        let rest = k.trim_start_matches("numpad").trim_start_matches("num").trim();
        match rest {
            "0" => return Some(0x60), // VK_NUMPAD0
            "1" => return Some(0x61), // VK_NUMPAD1
            "2" => return Some(0x62), // VK_NUMPAD2
            "3" => return Some(0x63), // VK_NUMPAD3
            "4" => return Some(0x64), // VK_NUMPAD4
            "5" => return Some(0x65), // VK_NUMPAD5
            "6" => return Some(0x66), // VK_NUMPAD6
            "7" => return Some(0x67), // VK_NUMPAD7
            "8" => return Some(0x68), // VK_NUMPAD8
            "9" => return Some(0x69), // VK_NUMPAD9
            "." | "decimal" | "dot" => return Some(0x6E), // VK_DECIMAL
            "+" | "add" => return Some(0x6B), // VK_ADD
            "-" | "sub" | "subtract" => return Some(0x6D), // VK_SUBTRACT
            "*" | "mul" | "multiply" => return Some(0x6A), // VK_MULTIPLY
            "/" | "div" | "divide" => return Some(0x6F), // VK_DIVIDE
            _ => {}
        }
    }

    // 2. 功能键 F1 ~ F12
    if k.starts_with('f') {
        if let Ok(num) = k[1..].parse::<u16>() {
            if (1..=12).contains(&num) {
                return Some(0x70 + (num - 1)); // VK_F1 is 0x70
            }
        }
    }

    // 3. 特殊导航键
    match k.as_str() {
        "page up" | "pageup" | "pgup" => return Some(0x21), // VK_PRIOR
        "page down" | "pagedown" | "pgdn" => return Some(0x22), // VK_NEXT
        "end" => return Some(0x23), // VK_END
        "home" => return Some(0x24), // VK_HOME
        "insert" | "ins" => return Some(0x2D), // VK_INSERT
        "delete" | "del" => return Some(0x2E), // VK_DELETE
        _ => {}
    }

    // 4. 主键盘普通数字 0 ~ 9
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

/// 执行单次热键序列模拟 (带修饰键与时序保护)
#[cfg(target_os = "windows")]
pub async fn send_single_hotkey(hotkey: &ParsedHotkey) -> Result<(), String> {
    use windows_sys::Win32::UI::Input::KeyboardAndMouse::*;

    unsafe {
        let send_key = |vk: u16, is_up: bool, is_extended: bool| {
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
            SendInput(1, &input, std::mem::size_of::<INPUT>() as i32);
        };

        // 1. 压栈修饰键
        if hotkey.ctrl {
            send_key(VK_CONTROL, false, false);
        }
        if hotkey.alt {
            send_key(VK_MENU, false, false);
        }
        if hotkey.shift {
            send_key(VK_SHIFT, false, false);
        }

        sleep(Duration::from_millis(30)).await;

        // 2. 发送主键 (KeyDown -> 延时 -> KeyUp)
        let is_extended = matches!(hotkey.vk, 0x21 | 0x22 | 0x23 | 0x24 | 0x2D | 0x2E | 0x6F);
        send_key(hotkey.vk, false, is_extended);
        sleep(Duration::from_millis(45)).await;
        send_key(hotkey.vk, true, is_extended);

        sleep(Duration::from_millis(30)).await;

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

#[cfg(not(target_os = "windows"))]
pub async fn send_single_hotkey(hotkey: &ParsedHotkey) -> Result<(), String> {
    println!("[Non-Windows Mock] Simulating hotkey: {:?}", hotkey);
    sleep(Duration::from_millis(80)).await;
    Ok(())
}

/// 批量按序模拟热键列表
pub async fn simulate_hotkeys_sequence(hotkey_strings: &[String]) -> Result<u32, String> {
    let mut success_count = 0u32;

    for raw in hotkey_strings {
        if let Some(parsed) = parse_hotkey(raw) {
            send_single_hotkey(&parsed).await?;
            success_count += 1;
            // 每个热键之间间隔 120ms，给修改器充足的消息处理与反应周期
            sleep(Duration::from_millis(120)).await;
        }
    }

    Ok(success_count)
}
