use app_lib::services::{config, game_meta, scraper, single_instance};
use std::fs;
use std::path::PathBuf;

fn create_temp_test_dir(prefix: &str) -> PathBuf {
    let unique = format!(
        "fling_import_tmp_p2_test_{}_{}_{}",
        prefix,
        std::process::id(),
        chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0)
    );
    let dir = std::env::temp_dir().join(unique);
    fs::create_dir_all(&dir).expect("创建临时测试目录失败");
    dir
}

#[test]
fn test_p2_02_clean_game_name_preserves_modern_and_strips_suffixes() {
    // 关键复现点：之前由于 rfind("Mod")，"A Modern Story Trainer" 会被误截断为 "A"
    assert_eq!(
        game_meta::clean_game_name("A Modern Story Trainer"),
        "A Modern Story",
        "A Modern Story 中的 Modern 绝不能被作为 Mod 误截断！"
    );

    assert_eq!(
        game_meta::clean_game_name("Cyberpunk 2077 v1.6 Plus 28 Trainer"),
        "Cyberpunk 2077",
        "多重版本号与 Trainer 后缀应完整平稳剥离"
    );

    assert_eq!(
        game_meta::clean_game_name("The Witcher 3: Wild Hunt - Trainer / Cheat"),
        "The Witcher 3: Wild Hunt",
        "连字符与复合后缀应被正确清洗"
    );

    assert_eq!(
        game_meta::clean_game_name("Resident Evil 4 Mod"),
        "Resident Evil 4",
        "末尾独立的 Mod 后缀应被剥离"
    );

    assert_eq!(
        game_meta::clean_game_name("Trainer"),
        "Trainer",
        "若标题本身仅为 Trainer，不可截断为空字符串"
    );
}

#[test]
fn test_p2_04_scraper_rejects_bogus_or_cloudflare_html() {
    let bogus_html = r#"
        <!DOCTYPE html>
        <html>
        <head><title>Attention Required! | Cloudflare</title></head>
        <body>
            <p>Please complete the security check to access flingtrainer.com</p>
        </body>
        </html>
    "#;

    let result = scraper::parse_trainer_detail(bogus_html, "sample-game-slug");
    assert!(
        result.is_err(),
        "对于无关/反爬 HTML 页面，parse_trainer_detail 必须返回错误，不可返回全空的 Ok(Trainer)！"
    );
}

#[test]
fn test_p2_08_clean_orphan_cache_accurate_reporting() {
    let test_dir = create_temp_test_dir("clean_test");
    let file_a = test_dir.join("temp_a.exe");
    let file_b = test_dir.join("temp_b.dat");

    fs::write(&file_a, b"sample temporary data A").unwrap();
    fs::write(&file_b, b"sample temporary data B").unwrap();

    let res = config::clean_orphan_cache();
    assert!(res.is_ok(), "clean_orphan_cache 应成功执行");
    let summary = res.unwrap();

    // 验证清理计数与字节释放量为真实成功数
    assert!(
        summary.cleaned_files_count >= 2,
        "应清理刚才创建的 2 个临时测试文件"
    );
    assert!(summary.freed_bytes > 0, "释放字节数应大于 0");
    assert!(!file_a.exists(), "临时文件 A 应被成功删除");
    assert!(!file_b.exists(), "临时文件 B 应被成功删除");

    let _ = fs::remove_dir_all(&test_dir);
}

#[cfg(windows)]
#[test]
fn test_p2_09_single_instance_prevents_duplicate_tray_and_wakes_existing() {
    use std::sync::Arc;
    use std::sync::atomic::{AtomicUsize, Ordering};

    let unique = format!(
        "p2_09_{}_{}",
        std::process::id(),
        chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0)
    );
    let mutex_name = format!("Local\\fling_p2_mutex_{}", unique);
    let event_name = format!("Local\\fling_p2_event_{}", unique);

    // 模拟首个实例启动并挂载托盘唤醒监听
    let mut primary = match single_instance::acquire_or_notify_with_names(&mutex_name, &event_name, None) {
        single_instance::AcquireOutcome::Primary(guard) => guard,
        single_instance::AcquireOutcome::SecondaryNotified => {
            panic!("首个实例必须成功抢占单实例锁")
        }
    };

    let wakeups = Arc::new(AtomicUsize::new(0));
    let wakeups_clone = Arc::clone(&wakeups);
    primary.start_wakeup_listener(move || {
        wakeups_clone.fetch_add(1, Ordering::SeqCst);
    });

    // 模拟主程序退至托盘后再次双击启动两次：均应返回 SecondaryNotified 并唤醒原实例
    for expected in 1..=2 {
        match single_instance::acquire_or_notify_with_names(&mutex_name, &event_name, None) {
            single_instance::AcquireOutcome::Primary(_) => {
                panic!("已存在托盘驻留实例时，重复启动不能创建新实例")
            }
            single_instance::AcquireOutcome::SecondaryNotified => {}
        }

        let deadline = std::time::Instant::now() + std::time::Duration::from_secs(2);
        while wakeups.load(Ordering::SeqCst) < expected && std::time::Instant::now() < deadline {
            std::thread::sleep(std::time::Duration::from_millis(10));
        }
        assert_eq!(wakeups.load(Ordering::SeqCst), expected);
    }

    drop(primary);
}
