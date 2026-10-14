use crate::models::{PaginatedTrainers, Trainer};
use scraper::{Html, Selector};
use std::time::Duration;

const USER_AGENT: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const BASE_URL: &str = "https://flingtrainer.com";

pub fn create_client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .user_agent(USER_AGENT)
        .timeout(Duration::from_secs(15))
        .build()
        .map_err(|e| format!("创建 HTTP 客户端失败: {}", e))
}

pub async fn fetch_trainers(page: u32) -> Result<PaginatedTrainers, String> {
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

    let trainers = parse_trainer_list(&html)?;
    Ok(PaginatedTrainers {
        trainers,
        page,
        total_pages: 50, // 默认支持分页浏览
    })
}

pub async fn search_trainers(query: &str, page: u32) -> Result<PaginatedTrainers, String> {
    let client = create_client()?;
    let url = if page <= 1 {
        format!("{}/?s={}", BASE_URL, urlencoding(query))
    } else {
        format!("{}/page/{}/?s={}", BASE_URL, page, urlencoding(query))
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

    let trainers = parse_trainer_list(&html)?;
    Ok(PaginatedTrainers {
        trainers,
        page,
        total_pages: 10,
    })
}

pub async fn get_trainer_detail(id: &str) -> Result<Trainer, String> {
    let client = create_client()?;
    // 兼容 id 格式：如果传入包含完整 url 或只有 slug
    let slug = id.trim_matches('/').split('/').last().unwrap_or(id);
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

    parse_trainer_detail(&html, slug)
}

fn urlencoding(input: &str) -> String {
    let mut encoded = String::new();
    for byte in input.bytes() {
        if byte.is_ascii_alphanumeric() || byte == b'-' || byte == b'_' || byte == b'.' || byte == b'~' {
            encoded.push(byte as char);
        } else {
            encoded.push_str(&format!("%{:02X}", byte));
        }
    }
    encoded
}

pub fn parse_trainer_list(html: &str) -> Result<Vec<Trainer>, String> {
    let document = Html::parse_document(html);
    let article_sel = Selector::parse("article.post-standard")
        .map_err(|e| format!("选择器错误: {:?}", e))?;
    let title_sel = Selector::parse("h2.post-title a")
        .map_err(|e| format!("选择器错误: {:?}", e))?;
    let thumb_sel = Selector::parse(".post-details-thumb img")
        .map_err(|e| format!("选择器错误: {:?}", e))?;
    let entry_sel = Selector::parse(".entry")
        .map_err(|e| format!("选择器错误: {:?}", e))?;
    let day_sel = Selector::parse(".post-details-day").ok();
    let month_sel = Selector::parse(".post-details-month").ok();
    let year_sel = Selector::parse(".post-details-year").ok();

    let mut list = Vec::new();

    for article in document.select(&article_sel) {
        if let Some(title_el) = article.select(&title_sel).next() {
            let name = title_el.text().collect::<String>().trim().to_string();
            let href = title_el.value().attr("href").unwrap_or_default();
            let id = href
                .trim_end_matches('/')
                .split('/')
                .last()
                .unwrap_or_default()
                .to_string();

            if id.is_empty() {
                continue;
            }

            let thumbnail = article
                .select(&thumb_sel)
                .next()
                .and_then(|img| {
                    img.value()
                        .attr("src")
                        .or_else(|| img.value().attr("data-src"))
                        .or_else(|| img.value().attr("data-lazy-src"))
                })
                .unwrap_or_default()
                .to_string();

            let entry_text = article
                .select(&entry_sel)
                .next()
                .map(|c| c.text().collect::<String>())
                .unwrap_or_default();

            let mut version = String::new();
            let mut game_version = String::new();

            for part in entry_text.split('·') {
                let p = part.trim();
                if p.contains("Options") || p.contains("Option") {
                    version = p.to_string();
                } else if p.contains("Game Version:") {
                    game_version = p.replace("Game Version:", "").trim().to_string();
                }
            }

            let day = day_sel.as_ref().and_then(|s| article.select(s).next()).map(|e| e.text().collect::<String>()).unwrap_or_default();
            let month = month_sel.as_ref().and_then(|s| article.select(s).next()).map(|e| e.text().collect::<String>()).unwrap_or_default();
            let year = year_sel.as_ref().and_then(|s| article.select(s).next()).map(|e| e.text().collect::<String>()).unwrap_or_default();
            let last_update = format!("{} {} {}", day.trim(), month.trim(), year.trim()).trim().to_string();

            list.push(Trainer {
                id,
                name,
                version,
                game_version,
                download_url: String::new(),
                description: entry_text,
                thumbnail,
                download_count: 0,
                last_update,
                options: Vec::new(),
                installed_path: None,
                is_installed: false,
            });
        }
    }

    Ok(list)
}

pub fn parse_trainer_detail(html: &str, slug: &str) -> Result<Trainer, String> {
    let document = Html::parse_document(html);

    let title_sel = Selector::parse("h1.post-title")
        .map_err(|e| format!("选择器错误: {:?}", e))?;
    let name = document
        .select(&title_sel)
        .next()
        .map(|e| e.text().collect::<String>().trim().to_string())
        .unwrap_or_else(|| slug.replace('-', " ").to_uppercase());

    let img_sel = Selector::parse(".entry img.aligncenter, .post-details-thumb img")
        .map_err(|e| format!("选择器错误: {:?}", e))?;
    let thumbnail = document
        .select(&img_sel)
        .next()
        .and_then(|img| {
            img.value()
                .attr("src")
                .or_else(|| img.value().attr("data-src"))
        })
        .unwrap_or_default()
        .to_string();

    let entry_sel = Selector::parse(".entry")
        .map_err(|e| format!("选择器错误: {:?}", e))?;
    let entry_text = document
        .select(&entry_sel)
        .next()
        .map(|c| c.text().collect::<String>())
        .unwrap_or_default();

    let mut version = String::new();
    let mut game_version = String::new();
    let mut last_update = String::new();

    // 寻找包含 Options 和 Game Version 的行
    for line in entry_text.lines() {
        let trimmed = line.trim();
        if trimmed.contains("Options") && (trimmed.contains("Game Version:") || trimmed.contains("Last Updated:")) {
            for part in trimmed.split('·') {
                let p = part.trim();
                if p.contains("Options") || p.contains("Option") {
                    version = p.to_string();
                } else if p.contains("Game Version:") {
                    game_version = p.replace("Game Version:", "").trim().to_string();
                } else if p.contains("Last Updated:") {
                    last_update = p.replace("Last Updated:", "").trim().to_string();
                }
            }
            break;
        }
    }

    // 提取修改项功能列表 (Options)
    let mut options = Vec::new();
    let mut in_options_block = false;

    for line in entry_text.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("OPTIONS") || trimmed.starts_with("Options") {
            in_options_block = true;
            continue;
        }

        if in_options_block {
            if trimmed.starts_with("DOWNLOAD") || trimmed.starts_with("Download") || trimmed.starts_with("NOTES") || trimmed.starts_with("Notes") {
                break;
            }
            if !trimmed.is_empty() && (trimmed.contains('-') || trimmed.contains(':') || trimmed.starts_with("Num") || trimmed.starts_with("Ctrl+") || trimmed.starts_with("Alt+")) {
                options.push(trimmed.to_string());
            }
        }
    }

    // 提取下载链接
    let mut download_url = String::new();
    if let Ok(attach_sel) = Selector::parse("a.attachment-link, .da-attachments-table a") {
        for a in document.select(&attach_sel) {
            if let Some(href) = a.value().attr("href") {
                if href.contains("download") || href.contains("attachment") || href.ends_with(".zip") || href.ends_with(".exe") {
                    download_url = href.to_string();
                    break;
                }
            }
        }
    }

    // 提取下载次数
    let download_count = if let Ok(cnt_sel) = Selector::parse(".attachment-downloads") {
        document
            .select(&cnt_sel)
            .next()
            .and_then(|el| el.text().collect::<String>().trim().parse::<u64>().ok())
            .unwrap_or(0)
    } else {
        0
    };

    Ok(Trainer {
        id: slug.to_string(),
        name,
        version,
        game_version,
        download_url,
        description: entry_text,
        thumbnail,
        download_count,
        last_update,
        options,
        installed_path: None,
        is_installed: false,
    })
}
