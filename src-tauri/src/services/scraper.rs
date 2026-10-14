use crate::models::{PaginatedTrainers, Trainer, TrainerOptionItem};
use regex::Regex;
use scraper::{Html, Selector};
use std::sync::LazyLock;
use std::time::Duration;

const USER_AGENT: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const BASE_URL: &str = "https://flingtrainer.com";

static SCRIPT_REGEX: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"(?is)<script[^>]*>.*?</script>").unwrap()
});
static STYLE_REGEX: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"(?is)<style[^>]*>.*?</style>").unwrap()
});
static HTML_TAG_REGEX: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"<[^>]+>").unwrap()
});
static TOOLTIP_REGEX: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"toolTips\([^,]+,\s*'((?:[^'\\]|\\.)*)'\)").unwrap()
});
static JQUERY_CLEAN_REGEX: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"(?i)jQuery\s*\(.*?\)\s*;?").unwrap()
});

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
        total_pages: 50,
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

fn clean_html_entities(s: &str) -> String {
    s.replace("&#8211;", "-")
        .replace("&#8212;", "—")
        .replace("&#8217;", "'")
        .replace("&#046;", ".")
        .replace("&amp;", "&")
        .replace("&nbsp;", " ")
        .replace("&quot;", "\"")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
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

            let entry_html = article
                .select(&entry_sel)
                .next()
                .map(|c| c.inner_html())
                .unwrap_or_default();

            // 清洗掉所有 script 和 style 标签
            let entry_no_script = SCRIPT_REGEX.replace_all(&entry_html, "");
            let entry_no_style = STYLE_REGEX.replace_all(&entry_no_script, "");
            let entry_clean = HTML_TAG_REGEX.replace_all(&entry_no_style, "");
            let entry_text = clean_html_entities(&entry_clean);

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
                option_items: Vec::new(),
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

    // 优先从 OpenGraph meta 提取官方游戏大封面图 (og:image / twitter:image)
    let og_image_sel = Selector::parse("meta[property='og:image'], meta[name='twitter:image']").ok();
    let mut thumbnail = og_image_sel
        .as_ref()
        .and_then(|sel| {
            document
                .select(sel)
                .next()
                .and_then(|el| el.value().attr("content"))
                .map(|s| s.to_string())
        })
        .unwrap_or_default();

    // 如果未从 meta 标签获取到有效图片，则在正文中挑选真实游戏封面（严格排除作者 Gravatar 头像与插件图标）
    if thumbnail.is_empty() || thumbnail.contains("gravatar.com") || thumbnail.contains("avatar") {
        if let Ok(entry_img_sel) = Selector::parse(".entry img.aligncenter, .entry img, .post-details-thumb img") {
            for img in document.select(&entry_img_sel) {
                if let Some(src) = img.value().attr("src").or_else(|| img.value().attr("data-src")) {
                    if !src.contains("gravatar.com")
                        && !src.contains("avatar")
                        && !src.contains("tooltip-icon")
                        && !src.ends_with(".gif")
                    {
                        thumbnail = src.to_string();
                        break;
                    }
                }
            }
        }
    }

    let entry_sel = Selector::parse(".entry")
        .map_err(|e| format!("选择器错误: {:?}", e))?;

    let raw_entry_html = document
        .select(&entry_sel)
        .next()
        .map(|c| c.inner_html())
        .unwrap_or_default();

    // 1. 先从原始 HTML 中精准提取每一项功能及内联 Tooltip 注意事项
    let mut options = Vec::new();
    let mut option_items = Vec::new();

    // 将 HTML 按行或按 <br> 划分，方便逐项捕获
    let normalized_html = raw_entry_html
        .replace("<br />", "\n")
        .replace("<br/>", "\n")
        .replace("<br>", "\n")
        .replace("</p>", "\n")
        .replace("</div>", "\n");

    let mut in_options_section = false;

    for line in normalized_html.lines() {
        let trimmed_line = line.trim();
        if trimmed_line.is_empty() {
            continue;
        }

        // 识别 OPTIONS 区块
        if trimmed_line.contains("OPTIONS") || trimmed_line.contains("Options</h6>") || (trimmed_line.contains("Options") && !trimmed_line.contains("Game Version:")) {
            in_options_section = true;
            continue;
        }

        if in_options_section {
            // 遇到后续非修改项区块则结束
            if trimmed_line.contains("DOWNLOAD") 
                || trimmed_line.contains("Download") 
                || trimmed_line.contains("NOTES") 
                || trimmed_line.contains("Notes</h6>")
                || trimmed_line.contains("SPECIAL NOTES")
            {
                break;
            }

            // 提取该项的 Tooltip 说明 (括号内的注意事项，彻底还原转义字符)
            let note = TOOLTIP_REGEX.captures(trimmed_line).map(|cap| {
                cap[1]
                    .replace("\\'", "'")
                    .replace("\\\"", "\"")
                    .replace("\\.", ".")
                    .replace("\\,", ",")
                    .replace("\\-", "-")
                    .trim()
                    .to_string()
            });

            // 彻底剥离 <script>...</script>、<style>...</style> 和所有 HTML 标签
            let without_scripts = SCRIPT_REGEX.replace_all(trimmed_line, "");
            let without_styles = STYLE_REGEX.replace_all(&without_scripts, "");
            let without_jquery = JQUERY_CLEAN_REGEX.replace_all(&without_styles, "");
            let without_tags = HTML_TAG_REGEX.replace_all(&without_jquery, "");
            let cleaned_title = clean_html_entities(&without_tags).trim().to_string();

            // 校验是否为有效的功能项 (例如 "Num 1 - Infinite Health", "Ctrl+Num 1", "Alt+Num 1" 等)
            if !cleaned_title.is_empty() 
                && (cleaned_title.starts_with("Num") 
                    || cleaned_title.starts_with("Ctrl") 
                    || cleaned_title.starts_with("Alt") 
                    || cleaned_title.starts_with("Shift") 
                    || cleaned_title.starts_with('F') && cleaned_title.chars().nth(1).map_or(false, |c| c.is_ascii_digit())
                    || cleaned_title.contains(" - ") 
                    || cleaned_title.contains(" – ")) 
            {
                options.push(cleaned_title.clone());
                option_items.push(TrainerOptionItem {
                    title: cleaned_title,
                    note,
                });
            }
        }
    }

    // 2. 生成纯净的 description（完全剔除脚本）
    let clean_desc_html = SCRIPT_REGEX.replace_all(&raw_entry_html, "");
    let clean_desc_html = STYLE_REGEX.replace_all(&clean_desc_html, "");
    let clean_desc_html = JQUERY_CLEAN_REGEX.replace_all(&clean_desc_html, "");
    let clean_desc_html = HTML_TAG_REGEX.replace_all(&clean_desc_html, "");
    let clean_description = clean_html_entities(&clean_desc_html)
        .lines()
        .map(|l| l.trim())
        .filter(|l| !l.is_empty())
        .collect::<Vec<_>>()
        .join("\n");

    // 3. 解析版本与更新日期
    let mut version = String::new();
    let mut game_version = String::new();
    let mut last_update = String::new();

    for line in clean_description.lines() {
        if line.contains("Options") && (line.contains("Game Version:") || line.contains("Last Updated:")) {
            for part in line.split('·') {
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

    // 4. 提取下载链接
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

    // 5. 提取下载次数
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
        description: clean_description,
        thumbnail,
        download_count,
        last_update,
        options,
        option_items,
        installed_path: None,
        is_installed: false,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_clean_tooltip_and_extract_note() {
        let sample = r#"Num 1 &#8211; God Mode/Ignore Hits <span class='tooltipsall'><img src='/icon.png'/></span><script type='text/javascript'>jQuery("document").ready(function(){ toolTips('.tooltip_id','When activated, enemies won\'t be able to damage you.'); });</script>"#;
        
        let note = TOOLTIP_REGEX.captures(sample).map(|cap| {
            cap[1].replace("\\'", "'").replace("\\\"", "\"").trim().to_string()
        });

        assert_eq!(note, Some("When activated, enemies won't be able to damage you.".to_string()));

        let without_scripts = SCRIPT_REGEX.replace_all(sample, "");
        let without_tags = HTML_TAG_REGEX.replace_all(&without_scripts, "");
        let cleaned = clean_html_entities(&without_tags).trim().to_string();

        assert_eq!(cleaned, "Num 1 - God Mode/Ignore Hits");
    }
}

