use app_lib::models::InstalledTrainerRecord;
use app_lib::services::{config, storage};
use std::fs;
use std::path::{Path, PathBuf};

fn create_temp_test_dir(prefix: &str) -> PathBuf {
    let unique = format!(
        "fling-p0-test-{}-{}-{}",
        prefix,
        std::process::id(),
        chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0)
    );
    let dir = std::env::temp_dir().join(unique);
    fs::create_dir_all(&dir).expect("创建临时测试目录失败");
    dir
}

fn create_dummy_record(id: &str, dir: &Path) -> InstalledTrainerRecord {
    fs::create_dir_all(dir).expect("创建游戏文件夹失败");
    fs::write(dir.join("trainer.exe"), b"MZ-test-binary").expect("写入测试可执行文件失败");
    let record = serde_json::json!({
        "id": id,
        "name": id,
        "chinese_name": id,
        "version": "1.0",
        "game_version": "1.0",
        "exe_path": dir.join("trainer.exe").to_string_lossy(),
        "exe_name": "trainer.exe",
        "install_dir": dir.to_string_lossy(),
        "installed_at": "2026-11-03T12:00:00Z",
        "options": [],
        "option_items": [],
        "saved_toggles": {}
    });
    let parsed: InstalledTrainerRecord = serde_json::from_value(record).unwrap();
    let json = serde_json::to_string_pretty(&parsed).unwrap();
    fs::write(dir.join("trainer.json"), json).expect("写入 trainer.json 失败");
    parsed
}

#[test]
fn test_p0_01_copied_library_delete_isolation() {
    let root = create_temp_test_dir("p0_01_delete");
    let library_a = root.join("library_a");
    let library_b = root.join("library_b");
    fs::create_dir_all(&library_a).unwrap();
    fs::create_dir_all(&library_b).unwrap();

    let game_a = library_a.join("EldenRing");
    create_dummy_record("elden_ring", &game_a);

    // 模拟用户复制整个修改器文件夹到 library_b（此时 trainer.json 中的 install_dir 仍指向 library_a）
    let game_b = library_b.join("EldenRing");
    fs::create_dir_all(&game_b).unwrap();
    fs::copy(game_a.join("trainer.exe"), game_b.join("trainer.exe")).unwrap();
    fs::copy(game_a.join("trainer.json"), game_b.join("trainer.json")).unwrap();

    // 在 library_b 中触发删除
    let result = storage::delete_installed_trainer_in_dir("elden_ring", &library_b);
    assert!(
        result.is_ok(),
        "在 library_b 中删除条目应成功: {:?}",
        result
    );

    // 验证：library_b 的副本被删除
    assert!(!game_b.exists(), "library_b 中的副本应该被彻底删除");

    // 核心安全验证：library_a 中的原版目录与文件必须完好无损，绝对不允许被越界删除！
    assert!(
        game_a.exists(),
        "P0-01 防御失败：原库中的文件夹居然被越界删除了！"
    );
    assert!(
        game_a.join("trainer.exe").exists(),
        "P0-01 防御失败：原库中的 exe 被删除了！"
    );

    let _ = fs::remove_dir_all(&root);
}

#[test]
fn test_p0_01_boundary_attack_defense() {
    let root = create_temp_test_dir("p0_01_boundary");
    let library = root.join("trainers");
    fs::create_dir_all(&library).unwrap();

    // 试图删除不存在的修改器
    let res1 = storage::delete_installed_trainer_in_dir("nonexistent_id", &library);
    assert!(res1.is_err(), "删除不存在的修改器应报错");

    // 试图传入空 ID
    let res2 = storage::delete_installed_trainer_in_dir("   ", &library);
    assert!(res2.is_err(), "空 ID 应被拦截");

    let _ = fs::remove_dir_all(&root);
}

