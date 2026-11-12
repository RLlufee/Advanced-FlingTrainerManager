use super::io::load_config;
use super::models::NetworkTestResult;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::RwLock;
use std::time::Duration;

static GLOBAL_HTTP_CLIENT: RwLock<Option<reqwest::Client>> = RwLock::new(None);
// 客户端代数计数器：用于在锁外构建期间检测是否发生了配置热重载，避免旧配置客户端覆盖新缓存
static CLIENT_GENERATION: AtomicU64 = AtomicU64::new(0);

/// 内部共享客户端获取实现（将构建逻辑完全移出写锁，并结合代数校验防止并发写回过期客户端）
fn get_or_init_shared_http_client_with<F>(mut build_fn: F) -> Result<reqwest::Client, String>
where
    F: FnMut() -> Result<reqwest::Client, String>,
{
    if let Ok(guard) = GLOBAL_HTTP_CLIENT.read()
        && let Some(ref client) = *guard
    {
        return Ok(client.clone());
    }

    // 关键：严禁在持有 GLOBAL_HTTP_CLIENT 写锁期间调用 load_config()，
    // 否则在首次启动或配置损坏时 load_config -> save_config -> reset_shared_http_client 会同线程重入写锁导致永久死锁
    for _ in 0..2 {
        let gen_before = CLIENT_GENERATION.load(Ordering::SeqCst);
        let new_client = build_fn()?;

        let mut guard = GLOBAL_HTTP_CLIENT.write().map_err(|e| e.to_string())?;
        if let Some(ref client) = *guard {
            return Ok(client.clone());
        }

        // 仅当构建期间未发生配置重置时才写入全局缓存；否则释放锁后基于最新配置重试一次
        if CLIENT_GENERATION.load(Ordering::SeqCst) == gen_before {
            *guard = Some(new_client.clone());
            return Ok(new_client);
        }
    }

    // 若连续遭遇并发配置重置，直接返回最新构建结果而不回写缓存
    build_fn()
}

/// 获取全局共享的复用 HTTP 客户端（内部共享连接池、DNS 缓存与 TLS 会话，零磁盘 I/O）
pub fn get_shared_http_client() -> Result<reqwest::Client, String> {
    get_or_init_shared_http_client_with(build_custom_http_client)
}

/// 重置全局 HTTP 客户端连接池（当用户保存新网络配置、代理或超时设置时触发无缝热重载）
pub fn reset_shared_http_client() {
    CLIENT_GENERATION.fetch_add(1, Ordering::SeqCst);
    if let Ok(mut guard) = GLOBAL_HTTP_CLIENT.write() {
        *guard = None;
    }
}

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
        .timeout(timeout_val)
        .pool_idle_timeout(Duration::from_secs(90))
        .pool_max_idle_per_host(8);

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

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::AtomicUsize;
    use std::sync::{mpsc, Arc, Mutex};

    static TEST_GUARD: Mutex<()> = Mutex::new(());

    #[test]
    fn test_shared_http_client_no_deadlock_when_reset_during_build() {
        let _lock = TEST_GUARD.lock().unwrap();
        reset_shared_http_client();

        let build_calls = Arc::new(AtomicUsize::new(0));
        let build_calls_clone = Arc::clone(&build_calls);

        let (tx, rx) = mpsc::channel();
        std::thread::spawn(move || {
            let res = get_or_init_shared_http_client_with(|| {
                let n = build_calls_clone.fetch_add(1, Ordering::SeqCst);
                if n == 0 {
                    // 模拟首次启动/配置损坏时 load_config -> save_config -> reset_shared_http_client 触发的同线程重入重置
                    reset_shared_http_client();
                }
                reqwest::Client::builder()
                    .timeout(Duration::from_secs(5))
                    .build()
                    .map_err(|e| e.to_string())
            });
            let _ = tx.send(res.map(|_| ()));
        });

        // 若存在写锁重入死锁，此处必然超时失败
        let outcome = rx
            .recv_timeout(Duration::from_secs(3))
            .expect("get_shared_http_client 发生死锁或超时未返回！");
        assert!(outcome.is_ok(), "构建共享 HTTP 客户端不应失败: {:?}", outcome);
        assert_eq!(
            build_calls.load(Ordering::SeqCst),
            2,
            "首轮构建期间发生重置时应自动基于最新状态重试一次并写入缓存"
        );

        // 命中缓存后，后续获取不再触发构建闭包
        let cached = get_or_init_shared_http_client_with(|| {
            build_calls.fetch_add(1, Ordering::SeqCst);
            Err("命中缓存时不应当重新构建客户端".to_string())
        });
        assert!(cached.is_ok(), "后续调用应直接复用已缓存的客户端");
        assert_eq!(build_calls.load(Ordering::SeqCst), 2);

        // 显式重置后应当触发重建
        reset_shared_http_client();
        let rebuilt = get_or_init_shared_http_client_with(|| {
            build_calls.fetch_add(1, Ordering::SeqCst);
            reqwest::Client::builder()
                .timeout(Duration::from_secs(5))
                .build()
                .map_err(|e| e.to_string())
        });
        assert!(rebuilt.is_ok());
        assert_eq!(build_calls.load(Ordering::SeqCst), 3);

        reset_shared_http_client();
    }
}
