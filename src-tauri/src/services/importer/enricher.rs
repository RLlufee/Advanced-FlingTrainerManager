use crate::models::{BatchEnrichResult, InstalledTrainerRecord};
use crate::services::{game_meta, scraper, storage};
use futures_util::stream::{self, StreamExt};
use std::time::Duration;
use tokio::time::timeout;
use super::scanner::download_cover_image;

/// 核心记录数据补齐实现（直接操作内存中的记录并单项保存回 trainer.json，不重复全库扫描）
pub async fn enrich_record_internal(mut target: InstalledTrainerRecord) -> Result<InstalledTrainerRecord, String> {
    let trainers_root = storage::get_trainers_dir();
    let game_install_dir = trainers_root.join(&target.id);

    // 1. 本地 SQLite 查询英文名或中文名对应的官网 slug
    let query_name = target.name.clone();
    let local_info = game_meta::query_local_game_and_trainer_info(&query_name).or_else(|| {
        target
            .chinese_name
            .as_deref()
            .and_then(game_meta::query_local_game_and_trainer_info)
    });

    let slug = local_info
        .as_ref()
        .and_then(|info| info.slug.clone())
        .unwrap_or_else(|| game_meta::guess_slug_from_name(&query_name));

    // 2. 抓取官网详情 (超时限制 5 秒)
    let detail_opt = match timeout(
        Duration::from_millis(5000),
        scraper::get_trainer_detail(&slug),
    )
    .await
    {
        Ok(Ok(detail)) => Some(detail),
        _ => None,
    };

    if let Some(detail) = detail_opt {
        target.options = detail.options;
        target.option_items = detail.option_items;
        if !detail.description.trim().is_empty() {
            target.description = detail.description;
        }
        if !detail.game_version.trim().is_empty() {
            target.game_version = detail.game_version;
        }
        if !detail.thumbnail.is_empty() {
            target.thumbnail = detail.thumbnail.clone();
        }
        if detail.steam_app_id.is_some() {
            target.steam_app_id = detail.steam_app_id;
        }
        if detail.hero_image.is_some() {
            target.hero_image = detail.hero_image;
        }
        if (target.chinese_name.is_none() || target.chinese_name.as_deref() == Some(&target.name))
            && let Some(cn) = detail.chinese_name
        {
            target.chinese_name = Some(cn);
        }

        // 3. 补全封面落盘 cover.jpg
        let cover_file = game_install_dir.join("cover.jpg");
        let mut candidate_images = Vec::new();
        if let Some(ref c) = detail.capsule_image {
            candidate_images.push(c.as_str());
        }
        if !detail.thumbnail.is_empty() {
            candidate_images.push(detail.thumbnail.as_str());
        }

        download_cover_image(&cover_file, &candidate_images).await;

        if cover_file.exists() {
            target.capsule_image = Some(cover_file.to_string_lossy().to_string());
        } else if target.capsule_image.is_none() {
            target.capsule_image = detail.capsule_image;
        }
    } else {
        // 若联网详情未匹配到，尝试补齐中文名与 Steam 胶囊
        let meta = game_meta::resolve_meta_for_name(&target.name).await;
        if target.chinese_name.is_none() || target.chinese_name.as_deref() == Some(&target.name) {
            target.chinese_name = meta.chinese_name;
        }
        if target.steam_app_id.is_none() {
            target.steam_app_id = meta.steam_app_id;
        }
        if target.hero_image.is_none() {
            target.hero_image = meta.hero_image;
        }
        if target.capsule_image.is_none() {
            let cover_file = game_install_dir.join("cover.jpg");
            if let Some(ref img) = meta.capsule_image {
                download_cover_image(&cover_file, &[img]).await;
            }
            if cover_file.exists() {
                target.capsule_image = Some(cover_file.to_string_lossy().to_string());
            } else {
                target.capsule_image = meta.capsule_image;
            }
        }
    }

    // 保存回单个修改器的 trainer.json
    storage::save_installed_record(target.clone())?;
    Ok(target)
}

/// 对指定已安装的修改器进行全面数据补齐与同步（从风灵月影官网抓取选项、热键看板及高清封面）
pub async fn enrich_installed_trainer(id: &str) -> Result<InstalledTrainerRecord, String> {
    let records = storage::load_installed_records();
    let target = records
        .into_iter()
        .find(|r| r.id == id)
        .ok_or_else(|| format!("未找到指定的修改器记录: {}", id))?;

    enrich_record_internal(target).await
}

/// 一键受控并发补全所有缺失选项、热键看板或封面数据的修改器（复用首次全量扫描结果，杜绝 N 轮重复读盘）
pub async fn enrich_all_installed_trainers() -> Result<BatchEnrichResult, String> {
    let records = storage::load_installed_records();
    let need_enrich: Vec<InstalledTrainerRecord> = records
        .into_iter()
        .filter(|r| r.option_items.is_empty() || r.options.is_empty() || r.capsule_image.is_none())
        .collect();

    if need_enrich.is_empty() {
        return Ok(BatchEnrichResult {
            attempted: 0,
            succeeded: 0,
            failed: 0,
        });
    }

    let results = stream::iter(need_enrich)
        .map(|record| async move {
            let ok = enrich_record_internal(record).await.is_ok();
            tokio::time::sleep(Duration::from_millis(50)).await;
            ok
        })
        .buffer_unordered(3)
        .collect::<Vec<bool>>()
        .await;

    let succeeded = results.iter().filter(|&&ok| ok).count();
    let failed = results.len().saturating_sub(succeeded);

    Ok(BatchEnrichResult {
        attempted: results.len(),
        succeeded,
        failed,
    })
}