#[test]
fn test_p0_02_migration_topology_checks() {
    let root = create_temp_test_dir("p0_02_topology");
    let source = root.join("source_trainers");
    fs::create_dir_all(&source).unwrap();

    // 1. 目标与源相同
    let res_same = config::migrate_trainers_dir_from_to(&source, source.to_str().unwrap(), false);
    assert!(res_same.is_err());
    assert!(res_same.unwrap_err().contains("目标路径与当前存储路径相同"));

    // 2. 目标是源的子目录
    let nested = source.join("nested_target");
    let res_nested = config::migrate_trainers_dir_from_to(&source, nested.to_str().unwrap(), false);
    assert!(res_nested.is_err());
    assert!(
        res_nested
            .unwrap_err()
            .contains("目标路径不能位于当前存储路径内部")
    );

    // 3. 源是目标的子目录
    let parent = root.clone();
    let res_parent = config::migrate_trainers_dir_from_to(&source, parent.to_str().unwrap(), false);
    assert!(res_parent.is_err());
    assert!(
        res_parent
            .unwrap_err()
            .contains("当前存储路径不能位于目标路径内部")
    );

    let _ = fs::remove_dir_all(&root);
}

#[test]
fn test_p0_02_migration_precheck_conflict_prevents_overwrite() {
    let root = create_temp_test_dir("p0_02_conflict");
    let source = root.join("source");
    let target = root.join("target");
    fs::create_dir_all(&source).unwrap();
    fs::create_dir_all(&target).unwrap();

    // 在源目录建立修改器
    let game_src = source.join("Sekiro");
    create_dummy_record("sekiro", &game_src);

    // 在目标目录预先放置同名修改器，具有不同的 exe 内容
    let game_tgt = target.join("Sekiro");
    fs::create_dir_all(&game_tgt).unwrap();
    let target_file = game_tgt.join("trainer.exe");
    fs::write(&target_file, b"EXISTING_TARGET_EXE_DO_NOT_OVERWRITE").unwrap();

    // 尝试执行迁移
    let res = config::migrate_trainers_dir_from_to(&source, target.to_str().unwrap(), false);

    // 验证：应被安全拦截，报错中止
    assert!(res.is_err(), "迁移应因目标存在同名文件夹而拒绝静默覆盖");
    assert!(res.unwrap_err().contains("已存在同名修改器文件夹"));

    // 验证：目标文件绝对没有被静默覆盖！
    let target_content = fs::read(&target_file).unwrap();
    assert_eq!(
        target_content, b"EXISTING_TARGET_EXE_DO_NOT_OVERWRITE",
        "P0-02 防御失败：目标文件被静默覆盖了！"
    );

    // 验证：源目录文件完好无损，未被误删
    assert!(
        game_src.join("trainer.exe").exists(),
        "源目录文件应该保持原样"
    );

    let _ = fs::remove_dir_all(&root);
}

#[test]
fn test_p0_02_migration_transaction_success_and_path_healing() {
    let root = create_temp_test_dir("p0_02_success");
    let source = root.join("source");
    let target = root.join("target");
    fs::create_dir_all(&source).unwrap();
    fs::create_dir_all(&target).unwrap();

    let game_src = source.join("Cyberpunk2077");
    create_dummy_record("cyberpunk", &game_src);

    // 执行迁移
    let res = config::migrate_trainers_dir_from_to(&source, target.to_str().unwrap(), false);
    assert!(res.is_ok(), "干净迁移应成功: {:?}", res);
    assert_eq!(res.unwrap(), 1, "迁移计数应为 1");

    // 验证：目标目录已建立完整修改器文件夹与程序
    let game_tgt = target.join("Cyberpunk2077");
    assert!(game_tgt.exists(), "目标游戏目录应存在");
    assert!(game_tgt.join("trainer.exe").exists(), "目标 exe 应存在");

    // 验证：目标目录内的 trainer.json 中的 install_dir 和 exe_path 已校准更新为新路径
    let info_content = fs::read_to_string(game_tgt.join("trainer.json")).unwrap();
    let record: InstalledTrainerRecord = serde_json::from_str(&info_content).unwrap();
    let clean_game_tgt = storage::strip_verbatim_prefix(&fs::canonicalize(&game_tgt).unwrap());
    assert_eq!(
        PathBuf::from(&record.install_dir),
        clean_game_tgt,
        "trainer.json 中的 install_dir 必须更新为目标路径"
    );

    // 验证：源目录已被安全清理
    assert!(!game_src.exists(), "原源目录应该已被移走或清理");

    let _ = fs::remove_dir_all(&root);
}

