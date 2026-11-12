pub const USER_AGENT: &str =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
pub const BASE_URL: &str = "https://flingtrainer.com";

/// 校验并提取安全的修改器 Slug（阻断路径穿越、反斜杠与 URL 注入字符）
pub fn sanitize_trainer_slug(raw_id: &str) -> Result<String, String> {
    let trimmed = raw_id.trim().trim_matches('/');
    if trimmed.is_empty() {
        return Err("修改器 ID 不能为空".to_string());
    }

    // 兼容可能传入完整官方详情页前缀的场景，仅截取末段 slug 后再严格校验
    let candidate = if trimmed.starts_with("https://flingtrainer.com/")
        || trimmed.starts_with("https://www.flingtrainer.com/")
    {
        trimmed
            .split('/')
            .next_back()
            .unwrap_or("")
            .trim()
    } else {
        trimmed
    };

    if candidate.is_empty()
        || candidate == "."
        || candidate == ".."
        || candidate.contains("..")
        || candidate.contains('/')
        || candidate.contains('\\')
        || candidate.contains('?')
        || candidate.contains('#')
        || candidate.contains('@')
        || candidate.chars().any(|c| c.is_whitespace() || c.is_control())
    {
        return Err(format!("安全拦截：非法的修改器 ID '{}'", raw_id));
    }

    Ok(candidate.to_string())
}

/// 校验下载地址是否为官方 HTTPS 链接（仅允许 https:// 且域名限定为 flingtrainer.com 及其子域名）
pub fn validate_official_download_url(raw_url: &str) -> Result<String, String> {
    let trimmed = raw_url.trim();
    if trimmed.is_empty() {
        return Err("下载地址不能为空".to_string());
    }

    let parsed =
        reqwest::Url::parse(trimmed).map_err(|e| format!("下载地址格式非法: {}", e))?;

    if !parsed.scheme().eq_ignore_ascii_case("https") {
        return Err(format!(
            "安全拦截：仅允许通过 HTTPS 下载修改器，已拒绝 '{}'",
            parsed.scheme()
        ));
    }

    if !parsed.username().is_empty() || parsed.password().is_some() {
        return Err("安全拦截：下载链接禁止携带嵌入式认证信息".to_string());
    }

    let host = parsed
        .host_str()
        .ok_or_else(|| "安全拦截：下载链接缺少有效域名".to_string())?
        .to_ascii_lowercase();

    if host != "flingtrainer.com" && !host.ends_with(".flingtrainer.com") {
        return Err(format!(
            "安全拦截：拒绝从非官方域名 '{}' 下载修改器",
            host
        ));
    }

    Ok(parsed.to_string())
}

/// 获取全局共享的复用 HTTP 客户端（共享连接池与 TLS 会话，零冗余磁盘 I/O）
pub fn get_client() -> Result<reqwest::Client, String> {
    crate::services::config::get_shared_http_client()
}

/// 兼容旧方法，无缝走共享连接池复用
pub fn create_client() -> Result<reqwest::Client, String> {
    get_client()
}

pub fn urlencoding(input: &str) -> String {
    let mut encoded = String::new();
    for byte in input.bytes() {
        if byte.is_ascii_alphanumeric()
            || byte == b'-'
            || byte == b'_'
            || byte == b'.'
            || byte == b'~'
        {
            encoded.push(byte as char);
        } else {
            encoded.push_str(&format!("%{:02X}", byte));
        }
    }
    encoded
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sanitize_trainer_slug() {
        assert_eq!(
            sanitize_trainer_slug("elden-ring-trainer").unwrap(),
            "elden-ring-trainer"
        );
        assert_eq!(
            sanitize_trainer_slug("https://flingtrainer.com/trainer/elden-ring-trainer/").unwrap(),
            "elden-ring-trainer"
        );
        assert!(sanitize_trainer_slug("").is_err());
        assert!(sanitize_trainer_slug("../evil").is_err());
        assert!(sanitize_trainer_slug("slug?a=1").is_err());
        assert!(sanitize_trainer_slug("slug#frag").is_err());
        assert!(sanitize_trainer_slug("https://evil.com/trainer/elden-ring-trainer/").is_err());
    }

    #[test]
    fn test_validate_official_download_url() {
        assert!(
            validate_official_download_url("https://flingtrainer.com/downloads/I7E3hFAco4_f6W8JJaJcqg,,")
                .is_ok()
        );
        assert!(
            validate_official_download_url("https://cdn.flingtrainer.com/downloads/pkg.zip")
                .is_ok()
        );
        // 拒绝 HTTP 明文与非官方/仿冒域名
        assert!(
            validate_official_download_url("http://flingtrainer.com/downloads/pkg.zip").is_err()
        );
        assert!(
            validate_official_download_url("https://evil.com/download/payload.exe").is_err()
        );
        assert!(
            validate_official_download_url("https://flingtrainer.com.evil.com/downloads/pkg.zip")
                .is_err()
        );
        assert!(
            validate_official_download_url("https://user:pass@flingtrainer.com/downloads/pkg.zip")
                .is_err()
        );
    }
}
