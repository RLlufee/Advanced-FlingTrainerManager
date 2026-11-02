use crate::services::config::build_custom_http_client;
use crate::services::storage::get_app_data_dir;
use base64::engine::general_purpose::STANDARD;
use base64::Engine as _;
use std::fs;
use std::path::{Path, PathBuf};

/// 获取持久化保存莫奈自定义壁纸缩略图的专属目录
pub fn get_theme_wallpapers_dir() -> PathBuf {
    let dir = get_app_data_dir().join("theme_wallpapers");
    if !dir.exists() {
        let _ = fs::create_dir_all(&dir);
    }
    dir
}

/// 读取 Windows 系统当前主题强调色 (DWM AccentColor / Explorer Accent)
/// 注意：Windows DWM AccentColor 注册表项为 ABGR (COLORREF) 字节序：
/// 最低字节为 Red，次低字节为 Green，第三字节为 Blue。
pub fn get_windows_accent_color() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        use winreg::enums::HKEY_CURRENT_USER;
        use winreg::RegKey;

        let hkcu = RegKey::predef(HKEY_CURRENT_USER);

        // 1. 优先读取 DWM\AccentColor (ABGR DWORD)
        if let Ok(dwm) = hkcu.open_subkey("Software\\Microsoft\\Windows\\DWM") {
            if let Ok(val) = dwm.get_value::<u32, _>("AccentColor") {
                let r = (val & 0xFF) as u8;
                let g = ((val >> 8) & 0xFF) as u8;
                let b = ((val >> 16) & 0xFF) as u8;
                if r != 0 || g != 0 || b != 0 {
                    return Ok(format!("#{:02x}{:02x}{:02x}", r, g, b));
                }
            }
        }

        // 2. 备选读取 Explorer\Accent\AccentColorMenu (ABGR DWORD)
        if let Ok(accent) =
            hkcu.open_subkey("Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Accent")
        {
            if let Ok(val) = accent.get_value::<u32, _>("AccentColorMenu") {
                let r = (val & 0xFF) as u8;
                let g = ((val >> 8) & 0xFF) as u8;
                let b = ((val >> 16) & 0xFF) as u8;
                if r != 0 || g != 0 || b != 0 {
                    return Ok(format!("#{:02x}{:02x}{:02x}", r, g, b));
                }
            }
        }

        // 3. 备选读取 DWM\ColorizationColor (此项为 ARGB 字节序)
        if let Ok(dwm) = hkcu.open_subkey("Software\\Microsoft\\Windows\\DWM") {
            if let Ok(val) = dwm.get_value::<u32, _>("ColorizationColor") {
                if (val & 0x00FF_FFFF) != 0 {
                    let r = ((val >> 16) & 0xFF) as u8;
                    let g = ((val >> 8) & 0xFF) as u8;
                    let b = (val & 0xFF) as u8;
                    return Ok(format!("#{:02x}{:02x}{:02x}", r, g, b));
                }
            }
        }

        Ok("#0078d4".to_string())
    }

    #[cfg(not(target_os = "windows"))]
    {
        Ok("#0078d4".to_string())
    }
}

/// 将前端压缩好的莫奈取色预览缩略图持久化落盘到 app_data/theme_wallpapers/ 目录
/// 返回落盘后的本地文件绝对路径
pub fn save_monet_wallpaper_thumbnail(id: &str, data_url: &str) -> Result<String, String> {
    // 仅保留安全的文件名字符，防止路径穿越
    let safe_id: String = id
        .chars()
        .filter(|c| c.is_ascii_alphanumeric() || *c == '-' || *c == '_')
        .collect();
    if safe_id.is_empty() {
        return Err("无效的图片标识 ID".to_string());
    }

    let (ext, b64_payload) = if let Some(comma_idx) = data_url.find(',') {
        let header = &data_url[..comma_idx];
        let ext = if header.contains("image/png") {
            "png"
        } else if header.contains("image/webp") {
            "webp"
        } else {
            "jpg"
        };
        (ext, &data_url[comma_idx + 1..])
    } else {
        ("jpg", data_url)
    };

    let bytes = STANDARD
        .decode(b64_payload.trim())
        .map_err(|e| format!("解码图片 Base64 数据失败: {}", e))?;

    let target_file = get_theme_wallpapers_dir().join(format!("{}.{}", safe_id, ext));
    fs::write(&target_file, bytes).map_err(|e| format!("保存主题壁纸缩略图失败: {}", e))?;

    Ok(target_file.to_string_lossy().to_string())
}

