pub const USER_AGENT: &str =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
pub const BASE_URL: &str = "https://flingtrainer.com";

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
