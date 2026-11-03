use crate::services::storage::get_app_data_dir;
use base64::Engine as _;
use base64::engine::general_purpose::STANDARD;
use std::fs;
use std::path::{Path, PathBuf};

const MAX_WALLPAPER_BYTES: u64 = 20 * 1024 * 1024;

fn wallpapers_dir() -> PathBuf {
    let dir = get_app_data_dir()
        .join("theme_wallpapers")
        .join("backgrounds");
    let _ = fs::create_dir_all(&dir);
    dir
}

fn safe_id(id: &str) -> Result<String, String> {
    let safe: String = id
        .chars()
        .filter(|c| c.is_ascii_alphanumeric() || *c == '-' || *c == '_')
        .collect();
    if safe.is_empty() {
        return Err("无效的壁纸标识 ID".to_string());
    }
    Ok(safe)
}

fn extension_from_image_bytes(bytes: &[u8]) -> Option<&'static str> {
    if bytes.starts_with(&[0x89, b'P', b'N', b'G', 0x0D, 0x0A, 0x1A, 0x0A]) {
        Some("png")
    } else if bytes.starts_with(&[0xFF, 0xD8, 0xFF]) {
        Some("jpg")
    } else if bytes.len() >= 12 && &bytes[0..4] == b"RIFF" && &bytes[8..12] == b"WEBP" {
        Some("webp")
    } else if bytes.starts_with(b"BM") {
        Some("bmp")
    } else {
        None
    }
}

fn save_wallpaper_bytes(id: &str, bytes: &[u8]) -> Result<String, String> {
    if bytes.is_empty() {
        return Err("壁纸图片为空".to_string());
    }
    if bytes.len() as u64 > MAX_WALLPAPER_BYTES {
        return Err("壁纸图片不能超过 20 MB".to_string());
    }

    let extension = extension_from_image_bytes(bytes)
        .ok_or_else(|| "图片格式无效，仅支持 PNG、JPG、WebP 和 BMP".to_string())?;
    let path = wallpapers_dir().join(format!("{}.{}", safe_id(id)?, extension));
    fs::write(&path, bytes).map_err(|e| format!("保存壁纸失败: {}", e))?;
    Ok(path.to_string_lossy().to_string())
}

/// 保存由前端文件选择器读取的图片字节。
pub fn save_custom_wallpaper(id: &str, data_url: &str) -> Result<String, String> {
    let (header, payload) = data_url
        .split_once(',')
        .ok_or_else(|| "壁纸图片数据格式无效".to_string())?;
    if !header.starts_with("data:image/") || !header.contains(";base64") {
        return Err("壁纸图片必须是受支持的 Base64 图片数据".to_string());
    }
    let max_encoded_len = MAX_WALLPAPER_BYTES.div_ceil(3) * 4 + 4;
    if payload.len() as u64 > max_encoded_len {
        return Err("壁纸图片不能超过 20 MB".to_string());
    }

    let bytes = STANDARD
        .decode(payload.trim())
        .map_err(|e| format!("解码壁纸图片失败: {}", e))?;
    save_wallpaper_bytes(id, &bytes)
}

/// 将用户拖入窗口的原图复制到应用数据目录，不依赖原文件继续存在。
pub fn import_custom_wallpaper(id: &str, source_path: &str) -> Result<String, String> {
    let source = Path::new(source_path);
    let metadata = fs::metadata(source).map_err(|e| format!("读取壁纸文件信息失败: {}", e))?;
    if !metadata.is_file() {
        return Err("所选路径不是图片文件".to_string());
    }
    if metadata.len() > MAX_WALLPAPER_BYTES {
        return Err("壁纸图片不能超过 20 MB".to_string());
    }

    let bytes = fs::read(source).map_err(|e| format!("读取壁纸图片失败: {}", e))?;
    save_wallpaper_bytes(id, &bytes)
}

/// 删除应用壁纸目录中的副本，拒绝删除目录外文件。
pub fn delete_custom_wallpaper(image_path: &str) -> Result<(), String> {
    let target = Path::new(image_path);
    if !target.exists() {
        return Ok(());
    }

    let wallpapers = wallpapers_dir();
    let canonical_dir =
        fs::canonicalize(&wallpapers).map_err(|e| format!("校验壁纸目录失败: {}", e))?;
    let canonical_target =
        fs::canonicalize(target).map_err(|e| format!("校验待删除壁纸失败: {}", e))?;
    if !canonical_target.starts_with(&canonical_dir) {
        return Err("安全拦截：只能删除应用壁纸目录内的文件".to_string());
    }

    fs::remove_file(canonical_target).map_err(|e| format!("删除壁纸失败: {}", e))
}

#[cfg(test)]
mod tests {
    use super::extension_from_image_bytes;

    #[test]
    fn detects_supported_wallpaper_signatures() {
        assert_eq!(
            extension_from_image_bytes(b"\x89PNG\r\n\x1a\n..."),
            Some("png")
        );
        assert_eq!(extension_from_image_bytes(b"\xff\xd8\xff..."), Some("jpg"));
        assert_eq!(extension_from_image_bytes(b"RIFFxxxxWEBP..."), Some("webp"));
        assert_eq!(extension_from_image_bytes(b"BM..."), Some("bmp"));
        assert_eq!(extension_from_image_bytes(b"not an image"), None);
    }
}
