use super::models::AppConfig;
use crate::services::storage::get_app_data_dir;
use std::fs;
use std::path::PathBuf;

pub fn get_config_file_path() -> PathBuf {
    get_app_data_dir().join("app_config.json")
}

/// 原子安全写盘辅助函数（写入临时文件、强制刷盘后再原子替换，防止断电或并发导致空文件/半成品）
pub fn atomic_write_file(path: &std::path::Path, content: &[u8]) -> Result<(), String> {
    use std::io::Write;
    if let Some(parent) = path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    let tmp_path = path.with_extension(format!("tmp.{}", std::process::id()));
    {
        let mut file =
            fs::File::create(&tmp_path).map_err(|e| format!("创建临时文件失败: {}", e))?;
        file.write_all(content)
            .map_err(|e| format!("写入临时文件失败: {}", e))?;
        file.flush()
            .map_err(|e| format!("刷盘临时文件失败: {}", e))?;
        let _ = file.sync_all();
    }
    if fs::rename(&tmp_path, path).is_err() {
        fs::copy(&tmp_path, path).map_err(|e| format!("原子替换目标文件失败: {}", e))?;
        let _ = fs::remove_file(&tmp_path);
    }
    Ok(())
}

/// 读取应用全局配置，若不存在则生成默认配置；若存在但损坏则安全隔离备份，绝不静默覆盖
pub fn load_config() -> AppConfig {
    let file = get_config_file_path();
    if file.exists()
        && let Ok(content) = fs::read_to_string(&file)
    {
        match serde_json::from_str::<AppConfig>(&content) {
            Ok(config) => return config,
            Err(e) => {
                // 配置损坏安全防线：备份损坏的原配置文件，保留用户历史与排查证据
                if let Some(parent) = file.parent() {
                    let corrupt_backup = parent.join(format!(
                        "app_config.corrupt.{}.json",
                        chrono::Utc::now().timestamp()
                    ));
                    let _ = fs::copy(&file, &corrupt_backup);
                    eprintln!(
                        "全局配置文件 {:?} 解析损坏，已自动备份至 {:?}: {}",
                        file, corrupt_backup, e
                    );
                }
            }
        }
    }
    let default_config = AppConfig::default();
    let _ = save_config(&default_config);
    default_config
}

/// 保存应用全局配置（原子替换落盘，并自动重置共享网络连接池使新配置立即热生效）
pub fn save_config(config: &AppConfig) -> Result<(), String> {
    let file = get_config_file_path();
    let json =
        serde_json::to_string_pretty(config).map_err(|e| format!("序列化配置失败: {}", e))?;
    atomic_write_file(&file, json.as_bytes())?;
    super::network::reset_shared_http_client();
    Ok(())
}
