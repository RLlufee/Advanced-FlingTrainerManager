pub mod cache;
pub mod client;
pub mod parser;

pub use client::*;
pub use parser::*;

use crate::models::{PaginatedTrainers, Trainer};
use crate::services::storage;
use std::time::Duration;

pub async fn fetch_trainers(page: u32) -> Result<PaginatedTrainers, String> {
    fetch_trainers_ext(page, false).await
}

pub async fn fetch_trainers_ext(
    page: u32,
    force_refresh: bool,
) -> Result<PaginatedTrainers, String> {
    // 首页 15 个条目默认内存缓存 15 分钟，避免频繁切换页面重复请求官网
    if page <= 1
        && !force_refresh
        && let Ok(cache) = cache::HOME_LIST_CACHE.lock()
        && let Some((instant, data)) = &*cache
        && instant.elapsed() < Duration::from_secs(900)
    {
        return Ok(data.clone());
    }

    let client = create_client()?;
    let url = if page <= 1 {
        format!("{}/", BASE_URL)
    } else {
        format!("{}/page/{}/", BASE_URL, page)
    };

    let response = client
        .get(&url)
        .header("Referer", BASE_URL)
        .send()
        .await
        .map_err(|e| format!("网络请求失败 (URL: {}): {}", url, e))?;

    if !response.status().is_success() {
        return Err(format!("官网返回状态码错误: {}", response.status()));
    }

    let html = response
        .text()
        .await
        .map_err(|e| format!("解析网页内容失败: {}", e))?;

    let mut trainers = parse_trainer_list(&html)?;
    for t in &mut trainers {
        let cleaned = crate::services::game_meta::clean_game_name(&t.name);
        t.chinese_name = crate::services::game_meta::query_local_chinese_name(&cleaned);
    }

    let result = PaginatedTrainers {
        trainers,
        page,
        total_pages: 50,
    };

    // 缓存第一页数据
    if page <= 1
        && let Ok(mut cache) = cache::HOME_LIST_CACHE.lock()
    {
        *cache = Some((std::time::Instant::now(), result.clone()));
    }

    Ok(result)
}

pub async fn search_trainers(query: &str, page: u32) -> Result<PaginatedTrainers, String> {
    let client = create_client()?;
    // 若输入中文，尝试从本地字典逆向映射为官网英文名
    let actual_query = if query
        .chars()
        .any(|c| ('\u{4e00}'..='\u{9fa5}').contains(&c))
    {
        crate::services::game_meta::reverse_lookup_english_by_chinese(query)
            .unwrap_or_else(|| query.to_string())
    } else {
        query.to_string()
    };

    let url = if page <= 1 {
        format!("{}/?s={}", BASE_URL, urlencoding(&actual_query))
    } else {
        format!(
            "{}/page/{}/?s={}",
            BASE_URL,
            page,
            urlencoding(&actual_query)
        )
    };

    let response = client
        .get(&url)
        .header("Referer", BASE_URL)
        .send()
        .await
        .map_err(|e| format!("搜索请求失败 (URL: {}): {}", url, e))?;

    if !response.status().is_success() {
        return Err(format!("官网搜索返回状态码错误: {}", response.status()));
    }

    let html = response
        .text()
        .await
        .map_err(|e| format!("解析搜索网页内容失败: {}", e))?;

    let mut trainers = parse_trainer_list(&html)?;
    for t in &mut trainers {
        let cleaned = crate::services::game_meta::clean_game_name(&t.name);
        t.chinese_name = crate::services::game_meta::query_local_chinese_name(&cleaned);
    }

    Ok(PaginatedTrainers {
        trainers,
        page,
        total_pages: 10,
    })
}

pub async fn get_trainer_detail(id: &str) -> Result<Trainer, String> {
    get_trainer_detail_ext(id, false).await
}

pub async fn get_trainer_detail_ext(id: &str, force_refresh: bool) -> Result<Trainer, String> {
    let slug = id.trim_matches('/').split('/').next_back().unwrap_or(id);

    // 1. 若非强制刷新，优先检查磁盘持久化缓存 (有效期 7 天)
    if !force_refresh
        && let Some(cached) = storage::load_cached_trainer(slug, 7 * 86400)
        && (!cached.options.is_empty() || !cached.option_items.is_empty())
    {
        return Ok(cached);
    }

    let client = create_client()?;
    let url = format!("{}/trainer/{}/", BASE_URL, slug);

    let response = client
        .get(&url)
        .header("Referer", BASE_URL)
        .send()
        .await
        .map_err(|e| format!("请求修改器详情失败 (URL: {}): {}", url, e))?;

    if !response.status().is_success() {
        return Err(format!("官网详情返回状态码错误: {}", response.status()));
    }

    let html = response
        .text()
        .await
        .map_err(|e| format!("解析详情网页失败: {}", e))?;

    let mut trainer = parse_trainer_detail(&html, slug)?;
    // 异步富化本地中文名与 Steam 官方高清原画、AppID 元数据
    crate::services::game_meta::enrich_trainer(&mut trainer).await;

    // 写入持久化缓存
    storage::save_cached_trainer(&trainer);

    Ok(trainer)
}
