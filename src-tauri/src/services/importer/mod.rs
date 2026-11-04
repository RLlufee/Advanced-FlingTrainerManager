pub mod dialog;
pub mod enricher;
pub mod matcher;
pub mod scanner;

pub use dialog::*;
pub use enricher::*;
pub use matcher::*;
pub use scanner::*;

use crate::services::{config, storage};
use futures_util::stream::{self, StreamExt};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportSummary {
    pub total_scanned: usize,
    pub imported_count: usize,
    pub imported_names: Vec<String>,
    pub skipped_count: usize,
}

/// 扫描指定外部文件夹，批量识别、匹配并收归入 trainers/ 目录 (并行加速)
pub async fn scan_and_import_trainers(folder_path: &str) -> Result<ImportSummary, String> {
    let source_dir = PathBuf::from(folder_path);
    if !source_dir.exists() || !source_dir.is_dir() {
        return Err(format!(
            "指定扫描目录不存在或不是有效文件夹: {}",
            folder_path
        ));
    }

    let trainers_root = storage::get_trainers_dir();
    let config = config::load_config();
    let max_depth = (config.management.scan_depth as usize).clamp(1, 10);
    let auto_extract_zip = config.management.auto_extract_zip;

    // 递归查找候选文件 (根据设置的扫描深度与是否解压 ZIP)
    let mut candidate_files = Vec::new();
    collect_candidate_files(
        &source_dir,
        0,
        max_depth,
        auto_extract_zip,
        &mut candidate_files,
    );

    let total_scanned = candidate_files.len();
    let existing_records = storage::load_installed_records();

    // 并行流式处理 (限制并发度为 4，兼顾性能与网络稳定)
    let trainers_root_ref = &trainers_root;
    let existing_records_ref = &existing_records;

    let results = stream::iter(candidate_files)
        .map(|file_path| async move {
            // 如果文件已经在目标 trainers_root 下，直接跳过避免重复导入
            if file_path.starts_with(trainers_root_ref) {
                return Ok(None);
            }
            process_and_import_single_file(file_path, trainers_root_ref, existing_records_ref).await
        })
        .buffer_unordered(4)
        .collect::<Vec<Result<Option<String>, String>>>()
        .await;

    let mut imported_names = Vec::new();
    let mut skipped_count = 0usize;

    for res in results {
        match res {
            Ok(Some(name)) => imported_names.push(name),
            _ => skipped_count += 1,
        }
    }

    Ok(ImportSummary {
        total_scanned,
        imported_count: imported_names.len(),
        imported_names,
        skipped_count,
    })
}
