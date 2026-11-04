use crate::models::Trainer;
use crate::services::storage::get_app_data_dir;
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{LazyLock, RwLock};
use std::time::Duration;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameMetaCacheItem {
    pub chinese_name: Option<String>,
    pub steam_app_id: Option<u32>,
    pub hero_image: Option<String>,
    pub capsule_image: Option<String>,
}

static META_CACHE: LazyLock<RwLock<HashMap<String, GameMetaCacheItem>>> = LazyLock::new(|| {
    let mut map = HashMap::new();
    let cache_file = get_cache_file_path();
    if cache_file.exists()
        && let Ok(content) = fs::read_to_string(&cache_file)
        && let Ok(loaded) = serde_json::from_str::<HashMap<String, GameMetaCacheItem>>(&content)
    {
        map = loaded;
    }
    RwLock::new(map)
});

static CACHE_DIRTY: AtomicBool = AtomicBool::new(false);
static IS_FLUSH_SCHEDULED: AtomicBool = AtomicBool::new(false);

fn get_cache_file_path() -> PathBuf {
    get_app_data_dir().join("game_meta_cache.json")
}

/// 触发异步防抖持久化（合并 500ms 内的多次写入，锁外序列化 + 异步非阻塞写盘）
pub fn save_cache_to_disk() {
    CACHE_DIRTY.store(true, Ordering::Release);

    // 如果当前尚未安排刷新任务，启动轻量防抖任务
    if IS_FLUSH_SCHEDULED
        .compare_exchange(false, true, Ordering::AcqRel, Ordering::Acquire)
        .is_ok()
    {
        tokio::spawn(async {
            tokio::time::sleep(Duration::from_millis(500)).await;
            IS_FLUSH_SCHEDULED.store(false, Ordering::Release);

            if CACHE_DIRTY.swap(false, Ordering::AcqRel) {
                // 仅持有轻量读锁提取快照，几微秒内释放
                let snapshot = {
                    if let Ok(guard) = META_CACHE.read() {
                        guard.clone()
                    } else {
                        return;
                    }
                };

                // 锁外执行 JSON 序列化与异步非阻塞文件写入
                if let Ok(json) = serde_json::to_string_pretty(&snapshot) {
                    let file = get_cache_file_path();
                    let _ = tokio::fs::write(file, json).await;
                }
            }
        });
    }
}

/// 同步立即刷盘（用于测试或需要强保证写入的场景）
pub fn flush_cache_to_disk_sync() {
    if let Ok(guard) = META_CACHE.read() {
        let snapshot = guard.clone();
        drop(guard);
        if let Ok(json) = serde_json::to_string_pretty(&snapshot) {
            let file = get_cache_file_path();
            let _ = fs::write(file, json);
            CACHE_DIRTY.store(false, Ordering::Release);
        }
    }
}

/// 从缓存中查询已有的游戏元数据（优先 ID，次选清洗后的游戏名称，使用读锁无等待并发）
pub fn get_cached_game_meta(trainer_id: &str, game_name: &str) -> Option<GameMetaCacheItem> {
    if let Ok(cache) = META_CACHE.read() {
        if let Some(item) = cache.get(trainer_id) {
            return Some(item.clone());
        }

        let cleaned = clean_game_name(game_name).to_lowercase();
        for (k, v) in cache.iter() {
            if clean_game_name(k).to_lowercase() == cleaned {
                return Some(v.clone());
            }
            if let Some(zh) = &v.chinese_name
                && zh.to_lowercase() == cleaned
            {
                return Some(v.clone());
            }
        }
    }
    None
}

/// 定位本地 `fling_translations.db` 路径
fn find_translations_db_path() -> Option<PathBuf> {
    let mut candidates = vec![
        PathBuf::from("resources/fling_translations.db"),
        PathBuf::from("src-tauri/resources/fling_translations.db"),
        PathBuf::from("../resources/fling_translations.db"),
        PathBuf::from("libs/FLiNG-Downloader/resources/fling_translations.db"),
        get_app_data_dir().join("fling_translations.db"),
    ];

    if let Ok(exe_path) = std::env::current_exe()
        && let Some(exe_dir) = exe_path.parent()
    {
        candidates.push(exe_dir.join("resources").join("fling_translations.db"));
        candidates.push(exe_dir.join("fling_translations.db"));
    }

    for path in &candidates {
        if path.exists() {
            return Some(path.clone());
        }
    }
    None
}

