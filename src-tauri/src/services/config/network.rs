use super::io::load_config;
use super::models::NetworkTestResult;
use std::time::Duration;

/// 根据全局网络配置构建统一 reqwest::Client
pub fn build_custom_http_client() -> Result<reqwest::Client, String> {
    let config = load_config();
    let net = &config.network;

    let timeout_val = if net.timeout_ms < 1000 {
        Duration::from_millis(8000)
    } else {
        Duration::from_millis(net.timeout_ms)
    };

    let mut builder = reqwest::Client::builder()
        .user_agent(crate::services::scraper::USER_AGENT)
        .timeout(timeout_val);

    match net.proxy_mode.as_str() {
        "direct" => {
            builder = builder.no_proxy();
        }
        "custom" => {
            let proxy_str = net.proxy_url.trim();
            if !proxy_str.is_empty() {
                let proxy = reqwest::Proxy::all(proxy_str)
                    .map_err(|e| format!("配置代理地址 '{}' 失败: {}", proxy_str, e))?;
                builder = builder.proxy(proxy);
            }
        }
        _ => {
            // "system" 模式，reqwest 默认根据系统网络环境处理
        }
    }

    builder
        .build()
        .map_err(|e| format!("构建 HTTP 客户端失败: {}", e))
}

/// 一键测试网络或自定义代理的连通性
pub async fn test_network_connectivity(
    custom_target: Option<String>,
) -> Result<NetworkTestResult, String> {
    let target = custom_target.unwrap_or_else(|| "https://flingtrainer.com".to_string());
    let client = build_custom_http_client()?;

    let start = std::time::Instant::now();
    match client.get(&target).send().await {
        Ok(resp) => {
            let latency_ms = start.elapsed().as_millis() as u64;
            let status = resp.status().as_u16();
            let success =
                resp.status().is_success() || status == 301 || status == 302 || status == 403;
            let message = if success {
                format!("连接测试通过 (HTTP {}, 延迟 {}ms)", status, latency_ms)
            } else {
                format!("服务器响应状态异常: HTTP {}", status)
            };
            Ok(NetworkTestResult {
                success,
                target_url: target,
                status_code: Some(status),
                latency_ms,
                message,
            })
        }
        Err(e) => {
            let latency_ms = start.elapsed().as_millis() as u64;
            Ok(NetworkTestResult {
                success: false,
                target_url: target,
                status_code: None,
                latency_ms,
                message: format!("连接测试失败: {}", e),
            })
        }
    }
}

/// 根据配置处理 Steam 封面图片加速链接
pub fn apply_steam_cdn_mirror(original_url: &str) -> String {
    let config = load_config();
    if !config.network.enable_steam_cdn {
        return original_url.to_string();
    }
    let host = if config.network.steam_cdn_host.is_empty() {
        "shared.cloudflare.steamstatic.com"
    } else {
        &config.network.steam_cdn_host
    };

    if original_url.contains("steamstatic.com")
        && let Ok(re) = regex::Regex::new(r"https?://[^/]+\.steamstatic\.com")
    {
        return re
            .replace(original_url, format!("https://{}", host))
            .to_string();
    }
    original_url.to_string()
}

/// 根据当前配置转换 GitHub 下载/API 镜像链接
pub fn apply_github_mirror(github_url: &str) -> String {
    let config = load_config();
    match config.network.update_source.as_str() {
        "ghproxy" => {
            format!("https://ghproxy.net/{}", github_url)
        }
        "mirror2" => {
            format!("https://mirror.ghproxy.com/{}", github_url)
        }
        _ => github_url.to_string(),
    }
}
