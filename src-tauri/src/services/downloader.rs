use crate::models::{DownloadProgressPayload, InstalledTrainerRecord, Trainer};
use crate::services::{scraper, storage};
use chrono::Local;
use futures_util::StreamExt;
use std::fs;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::time::Instant;
use tauri::{AppHandle, Emitter, Runtime};

pub async fn download_and_install_trainer<R: Runtime>(
    app: AppHandle<R>,
    mut trainer: Trainer,
) -> Result<InstalledTrainerRecord, String> {
    // 1. 如果没有下载链接或详情，先抓取详情获取
    if trainer.download_url.is_empty() || trainer.options.is_empty() {
        if let Ok(detail) = scraper::get_trainer_detail(&trainer.id).await {
            trainer.download_url = detail.download_url;
            if trainer.options.is_empty() {
                trainer.options = detail.options;
                trainer.option_items = detail.option_items;
            }
            if trainer.description.is_empty() {
                trainer.description = detail.description;
            }
            if trainer.game_version.is_empty() {
                trainer.game_version = detail.game_version;
            }
        }
    }
    // 确保补齐 Steam 官方高清原画与胶囊元数据
    crate::services::game_meta::enrich_trainer(&mut trainer).await;

    if trainer.download_url.is_empty() {
        return Err("未能在官网上找到该修改器的下载直链".to_string());
    }

    let download_dir = storage::get_download_dir();
    let display_name = trainer.chinese_name.as_deref().unwrap_or(&trainer.name);
    let safe_folder_name = sanitize_game_folder_name(display_name);
    let target_dir = download_dir.join(&safe_folder_name);
    let _ = fs::create_dir_all(&target_dir);

    let temp_file_path = target_dir.join("download.tmp");

    // 2. 发起下载请求
    let client = scraper::create_client()?;
    let res = client
        .get(&trainer.download_url)
        .header("Referer", "https://flingtrainer.com/")
        .send()
        .await
        .map_err(|e| format!("无法连接下载服务器: {}", e))?;

    if !res.status().is_success() {
        let err_msg = format!("下载服务返回错误状态: {}", res.status());
        let _ = app.emit(
            "download-progress",
            DownloadProgressPayload {
                trainer_id: trainer.id.clone(),
                progress: 0.0,
                downloaded_bytes: 0,
                total_bytes: None,
                speed_bytes_per_sec: 0,
                status: "error".to_string(),
                error: Some(err_msg.clone()),
            },
        );
        return Err(err_msg);
    }

    let total_size = res.content_length();
    let mut downloaded: u64 = 0;
    let mut stream = res.bytes_stream();

    let mut file = fs::File::create(&temp_file_path)
        .map_err(|e| format!("创建本地临时下载文件失败: {}", e))?;

    let mut last_emit = Instant::now();
    let mut last_bytes = 0u64;

    while let Some(chunk_result) = stream.next().await {
        let chunk = chunk_result.map_err(|e| format!("网络流传输异常: {}", e))?;
        file.write_all(&chunk)
            .map_err(|e| format!("写入磁盘失败: {}", e))?;
        downloaded += chunk.len() as u64;

        if last_emit.elapsed().as_millis() > 300 {
            let elapsed_sec = last_emit.elapsed().as_secs_f64().max(0.001);
            let speed = ((downloaded - last_bytes) as f64 / elapsed_sec) as u64;
            let percent = if let Some(total) = total_size {
                (downloaded as f64 / total as f64) * 100.0
            } else {
                0.0
            };

            let _ = app.emit(
                "download-progress",
                DownloadProgressPayload {
                    trainer_id: trainer.id.clone(),
                    progress: percent.min(99.0),
                    downloaded_bytes: downloaded,
                    total_bytes: total_size,
                    speed_bytes_per_sec: speed,
                    status: "downloading".to_string(),
                    error: None,
                },
            );

            last_emit = Instant::now();
            last_bytes = downloaded;
        }
    }

    drop(file);

    // 3. 进入解压与提取阶段
    let _ = app.emit(
        "download-progress",
        DownloadProgressPayload {
            trainer_id: trainer.id.clone(),
            progress: 99.0,
            downloaded_bytes: downloaded,
            total_bytes: total_size,
            speed_bytes_per_sec: 0,
            status: "extracting".to_string(),
            error: None,
        },
    );

    let exe_path = process_package(&temp_file_path, &target_dir, &trainer.id)?;
    let _ = fs::remove_file(&temp_file_path);

    // 4. 尝试将封面图下载到本地子目录中 (cover.jpg)，确保断网/重启纯本地 0ms 秒开
    let cover_file = target_dir.join("cover.jpg");
    if !cover_file.exists() {
        let img_url = trainer.capsule_image.as_deref().unwrap_or(&trainer.thumbnail);
        if !img_url.is_empty() {
            if let Ok(client) = scraper::create_client() {
                if let Ok(resp) = client.get(img_url).send().await {
                    if resp.status().is_success() {
                        if let Ok(bytes) = resp.bytes().await {
                            let _ = fs::write(&cover_file, bytes);
                        }
                    }
                }
            }
        }
    }

    let final_capsule = if cover_file.exists() {
        Some(cover_file.to_string_lossy().to_string())
    } else {
        trainer.capsule_image.clone()
    };

    // 5. 构造并保存已安装记录 (写入子文件夹下的 trainer.json)
    // 自动继承已有的开关预设与上次启动时间，实现无感平滑升级
    let existing_records = storage::load_installed_records();
    let existing = existing_records.into_iter().find(|r| r.id == trainer.id);

    let (saved_toggles, last_launched_at) = if let Some(old) = existing {
        (old.saved_toggles, old.last_launched_at)
    } else {
        (std::collections::HashMap::new(), None)
    };

    let exe_name = exe_path
        .file_name()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();

    let record = InstalledTrainerRecord {
        id: trainer.id.clone(),
        name: trainer.name.clone(),
        chinese_name: trainer.chinese_name.clone(),
        version: trainer.version.clone(),
        game_version: trainer.game_version.clone(),
        exe_path: exe_path.to_string_lossy().to_string(),
        exe_name,
        install_dir: target_dir.to_string_lossy().to_string(),
        installed_at: Local::now().to_rfc3339(),
        last_launched_at,
        steam_app_id: trainer.steam_app_id,
        thumbnail: trainer.thumbnail.clone(),
        hero_image: trainer.hero_image.clone(),
        capsule_image: final_capsule,
        description: trainer.description.clone(),
        options: trainer.options.clone(),
        option_items: trainer.option_items.clone(),
        saved_toggles,
    };

    storage::save_installed_record(record.clone())?;

    // 5. 完成广播
    let _ = app.emit(
        "download-progress",
        DownloadProgressPayload {
            trainer_id: trainer.id.clone(),
            progress: 100.0,
            downloaded_bytes: downloaded,
            total_bytes: total_size,
            speed_bytes_per_sec: 0,
            status: "completed".to_string(),
            error: None,
        },
    );

    Ok(record)
}