/// 清洗风灵月影修改器标题，提取核心游戏英文名
pub fn clean_game_name(raw_name: &str) -> String {
    let mut cleaned = raw_name.trim().to_string();

    let suffixes = [
        "trainer / cheat",
        "trainer/cheat",
        "trainer",
        "cheats",
        "cheat",
        "plus",
        "mod",
        "fling",
    ];

    static VER_RE: std::sync::OnceLock<regex::Regex> = std::sync::OnceLock::new();
    let re = VER_RE.get_or_init(|| {
        regex::Regex::new(r"(?i)[\s\-_]+(v\d+(\.\d+)*[a-z]?|\+\d+|\bplus\s+\d+)$").unwrap()
    });

    loop {
        let trimmed = cleaned
            .trim_end_matches(&['-', '—', '–', ' ', '_', '/', '\\', '|', '+', ':', '.'][..])
            .trim();
        if trimmed.len() != cleaned.len() {
            cleaned = trimmed.to_string();
            continue;
        }

        let lower = cleaned.to_lowercase();
        let mut matched = false;

        for suffix in &suffixes {
            if lower.ends_with(suffix) {
                let suffix_len = suffix.len();
                let prefix_len = cleaned.len() - suffix_len;
                if prefix_len == 0 {
                    break;
                }
                let prev_char = cleaned[..prefix_len].chars().last();
                if let Some(c) = prev_char
                    && (c.is_whitespace()
                        || c == '-'
                        || c == '—'
                        || c == '–'
                        || c == '_'
                        || c == '/'
                        || c == '('
                        || c == '[')
                {
                    cleaned = cleaned[..prefix_len].trim().to_string();
                    matched = true;
                    break;
                }
            }
        }

        if !matched
            && let Some(m) = re.find(&cleaned)
            && m.start() > 0
        {
            cleaned = cleaned[..m.start()].trim().to_string();
            matched = true;
        }

        if !matched {
            break;
        }
    }

    if cleaned.is_empty() {
        raw_name.trim().to_string()
    } else {
        cleaned
    }
}

/// 包含游戏中文名、英文名、官网链接及 slug 的综合信息
#[derive(Debug, Clone, Default)]
pub struct LocalGameInfo {
    pub chinese_name: Option<String>,
    pub english_name: Option<String>,
    pub trainer_url: Option<String>,
    pub slug: Option<String>,
}

/// 从本地 SQLite 翻译数据库查询综合游戏信息 (含 trainer_url 与 slug)
pub fn query_local_game_and_trainer_info(game_name: &str) -> Option<LocalGameInfo> {
    let db_path = find_translations_db_path()?;
    let conn = Connection::open_with_flags(
        db_path,
        rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY | rusqlite::OpenFlags::SQLITE_OPEN_NO_MUTEX,
    )
    .ok()?;

    let normalized = game_name.to_lowercase();

    // 1. 先通过归一化英文精确匹配
    let mut stmt = conn
        .prepare("SELECT chinese_simplified, english, trainer_url FROM games WHERE normalized_english = ?1 LIMIT 1")
        .ok()?;

    if let Ok((cn, en, url)) = stmt.query_row([&normalized], |row| {
        Ok((
            row.get::<_, Option<String>>(0)?,
            row.get::<_, Option<String>>(1)?,
            row.get::<_, Option<String>>(2)?,
        ))
    }) {
        let slug = url.as_deref().and_then(extract_slug_from_url);
        return Some(LocalGameInfo {
            chinese_name: cn.filter(|s| !s.trim().is_empty()),
            english_name: en.filter(|s| !s.trim().is_empty()),
            trainer_url: url.filter(|s| !s.trim().is_empty()),
            slug,
        });
    }

    // 2. 模糊匹配
    let cleaned_name = game_name.replace(':', "").trim().to_string();
    let like_query = format!("%{}%", cleaned_name);
    let mut stmt2 = conn
        .prepare("SELECT chinese_simplified, english, trainer_url FROM games WHERE english LIKE ?1 OR normalized_english LIKE ?2 OR chinese_simplified LIKE ?3 LIMIT 1")
        .ok()?;

    if let Ok((cn, en, url)) = stmt2.query_row(
        [&like_query, &format!("%{}%", normalized), &like_query],
        |row| {
            Ok((
                row.get::<_, Option<String>>(0)?,
                row.get::<_, Option<String>>(1)?,
                row.get::<_, Option<String>>(2)?,
            ))
        },
    ) {
        let slug = url.as_deref().and_then(extract_slug_from_url);
        return Some(LocalGameInfo {
            chinese_name: cn.filter(|s| !s.trim().is_empty()),
            english_name: en.filter(|s| !s.trim().is_empty()),
            trainer_url: url.filter(|s| !s.trim().is_empty()),
            slug,
        });
    }

    None
}