#[test]
fn test_h2_ordinary_game_dir_not_inferred_and_cannot_be_deleted() {
    let root = create_temp_test_dir("h2_ordinary_game_dir");
    let games_dir = root.join("Games");
    let game_folder = games_dir.join("EldenRing");
    fs::create_dir_all(&game_folder).unwrap();
    fs::write(game_folder.join("eldenring.exe"), b"MZ-real-game-binary").unwrap();
    fs::write(game_folder.join("savegame.dat"), b"precious-save-data").unwrap();

    // 1. 扫描普通游戏目录绝不能推断并写入 trainer.json
    let records = storage::load_installed_records_in_dir(&games_dir);
    assert!(
        records.is_empty(),
        "普通游戏目录不含 trainer.json 时绝不能被识别为修改器"
    );
    assert!(
        !game_folder.join("trainer.json").exists(),
        "加载列表时严禁向普通游戏目录写入推断出的 trainer.json"
    );
    assert!(
        !game_folder.join(storage::TRAINER_MARKER_FILE).exists(),
        "加载列表时严禁向普通游戏目录写入归属标记"
    );

    // 2. 即使直接按文件夹同名 id 调用删除，也必须因为缺少合法 trainer.json 归属标记而被拦截
    let del_res = storage::delete_installed_trainer_in_dir("EldenRing", &games_dir);
    assert!(del_res.is_err(), "缺少合法 trainer.json 的目录必须拒绝删除");
    assert!(game_folder.exists(), "普通游戏文件夹不能被误删");
    assert!(
        game_folder.join("eldenring.exe").exists(),
        "普通游戏主程序不能被误删"
    );
    assert!(
        game_folder.join("savegame.dat").exists(),
        "普通游戏存档不能被误删"
    );

    let _ = fs::remove_dir_all(&root);
}

#[test]
fn test_h2_safe_target_dir_isolation_and_config_validation() {
    let root = create_temp_test_dir("h2_target_isolation");

    // 1. 普通非空游戏目录：自动隔离至 FlingTrainers 专用子目录，且配置直写校验必须拦截原普通目录
    let games_dir = root.join("Games");
    let game_folder = games_dir.join("Cyberpunk2077");
    fs::create_dir_all(&game_folder).unwrap();
    fs::write(game_folder.join("game.exe"), b"MZ-game").unwrap();

    let resolved_games =
        storage::resolve_safe_trainers_target_dir(games_dir.to_str().unwrap()).unwrap();
    assert_eq!(
        resolved_games,
        games_dir.join(storage::DEDICATED_LIBRARY_SUBDIR),
        "选择非空普通目录时必须自动隔离至 FlingTrainers 专用子目录"
    );
    assert!(
        storage::validate_custom_trainers_dir(games_dir.to_str().unwrap(), None).is_err(),
        "直接把非空普通目录写入 custom_trainers_dir 必须被拦截"
    );

    // 2. 磁盘根目录校验必须拒绝直接写入配置，并能自动解析为 <盘符>/FlingTrainers
    #[cfg(windows)]
    {
        assert!(storage::validate_custom_trainers_dir(r"C:\", None).is_err());
        let resolved_root = storage::resolve_safe_trainers_target_dir(r"C:\").unwrap();
        assert_eq!(
            resolved_root,
            PathBuf::from(r"C:\").join(storage::DEDICATED_LIBRARY_SUBDIR)
        );
    }

    // 3. 已有受管库标记或纯修改器库目录应允许直接复用，不再嵌套子目录
    let existing_lib = root.join("MyTrainers");
    storage::write_library_marker(&existing_lib).unwrap();
    let resolved_lib =
        storage::resolve_safe_trainers_target_dir(existing_lib.to_str().unwrap()).unwrap();
    assert_eq!(resolved_lib, existing_lib);
    assert!(storage::validate_custom_trainers_dir(existing_lib.to_str().unwrap(), None).is_ok());

    let _ = fs::remove_dir_all(&root);
}