pub fn process_package(package_path: &Path, extract_to: &Path, trainer_id: &str) -> Result<PathBuf, String> {
    let is_zip = is_zip_file(package_path);
    let is_exe = is_pe_exe_file(package_path);

    if !is_zip && !is_exe {
        return Err("下载内容非有效的 ZIP 压缩包或 Windows 可执行程序 (MZ)，可能遭遇了网络拦截或错误页".to_string());
    }

    // 采用独立隔离 Staging 目录，防止解压中途失败污染或半覆盖已有版本
    let staging_dir = extract_to.parent().unwrap_or(extract_to).join(format!(
        ".staging_{}_{}",
        trainer_id,
        chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0)
    ));
    fs::create_dir_all(&staging_dir)
        .map_err(|e| format!("创建临时解压隔离目录失败: {}", e))?;

    let staging_result = (|| -> Result<PathBuf, String> {
        if is_zip {
            let file = fs::File::open(package_path)
                .map_err(|e| format!("打开压缩包失败: {}", e))?;
            let mut archive = zip::ZipArchive::new(file)
                .map_err(|e| format!("解析 ZIP 压缩文件失败: {}", e))?;

            for i in 0..archive.len() {
                let mut file = archive.by_index(i)
                    .map_err(|e| format!("读取压缩项失败: {}", e))?;
                let outpath = match file.enclosed_name() {
                    Some(path) => staging_dir.join(path),
                    None => continue,
                };

                if file.is_dir() {
                    let _ = fs::create_dir_all(&outpath);
                } else {
                    if let Some(p) = outpath.parent() {
                        let _ = fs::create_dir_all(p);
                    }
                    let mut outfile = fs::File::create(&outpath)
                        .map_err(|e| format!("解压文件失败: {}", e))?;
                    std::io::copy(&mut file, &mut outfile)
                        .map_err(|e| format!("写入解压文件失败: {}", e))?;
                }
            }
        } else {
            // 如果不是 zip 且为合法 PE，复制为单个 exe
            let direct_exe = staging_dir.join(format!("{}.exe", trainer_id));
            fs::copy(package_path, &direct_exe)
                .map_err(|e| format!("复制执行文件失败: {}", e))?;
        }

        // 递归扫描 staging 目录中的所有有效可执行程序
        let mut candidates = Vec::new();
        collect_all_exes_recursive(&staging_dir, &mut candidates);

        if candidates.is_empty() {
            return Err("未在解压结果中找到有效的修改器 .exe 文件".to_string());
        }

        // 启发式挑选最佳修改器主程序：优先名称带 trainer，其次按体积最大挑选
        let best_exe = if candidates.len() == 1 {
            candidates[0].clone()
        } else {
            let matched = candidates.iter().find(|p| {
                let name = p.file_name().unwrap_or_default().to_string_lossy().to_lowercase();
                name.contains("trainer") || name == format!("{}.exe", trainer_id.to_lowercase())
            });
            if let Some(m) = matched {
                m.clone()
            } else {
                candidates.sort_by_key(|p| p.metadata().map(|m| m.len()).unwrap_or(0));
                candidates.last().unwrap().clone()
            }
        };

        let rel_exe_path = best_exe.strip_prefix(&staging_dir)
            .map_err(|e| format!("计算相对路径失败: {}", e))?
            .to_path_buf();

        Ok(rel_exe_path)
    })();

    match staging_result {
        Ok(rel_exe_path) => {
            // 解压与校验完整成功，向目标目录提升安装
            fs::create_dir_all(extract_to)
                .map_err(|e| format!("创建目标目录失败: {}", e))?;

            if let Err(e) = copy_and_promote_staging(&staging_dir, extract_to) {
                let _ = fs::remove_dir_all(&staging_dir);
                return Err(format!("提升安装文件至目标目录失败: {}", e));
            }

            let _ = fs::remove_dir_all(&staging_dir);
            let final_exe = extract_to.join(rel_exe_path);
            Ok(final_exe)
        }
        Err(e) => {
            // 失败时回滚并清理 staging 目录，保护现有目标目录
            let _ = fs::remove_dir_all(&staging_dir);
            Err(e)
        }
    }
}