/// 删除已保存的莫奈壁纸缩略图文件（严格校验目录边界，仅允许删除 theme_wallpapers 内文件）
pub fn delete_monet_wallpaper_file(image_path: &str) -> Result<(), String> {
    let target = Path::new(image_path);
    if !target.exists() {
        return Ok(());
    }

    let wallpapers_dir = get_theme_wallpapers_dir();
    let canon_dir = fs::canonicalize(&wallpapers_dir)
        .map_err(|e| format!("校验主题图片目录失败: {}", e))?;
    let canon_target =
        fs::canonicalize(target).map_err(|e| format!("校验待删除图片路径失败: {}", e))?;

    if !canon_target.starts_with(&canon_dir) {
        return Err("安全拦截：禁止删除主题缓存目录以外的文件".to_string());
    }

    fs::remove_file(&canon_target).map_err(|e| format!("删除主题缩略图失败: {}", e))?;
    Ok(())
}

/// 根据文件头魔数推断常见图片 MIME 类型
fn detect_image_mime(bytes: &[u8]) -> &'static str {
    if bytes.starts_with(&[0x89, 0x50, 0x4E, 0x47]) {
        "image/png"
    } else if bytes.starts_with(&[0xFF, 0xD8, 0xFF]) {
        "image/jpeg"
    } else if bytes.len() >= 12 && &bytes[0..4] == b"RIFF" && &bytes[8..12] == b"WEBP" {
        "image/webp"
    } else if bytes.starts_with(b"GIF8") {
        "image/gif"
    } else if bytes.starts_with(b"BM") {
        "image/bmp"
    } else {
        "image/jpeg"
    }
}

/// 读取本地图片路径或远程 HTTP(S) 图片为 Data URL，彻底规避浏览器 Canvas 跨域污染 (CORS Taint)
pub async fn read_image_as_data_url(source: &str) -> Result<String, String> {
    let trimmed = source.trim();
    if trimmed.is_empty() {
        return Err("图片地址为空".to_string());
    }
    if trimmed.starts_with("data:image/") {
        return Ok(trimmed.to_string());
    }

    let max_bytes: usize = 20 * 1024 * 1024; // 20MB 安全上限

    let bytes = if trimmed.starts_with("http://") || trimmed.starts_with("https://") {
        let client = build_custom_http_client()?;
        let resp = client
            .get(trimmed)
            .send()
            .await
            .map_err(|e| format!("拉取远程图片失败: {}", e))?;
        if !resp.status().is_success() {
            return Err(format!("远程图片响应异常: HTTP {}", resp.status().as_u16()));
        }
        let raw = resp
            .bytes()
            .await
            .map_err(|e| format!("读取远程图片字节流失败: {}", e))?;
        if raw.len() > max_bytes {
            return Err("远程图片体积超过 20MB 安全限制".to_string());
        }
        raw.to_vec()
    } else {
        let p = Path::new(trimmed);
        if !p.exists() {
            return Err(format!("本地图片不存在: {}", trimmed));
        }
        let meta = fs::metadata(p).map_err(|e| format!("读取图片元数据失败: {}", e))?;
        if meta.len() as usize > max_bytes {
            return Err("本地图片体积超过 20MB 安全限制，请压缩后再试".to_string());
        }
        fs::read(p).map_err(|e| format!("读取本地图片失败: {}", e))?
    };

    if bytes.is_empty() {
        return Err("图片内容为空".to_string());
    }

    let mime = detect_image_mime(&bytes);
    let b64 = STANDARD.encode(&bytes);
    Ok(format!("data:{};base64,{}", mime, b64))
}