/// 从 URL 中提取合法 slug (例如 "https://flingtrainer.com/trainer/victoria-3-trainer/" -> "victoria-3-trainer")
pub fn extract_slug_from_url(url: &str) -> Option<String> {
    let trimmed = url.trim_end_matches('/');
    let last_seg = trimmed.split('/').next_back()?.trim();
    if last_seg.is_empty() || last_seg.contains('.') || last_seg == "archive.flingtrainer.com" {
        None
    } else {
        Some(last_seg.to_string())
    }
}

/// 从英文名称推测标准风灵月影 slug
pub fn guess_slug_from_name(name: &str) -> String {
    let clean = name.to_lowercase().replace(
        [
            ':', '\'', '’', '.', ',', '!', '?', '(', ')', '[', ']', '—', '–', '-',
        ],
        " ",
    );
    let parts: Vec<&str> = clean.split_whitespace().collect();
    let base = parts.join("-");
    if base.ends_with("-trainer") {
        base
    } else {
        format!("{}-trainer", base)
    }
}

/// 从本地 SQLite 翻译数据库查询简体中文名
pub fn query_local_chinese_name(game_name: &str) -> Option<String> {
    let db_path = find_translations_db_path()?;
    let conn = Connection::open_with_flags(
        db_path,
        rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY | rusqlite::OpenFlags::SQLITE_OPEN_NO_MUTEX,
    )
    .ok()?;

    let normalized = game_name.to_lowercase();

    // 1. 先通过归一化英文精确匹配
    let mut stmt = conn
        .prepare("SELECT chinese_simplified FROM games WHERE normalized_english = ?1 LIMIT 1")
        .ok()?;

    if let Ok(res) = stmt.query_row([&normalized], |row| row.get::<_, String>(0))
        && !res.trim().is_empty()
    {
        return Some(res.trim().to_string());
    }

    // 2. 若精确匹配未中，尝试忽略标点符号的模糊匹配
    let like_query = format!("%{}%", game_name.replace(':', "").trim());
    let mut stmt2 = conn
        .prepare("SELECT chinese_simplified FROM games WHERE english LIKE ?1 OR normalized_english LIKE ?2 LIMIT 1")
        .ok()?;

    if let Ok(res) = stmt2.query_row([&like_query, &format!("%{}%", normalized)], |row| {
        row.get::<_, String>(0)
    }) && !res.trim().is_empty()
    {
        return Some(res.trim().to_string());
    }

    None
}

/// 获取本地离线翻译数据库中收录的游戏总数
pub fn get_offline_dictionary_count() -> usize {
    if let Some(db_path) = find_translations_db_path()
        && let Ok(conn) = Connection::open_with_flags(
            db_path,
            rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY | rusqlite::OpenFlags::SQLITE_OPEN_NO_MUTEX,
        )
        && let Ok(count) = conn.query_row("SELECT COUNT(*) FROM games", [], |row| {
            row.get::<_, usize>(0)
        })
    {
        return count;
    }
    1185
}

/// 根据输入的中文游戏名反向查找风灵月影官网的标准英文名（支持中文直接搜索）
pub fn reverse_lookup_english_by_chinese(chinese_keyword: &str) -> Option<String> {
    let db_path = find_translations_db_path()?;
    let conn = Connection::open_with_flags(
        db_path,
        rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY | rusqlite::OpenFlags::SQLITE_OPEN_NO_MUTEX,
    )
    .ok()?;

    let pattern = format!("%{}%", chinese_keyword.trim());
    let mut stmt = conn
        .prepare("SELECT english FROM games WHERE chinese_simplified LIKE ?1 LIMIT 1")
        .ok()?;

    if let Ok(english) = stmt.query_row([&pattern], |row| row.get::<_, String>(0))
        && !english.trim().is_empty()
    {
        return Some(english.trim().to_string());
    }

    None
}

#[derive(Debug, Deserialize)]
struct SteamSearchResponse {
    items: Option<Vec<SteamSearchItem>>,
}

#[derive(Debug, Deserialize)]
struct SteamSearchItem {
    id: u32,
    name: String,
}

/// 异步调用 Steam 官方 StoreSearch API 获取 AppID 与原画元数据
pub async fn fetch_steam_meta(game_name: &str) -> Option<(u32, String, String, String)> {
    let cleaned = clean_game_name(game_name);
    if cleaned.is_empty() {
        return None;
    }

    let url = format!(
        "https://store.steampowered.com/api/storesearch/?term={}&l=schinese&cc=CN",
        urlencoding(&cleaned)
    );

    let client = crate::services::config::get_shared_http_client().ok()?;

    let resp = client.get(&url).send().await.ok()?;
    if !resp.status().is_success() {
        return None;
    }

    let data = resp.json::<SteamSearchResponse>().await.ok()?;
    let items = data.items?;
    let first = items.into_iter().next()?;

    let app_id = first.id;
    let steam_chinese_name = first.name;
    let raw_capsule = format!(
        "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/{}/capsule_616x353.jpg",
        app_id
    );
    let raw_hero = format!(
        "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/{}/library_hero.jpg",
        app_id
    );
    let capsule_image = crate::services::config::apply_steam_cdn_mirror(&raw_capsule);
    let hero_image = crate::services::config::apply_steam_cdn_mirror(&raw_hero);

    Some((app_id, steam_chinese_name, hero_image, capsule_image))
}

