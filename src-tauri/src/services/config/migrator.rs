use super::io::{load_config, save_config};
use crate::services::storage;
use std::fs;
use std::path::PathBuf;

/// 将修改器目录从指定源目录迁移至目标目录（具备路径拓扑校验、冲突预检、跨盘回退与失败事务回滚）
pub fn migrate_trainers_dir_from_to(
    current_dir: &std::path::Path,
    new_dir_str: &str,
    persist_config: bool,
) -> Result<u32, String> {
    let trimmed = new_dir_str.trim();
    if trimmed.is_empty() {
        return Err("目标目录路径不能为空".to_string());
    }

    let target_raw_path = PathBuf::from(trimmed);
    // 确保目标目录已创建，以便获取其规范化绝对路径
    fs::create_dir_all(&target_raw_path).map_err(|e| format!("创建目标目录失败: {}", e))?;

    if !current_dir.exists() {
        fs::create_dir_all(current_dir).map_err(|e| format!("创建当前存储目录失败: {}", e))?;
    }

    let canon_current =
        fs::canonicalize(current_dir).map_err(|e| format!("解析当前存储路径失败: {}", e))?;
    let canon_target =
        fs::canonicalize(&target_raw_path).map_err(|e| format!("解析目标存储路径失败: {}", e))?;

    // 1. 拓扑与边界安全检查
    if canon_current == canon_target {
        return Err("目标路径与当前存储路径相同，无需迁移".to_string());
    }
    if canon_target.starts_with(&canon_current) {
        return Err("安全拦截：目标路径不能位于当前存储路径内部，防止循环递归嵌套".to_string());
    }
    if canon_current.starts_with(&canon_target) {
        return Err("安全拦截：当前存储路径不能位于目标路径内部，防止文件冲突与覆盖".to_string());
    }

    // 2. 预检扫描：收集所有需迁移的子目录，并检测冲突
    let entries =
        fs::read_dir(&canon_current).map_err(|e| format!("读取当前存储目录失败: {}", e))?;

    let mut to_migrate: Vec<(PathBuf, PathBuf, std::ffi::OsString)> = Vec::new();

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            let folder_name = entry.file_name();
            let new_game_dir = canon_target.join(&folder_name);
            // 目标目录已有同名目录，拒绝静默覆盖
            if new_game_dir.exists() {
                return Err(format!(
                    "目标目录中已存在同名修改器文件夹 '{}'，为防止文件覆盖已中止迁移",
                    folder_name.to_string_lossy()
                ));
            }
            to_migrate.push((path, new_game_dir, folder_name));
        }
    }

    // 若当前没有任何已安装修改器目录，直接更新配置为新目录并返回 0
    if to_migrate.is_empty() {
        if persist_config {
            let clean_target = storage::strip_verbatim_prefix(&canon_target);
            let mut config = load_config();
            config.management.custom_trainers_dir =
                Some(clean_target.to_string_lossy().to_string());
            save_config(&config)?;
        }
        return Ok(0);
    }

    // 3. 执行迁移与事务回滚记录
    enum RollbackAction {
        RenameBack { from: PathBuf, to: PathBuf },
        RemoveTargetDir(PathBuf),
    }

    let mut rollback_stack: Vec<RollbackAction> = Vec::new();
    let mut copied_sources_to_clean: Vec<PathBuf> = Vec::new();

    let mut migration_exec = || -> Result<u32, String> {
        let mut count = 0u32;
        for (old_game_dir, new_game_dir, folder_name) in &to_migrate {
            let folder_display = folder_name.to_string_lossy();

            // 优先尝试同盘快速重命名 rename，失败时降级为跨盘 copy_dir_all
            if fs::rename(old_game_dir, new_game_dir).is_ok() {
                rollback_stack.push(RollbackAction::RenameBack {
                    from: new_game_dir.clone(),
                    to: old_game_dir.clone(),
                });
            } else {
                if let Err(e) = copy_dir_all(old_game_dir, new_game_dir) {
                    let _ = fs::remove_dir_all(new_game_dir);
                    return Err(format!(
                        "跨盘复制修改器文件夹 '{}' 失败: {}",
                        folder_display, e
                    ));
                }
                rollback_stack.push(RollbackAction::RemoveTargetDir(new_game_dir.clone()));
                copied_sources_to_clean.push(old_game_dir.clone());
            }

            // 更新新目录下的 trainer.json
            let info_file = new_game_dir.join("trainer.json");
            if info_file.exists() {
                let content = fs::read_to_string(&info_file).map_err(|e| {
                    format!(
                        "读取新目录 '{}' 中的 trainer.json 失败: {}",
                        folder_display, e
                    )
                })?;
                let mut record: crate::models::InstalledTrainerRecord =
                    serde_json::from_str(&content).map_err(|e| {
                        format!(
                            "解析新目录 '{}' 中的 trainer.json 失败: {}",
                            folder_display, e
                        )
                    })?;

                let clean_new_game_dir = storage::strip_verbatim_prefix(new_game_dir);
                record.install_dir = clean_new_game_dir.to_string_lossy().to_string();

                let new_exe = new_game_dir.join(&record.exe_name);
                if new_exe.exists() {
                    let clean_new_exe = storage::strip_verbatim_prefix(&new_exe);
                    record.exe_path = clean_new_exe.to_string_lossy().to_string();
                }

                let new_cover_jpg = new_game_dir.join("cover.jpg");
                let new_cover_png = new_game_dir.join("cover.png");
                if new_cover_jpg.exists() {
                    record.capsule_image = Some(
                        storage::strip_verbatim_prefix(&new_cover_jpg)
                            .to_string_lossy()
                            .to_string(),
                    );
                } else if new_cover_png.exists() {
                    record.capsule_image = Some(
                        storage::strip_verbatim_prefix(&new_cover_png)
                            .to_string_lossy()
                            .to_string(),
                    );
                }

                storage::save_installed_record(record)?;
            }

            count += 1;
        }

        Ok(count)
    };

    match migration_exec() {
        Ok(migrated_count) => {
            // 所有目录迁移与 trainer.json 更新均成功！
            // 清理跨盘复制留在旧源目录中的文件夹
            for old_dir in copied_sources_to_clean {
                let _ = fs::remove_dir_all(&old_dir);
            }

            // 更新全局配置 custom_trainers_dir（若需要持久化）
            if persist_config {
                let clean_target = storage::strip_verbatim_prefix(&canon_target);
                let mut config = load_config();
                config.management.custom_trainers_dir =
                    Some(clean_target.to_string_lossy().to_string());
                save_config(&config)?;
            }

            Ok(migrated_count)
        }
        Err(err) => {
            // 发生错误，逆序执行回滚，保持源目录与配置 100% 完整原状
            for action in rollback_stack.into_iter().rev() {
                match action {
                    RollbackAction::RenameBack { from, to } => {
                        let _ = fs::rename(&from, &to);
                    }
                    RollbackAction::RemoveTargetDir(target) => {
                        let _ = fs::remove_dir_all(&target);
                    }
                }
            }
            // 严禁在此处更新 config.management.custom_trainers_dir！
            Err(format!("迁移失败，已安全回滚至初始状态: {}", err))
        }
    }
}

/// 一键无损迁移所有已安装修改器至新目录
pub fn migrate_trainers_dir(new_dir_str: &str) -> Result<u32, String> {
    let current_dir = storage::get_trainers_dir();
    migrate_trainers_dir_from_to(&current_dir, new_dir_str, true)
}

fn copy_dir_all(src: &std::path::Path, dst: &std::path::Path) -> std::io::Result<()> {
    fs::create_dir_all(dst)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        if ty.is_dir() {
            copy_dir_all(&entry.path(), &dst.join(entry.file_name()))?;
        } else {
            fs::copy(entry.path(), dst.join(entry.file_name()))?;
        }
    }
    Ok(())
}