fn copy_and_promote_staging(src: &Path, dst: &Path) -> std::io::Result<()> {
    fs::create_dir_all(dst)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let p = entry.path();
        let target = dst.join(entry.file_name());
        if p.is_dir() {
            copy_and_promote_staging(&p, &target)?;
        } else {
            fs::copy(&p, &target)?;
        }
    }
    Ok(())
}

fn collect_all_exes_recursive(dir: &Path, results: &mut Vec<PathBuf>) {
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let p = entry.path();
            if p.is_dir() {
                collect_all_exes_recursive(&p, results);
            } else if p.is_file() {
                if let Some(ext) = p.extension() {
                    if ext.to_ascii_lowercase() == "exe" && is_pe_exe_file(&p) {
                        results.push(p);
                    }
                }
            }
        }
    }
}

pub fn is_pe_exe_file(path: &Path) -> bool {
    if let Ok(mut f) = fs::File::open(path) {
        let mut magic = [0u8; 2];
        if f.read_exact(&mut magic).is_ok() {
            return magic == [b'M', b'Z'];
        }
    }
    false
}

fn is_zip_file(path: &Path) -> bool {
    if let Ok(mut f) = fs::File::open(path) {
        let mut magic = [0u8; 4];
        if f.read_exact(&mut magic).is_ok() {
            return magic == [0x50, 0x4B, 0x03, 0x04];
        }
    }
    false
}

fn sanitize_game_folder_name(name: &str) -> String {
    let invalid_chars = ['<', '>', ':', '"', '/', '\\', '|', '?', '*'];
    let sanitized: String = name
        .chars()
        .map(|c| if invalid_chars.contains(&c) { ' ' } else { c })
        .collect();

    let trimmed = sanitized.trim().trim_matches('.').trim();
    if trimmed.is_empty() {
        "Unknown_Game".to_string()
    } else {
        // 合并连续空格
        let mut result = String::new();
        let mut last_space = false;
        for c in trimmed.chars() {
            if c == ' ' {
                if !last_space {
                    result.push(' ');
                    last_space = true;
                }
            } else {
                result.push(c);
                last_space = false;
            }
        }
        result
    }
}

use crate::models::TrainerUpdateInfo;

/// 检测所有已安装修改器是否有新版本
pub async fn check_trainers_update() -> Result<Vec<TrainerUpdateInfo>, String> {
    let installed = storage::load_installed_records();
    let mut results = Vec::new();

    for item in installed {
        // 请求风灵月影官网该修改器的最新详情
        let latest_opt = scraper::get_trainer_detail_ext(&item.id, true).await.ok();

        if let Some(latest) = latest_opt {
            let version_changed = item.version.trim() != latest.version.trim();
            let game_ver_changed = !latest.game_version.trim().is_empty()
                && item.game_version.trim() != latest.game_version.trim();
            let options_added = latest.options.len() > item.options.len();

            let has_update = version_changed || game_ver_changed || options_added;

            results.push(TrainerUpdateInfo {
                id: item.id.clone(),
                has_update,
                current_version: item.version.clone(),
                latest_version: latest.version.clone(),
                current_game_version: item.game_version.clone(),
                latest_game_version: latest.game_version.clone(),
                latest_trainer: if has_update { Some(latest) } else { None },
            });
        } else {
            results.push(TrainerUpdateInfo {
                id: item.id.clone(),
                has_update: false,
                current_version: item.version.clone(),
                latest_version: item.version.clone(),
                current_game_version: item.game_version.clone(),
                latest_game_version: item.game_version.clone(),
                latest_trainer: None,
            });
        }

        tokio::time::sleep(tokio::time::Duration::from_millis(60)).await;
    }

    Ok(results)
}

/// 一键无感增量升级指定修改器为最新版
pub async fn update_trainer_to_latest(app: AppHandle, id: &str) -> Result<InstalledTrainerRecord, String> {
    let latest_trainer = scraper::get_trainer_detail_ext(id, true).await?;
    download_and_install_trainer(app, latest_trainer).await
}