fn urlencoding(input: &str) -> String {
    let mut encoded = String::new();
    for byte in input.bytes() {
        if byte.is_ascii_alphanumeric()
            || byte == b'-'
            || byte == b'_'
            || byte == b'.'
            || byte == b'~'
        {
            encoded.push(byte as char);
        } else {
            encoded.push_str(&format!("%{:02X}", byte));
        }
    }
    encoded
}

/// 为 Trainer 注入中文名称、Steam AppID 与官方高清原画
pub async fn enrich_trainer(trainer: &mut Trainer) {
    let cleaned_name = clean_game_name(&trainer.name);

    // 1. 先检查内存/磁盘持久化缓存（仅当已完整获取到 Steam 元数据时才直接短路返回，避免把网络偶发失败持久化为终态）
    if let Ok(cache) = META_CACHE.read()
        && let Some(cached) = cache.get(&trainer.id)
    {
        if cached.steam_app_id.is_some()
            && (cached.hero_image.is_some() || cached.capsule_image.is_some())
        {
            trainer.chinese_name = cached.chinese_name.clone();
            trainer.steam_app_id = cached.steam_app_id;
            trainer.hero_image = cached.hero_image.clone();
            trainer.capsule_image = cached.capsule_image.clone();
            return;
        } else if trainer.chinese_name.is_none() {
            trainer.chinese_name = cached.chinese_name.clone();
        }
    }

    // 2. 本地 SQLite 翻译库快速命中中文名
    let mut local_chinese = query_local_chinese_name(&cleaned_name);
    if local_chinese.is_none() {
        local_chinese = query_local_chinese_name(&trainer.name);
    }

    if trainer.chinese_name.is_none() {
        trainer.chinese_name = local_chinese.clone();
    }

    // 3. 异步请求 Steam StoreSearch API
    if let Some((app_id, steam_name, hero, capsule)) = fetch_steam_meta(&cleaned_name).await {
        trainer.steam_app_id = Some(app_id);
        trainer.hero_image = Some(hero.clone());
        trainer.capsule_image = Some(capsule.clone());

        // 如果本地数据库未命中中文名，使用 Steam 官方中文名
        if trainer.chinese_name.is_none() || trainer.chinese_name.as_deref() == Some(&trainer.name)
        {
            trainer.chinese_name = Some(steam_name.clone());
        }

        // 仅在成功获取到完整 Steam 元数据时才写回持久化缓存
        let item = GameMetaCacheItem {
            chinese_name: trainer.chinese_name.clone(),
            steam_app_id: Some(app_id),
            hero_image: Some(hero),
            capsule_image: Some(capsule),
        };

        if let Ok(mut cache) = META_CACHE.write() {
            cache.insert(trainer.id.clone(), item);
        }
        save_cache_to_disk();
    } else if let Some(zh) = local_chinese {
        // 仅命中本地离线中文名，不持久化为完整的缓存项，以便在网络通畅时仍可重试补齐 Steam 海报
        if trainer.chinese_name.is_none() {
            trainer.chinese_name = Some(zh);
        }
    }
}

/// 根据游戏名称解析完整的 Steam 与本地中文元数据
pub async fn resolve_meta_for_name(game_name: &str) -> GameMetaCacheItem {
    let cleaned = clean_game_name(game_name);
    if let Some(cached) = get_cached_game_meta(&cleaned, game_name) {
        return cached;
    }

    let mut local_chinese = query_local_chinese_name(&cleaned);
    if local_chinese.is_none() {
        local_chinese = query_local_chinese_name(game_name);
    }

    if let Some((app_id, steam_name, hero, capsule)) = fetch_steam_meta(&cleaned).await {
        let cn = local_chinese.or(Some(steam_name));
        let item = GameMetaCacheItem {
            chinese_name: cn,
            steam_app_id: Some(app_id),
            hero_image: Some(hero),
            capsule_image: Some(capsule),
        };

        if let Ok(mut cache) = META_CACHE.write() {
            cache.insert(cleaned, item.clone());
        }
        save_cache_to_disk();
        return item;
    }

    GameMetaCacheItem {
        chinese_name: local_chinese,
        steam_app_id: None,
        hero_image: None,
        capsule_image: None,
    }
}
