use app_lib::services::{config, downloader, key_simulator};
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};

fn create_temp_test_dir(prefix: &str) -> PathBuf {
    let unique = format!(
        "fling-p1-test-{}-{}-{}",
        prefix,
        std::process::id(),
        chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0)
    );
    let dir = std::env::temp_dir().join(unique);
    fs::create_dir_all(&dir).expect("创建临时测试目录失败");
    dir
}

fn create_test_zip(p: &Path, entries: &[(&str, &[u8])]) {
    let mut writer = zip::ZipWriter::new(fs::File::create(p).unwrap());
    for (name, data) in entries {
        writer
            .start_file(*name, zip::write::SimpleFileOptions::default())
            .unwrap();
        writer.write_all(data).unwrap();
    }
    writer.finish().unwrap();
}

#[test]
fn test_p1_02_pe_header_validation_rejects_html() {
    let root = create_temp_test_dir("p1_02_html");
    let html_file = root.join("error.html");
    fs::write(
        &html_file,
        b"<html>Access denied 403 Cloudflare Challenge</html>",
    )
    .unwrap();

    let target_dir = root.join("target");
    fs::create_dir_all(&target_dir).unwrap();

    let result = downloader::process_package(&html_file, &target_dir, "test_game");
    assert!(
        result.is_err(),
        "HTML 响应必须被 process_package 拒绝，严禁当作 exe 写入！"
    );
    assert!(
        result
            .unwrap_err()
            .contains("非有效的 ZIP 压缩包或 Windows 可执行程序"),
        "应给出明确的错误页/非可执行文件提示"
    );

    let _ = fs::remove_dir_all(&root);
}

#[test]
fn test_p1_01_staging_nested_exe_and_rollback_protection() {
    let root = create_temp_test_dir("p1_01_staging");
    let zip_file = root.join("nested.zip");
    create_test_zip(
        &zip_file,
        &[
            ("nested/subfolder/MyTrainer.exe", b"MZ-valid-nested-binary"),
            ("readme.txt", b"trainer manual"),
        ],
    );

    let target_dir = root.join("target");
    fs::create_dir_all(&target_dir).unwrap();

    // 1. 验证嵌套目录中的 EXE 能被递归定位并提升到目标目录
    let exe_res = downloader::process_package(&zip_file, &target_dir, "test_game");
    assert!(
        exe_res.is_ok(),
        "嵌套 ZIP 应成功解压并提取出有效 exe: {:?}",
        exe_res
    );
    let exe_path = exe_res.unwrap();
    assert!(exe_path.exists(), "解压出的 exe 必须存在于目标目录");
    assert_eq!(fs::read(&exe_path).unwrap(), b"MZ-valid-nested-binary");

    // 2. 验证损坏的 ZIP 解压失败时触发回滚，保护已有目录不残留 staging 垃圾
    let broken_zip = root.join("broken.zip");
    fs::write(
        &broken_zip,
        b"PK\x03\x04broken-data-not-a-valid-zip-content",
    )
    .unwrap();
    let broken_target = root.join("target_broken");
    fs::create_dir_all(&broken_target).unwrap();
    fs::write(broken_target.join("existing_old.exe"), b"MZ-existing").unwrap();

    let fail_res = downloader::process_package(&broken_zip, &broken_target, "test_game");
    assert!(fail_res.is_err(), "损坏的 ZIP 必须报错");
    // 已有文件依然完好
    assert!(
        broken_target.join("existing_old.exe").exists(),
        "解压失败时原目录已有文件必须完好"
    );

    let _ = fs::remove_dir_all(&root);
}

#[test]
fn test_p1_10_config_corrupt_backup_and_atomic_write() {
    let root = create_temp_test_dir("p1_10_corrupt");
    let cfg_file = root.join("app_config.json");
    fs::write(&cfg_file, b"{\"broken_json\": true, not closed").unwrap();

    // 原子安全写入测试
    let target_write = root.join("test_atomic.json");
    let write_res = config::atomic_write_file(&target_write, b"{\"test\": 123}");
    assert!(write_res.is_ok(), "原子写入应成功");
    assert_eq!(
        fs::read_to_string(&target_write).unwrap(),
        "{\"test\": 123}"
    );

    let _ = fs::remove_dir_all(&root);
}

#[test]
fn test_p1_11_hotkey_parser_comprehensive_matrix() {
    // 1. 小键盘加号与修饰键组合 (RUST-10)
    let num_plus = key_simulator::parse_hotkey("Num +");
    assert!(num_plus.is_some(), "Num + 必须能成功解析！");
    let p1 = num_plus.unwrap();
    assert_eq!(p1.vk, 0x6B, "Num + 的虚拟键码应为 VK_ADD (0x6B)");
    assert!(!p1.ctrl && !p1.alt && !p1.shift);

    let ctrl_num_plus = key_simulator::parse_hotkey("Ctrl + Num +");
    assert!(ctrl_num_plus.is_some(), "Ctrl + Num + 必须能成功解析！");
    let p2 = ctrl_num_plus.unwrap();
    assert_eq!(p2.vk, 0x6B);
    assert!(p2.ctrl && !p2.alt && !p2.shift);

    // 2. 拒绝非法多主键组合 (RUST-10: Ctrl+A+B 严禁静默解析成 Ctrl+B)
    let multi_key = key_simulator::parse_hotkey("Ctrl+A+B");
    assert!(
        multi_key.is_none(),
        "Ctrl+A+B 为非法多主键组合，必须返回 None 拒绝！"
    );

    let multi_key2 = key_simulator::parse_hotkey("Shift+F1+F2");
    assert!(multi_key2.is_none(), "Shift+F1+F2 必须返回 None 拒绝！");

    // 3. 常见功能键与扩展键补齐
    let space = key_simulator::parse_hotkey("Space").unwrap();
    assert_eq!(space.vk, 0x20);

    let tab = key_simulator::parse_hotkey("Ctrl+Tab").unwrap();
    assert_eq!(tab.vk, 0x09);
    assert!(tab.ctrl);

    let esc = key_simulator::parse_hotkey("Esc").unwrap();
    assert_eq!(esc.vk, 0x1B);

    let enter = key_simulator::parse_hotkey("Enter").unwrap();
    assert_eq!(enter.vk, 0x0D);

    let f13 = key_simulator::parse_hotkey("F13").unwrap();
    assert_eq!(f13.vk, 0x7C);

    let f24 = key_simulator::parse_hotkey("F24").unwrap();
    assert_eq!(f24.vk, 0x87);

    let arrow_up = key_simulator::parse_hotkey("Up").unwrap();
    assert_eq!(arrow_up.vk, 0x26);

    let arrow_down = key_simulator::parse_hotkey("Down").unwrap();
    assert_eq!(arrow_down.vk, 0x28);
}
