use crate::models::{PaginatedTrainers, Trainer, TrainerOptionItem};
use crate::services::storage;

use regex::Regex;
use scraper::{Html, Selector};
use std::sync::LazyLock;
use std::time::Duration;

pub const USER_AGENT: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
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
static TOOLTIP_BLOCK_REGEX: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"(?is)(?:<span[^>]*tooltipsall[^>]*>.*?</span>\s*)?<script[^>]*>[^<]*?toolTips\([^,]+,\s*'((?:[^'\\]|\\.)*)'\s*\);?.*?</script>").unwrap()
});
static TOOLTIP_EXTRACT_REGEX: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"@@TOOLTIP_START@@(.*?)@@TOOLTIP_END@@").unwrap()
});
static JQUERY_CLEAN_REGEX: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"(?i)jQuery\s*\(.*?\)\s*;?").unwrap()
});

pub fn create_client() -> Result<reqwest::Client, String> {
    crate::services::config::build_custom_http_client()
}

static HOME_LIST_CACHE: LazyLock<std::sync::Mutex<Option<(std::time::Instant, PaginatedTrainers)>>> =
    LazyLock::new(|| std::sync::Mutex::new(None));

pub async fn fetch_trainers(page: u32) -> Result<PaginatedTrainers, String> {
    fetch_trainers_ext(page, false).await
}

pub async fn fetch_trainers_ext(page: u32, force_refresh: bool) -> Result<PaginatedTrainers, String> {
    // 首页 15 个条目默认内存缓存 15 分钟，避免频繁切换页面重复请求官网
    if page <= 1 && !force_refresh {
        if let Ok(cache) = HOME_LIST_CACHE.lock() {
            if let Some((instant, data)) = &*cache {
                if instant.elapsed() < Duration::from_secs(900) {
                    return Ok(data.clone());
                }
            }
        }
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
    if page <= 1 {
        if let Ok(mut cache) = HOME_LIST_CACHE.lock() {
            *cache = Some((std::time::Instant::now(), result.clone()));
        }
    }

    Ok(result)
}

pub async fn search_trainers(query: &str, page: u32) -> Result<PaginatedTrainers, String> {
    let client = create_client()?;
    // 若输入中文，尝试从本地字典逆向映射为官网英文名
    let actual_query = if query.chars().any(|c| ('\u{4e00}'..='\u{9fa5}').contains(&c)) {
        crate::services::game_meta::reverse_lookup_english_by_chinese(query)
            .unwrap_or_else(|| query.to_string())
    } else {
        query.to_string()
    };

    let url = if page <= 1 {
        format!("{}/?s={}", BASE_URL, urlencoding(&actual_query))
    } else {
        format!("{}/page/{}/?s={}", BASE_URL, page, urlencoding(&actual_query))
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
    let slug = id.trim_matches('/').split('/').last().unwrap_or(id);

    // 1. 若非强制刷新，优先检查磁盘持久化缓存 (有效期 7 天)
    if !force_refresh {
        if let Some(cached) = storage::load_cached_trainer(slug, 7 * 86400) {
            if !cached.options.is_empty() || !cached.option_items.is_empty() {
                return Ok(cached);
            }
        }
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
        .replace("&#8212;", "-")
        .replace("&#8216;", "'")
        .replace("&#8217;", "'")
        .replace("&#8220;", "\"")
        .replace("&#8221;", "\"")
        .replace("&#039;", "'")
        .replace("&#39;", "'")
        .replace("&apos;", "'")
        .replace("&#046;", ".")
        .replace("&amp;", "&")
        .replace("&nbsp;", " ")
        .replace("&quot;", "\"")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace('–', "-")
        .replace('—', "-")
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

            let mut thumbnail = article
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

            if thumbnail.starts_with("//") {
                thumbnail = format!("https:{}", thumbnail);
            } else if thumbnail.starts_with('/') {
                thumbnail = format!("https://flingtrainer.com{}", thumbnail);
            }


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
                chinese_name: None,
                steam_app_id: None,
                hero_image: None,
                capsule_image: None,
            });
        }
    }

    Ok(list)
}

pub fn parse_trainer_detail(html: &str, slug: &str) -> Result<Trainer, String> {
    let document = Html::parse_document(html);

    let title_sel = Selector::parse("h1.post-title")
        .map_err(|e| format!("选择器错误: {:?}", e))?;
    let name_opt = document
        .select(&title_sel)
        .next()
        .map(|e| e.text().collect::<String>().trim().to_string())
        .filter(|s| !s.is_empty());

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

    if thumbnail.starts_with("//") {
        thumbnail = format!("https:{}", thumbnail);
    } else if thumbnail.starts_with('/') {
        thumbnail = format!("https://flingtrainer.com{}", thumbnail);
    }


    let entry_sel = Selector::parse(".entry")
        .map_err(|e| format!("选择器错误: {:?}", e))?;

    let raw_entry_html = document
        .select(&entry_sel)
        .next()
        .map(|c| c.inner_html())
        .unwrap_or_default();

    // 1. 全局提取内联 ToolTip 提示内容，并在全文本级别原子替换为单行占位符，防止内部 <br/> 导致拆行破坏脚本标签闭合
    let with_tooltips_extracted = TOOLTIP_BLOCK_REGEX.replace_all(&raw_entry_html, |caps: &regex::Captures| {
        let note_content = &caps[1];
        let safe_note = note_content
            .replace('\r', " ")
            .replace('\n', " ")
            .replace("<br />", "__BR__")
            .replace("<br/>", "__BR__")
            .replace("<br>", "__BR__");
        format!(" @@TOOLTIP_START@@{}@@TOOLTIP_END@@ ", safe_note)
    });

    // 2. 彻底清除全文本中所有剩余的 <script>...</script> 和 <style>...</style>
    let no_script = SCRIPT_REGEX.replace_all(&with_tooltips_extracted, "");
    let no_style = STYLE_REGEX.replace_all(&no_script, "");

    // 3. 将 HTML 按段落与换行标签规范化为换行符 \n
    let normalized_html = no_style
        .replace("<br />", "\n")
        .replace("<br/>", "\n")
        .replace("<br>", "\n")
        .replace("</p>", "\n")
        .replace("</div>", "\n");

    let mut options = Vec::new();
    let mut option_items = Vec::new();
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

            // 提取该项绑定的 Tooltip 说明
            let note = TOOLTIP_EXTRACT_REGEX.captures(trimmed_line).map(|cap| {
                cap[1]
                    .replace("__BR__", " ")
                    .replace("\\'", "'")
                    .replace("\\\"", "\"")
                    .replace("\\.", ".")
                    .replace("\\,", ",")
                    .replace("\\-", "-")
                    .replace("\\(", "(")
                    .replace("\\)", ")")
                    .split_whitespace()
                    .collect::<Vec<_>>()
                    .join(" ")
            });

            // 剥离占位符和所有剩余 HTML 标签
            let line_without_tooltip = TOOLTIP_EXTRACT_REGEX.replace_all(trimmed_line, "");
            let without_tags = HTML_TAG_REGEX.replace_all(&line_without_tooltip, "");
            let cleaned_entities = clean_html_entities(&without_tags);
            let mut cleaned_title = cleaned_entities.trim().to_string();

            // 双重保险：彻底截除任何潜在的 JS 脚本碎片关键字
            if let Some(idx) = cleaned_title.find(".ready")
                .or_else(|| cleaned_title.find("function("))
                .or_else(|| cleaned_title.find("jQuery("))
                .or_else(|| cleaned_title.find("toolTips("))
                .or_else(|| cleaned_title.find("tooltip_"))
            {
                cleaned_title = cleaned_title[..idx].trim().to_string();
            }

            // 校验是否为有效的功能项 (例如 "Num 1 - Infinite Health", "Ctrl+Num 1", "Alt+Num 1" 等)
            if !cleaned_title.is_empty() 
                && (cleaned_title.starts_with("Num") 
                    || cleaned_title.starts_with("Ctrl") 
                    || cleaned_title.starts_with("Alt") 
                    || cleaned_title.starts_with("Shift") 
                    || (cleaned_title.starts_with('F') && cleaned_title.chars().nth(1).map_or(false, |c| c.is_ascii_digit()))
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

    if download_url.starts_with("//") {
        download_url = format!("https:{}", download_url);
    } else if download_url.starts_with('/') {
        download_url = format!("https://flingtrainer.com{}", download_url);
    }

    // 校验页面有效性：如果既没有页面标题，又没有提取到任何修改功能选项与下载直链，说明是非法页面或反爬拦截
    if name_opt.is_none() && options.is_empty() && download_url.is_empty() {
        return Err("页面结构不匹配或缺少修改器核心数据（疑似反爬拦截或空白页）".to_string());
    }

    let name = name_opt.unwrap_or_else(|| slug.replace('-', " ").to_uppercase());

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
        chinese_name: None,
        steam_app_id: None,
        hero_image: None,
        capsule_image: None,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_clean_tooltip_and_extract_note_with_br() {
        let sample = r#"
        <div class="entry">
        <h6>OPTIONS</h6>
        <p style="padding-left: 40px;">Alt+Num 1 &#8211; Battle: God Mode <span class='tooltipsall tooltip_post_id_custom_f6cfc5874afaec59276453986baacb44 classtoolTipsCustomShortCode' style='border-bottom:2px dotted #888;'><img decoding="async" src="/wp-content/uploads/2022/07/tooltip-icon.png" width="12" height="12" style="cursor: pointer;"></span><script type="text/javascript">jQuery("document").ready(function(){ toolTips('.tooltip_post_id_custom_f6cfc5874afaec59276453986baacb44','When activated, player units will ignore most damages, but certain damages \(such as fall damage\) may still apply to player units\.<br/><br/>Only works in land battles, does not work in sea battles\.'); });</script><br />
        Ctrl+Num / &#8211; Edit Mouse Hover Item Amount <span class='tooltipsall tooltip_post_id_custom_34f807772012d7ea6d93571e5e2b186b classtoolTipsCustomShortCode' style='border-bottom:2px dotted #888;'><img decoding="async" style="cursor: pointer;" src="/wp-content/uploads/2022/07/tooltip-icon.png" width="12" height="12" /></span><script type="text/javascript">jQuery("document").ready(function(){ toolTips('.tooltip_post_id_custom_34f807772012d7ea6d93571e5e2b186b','Open the inventory, then activate this option, then move the cursor over an item to change its amount\.<br/><br/>Note, the display amount won\'t update immediately, close and re\-open the inventory to update the display values\.'); });</script></p>
        <p style="padding-left: 40px;">Alt+Num 1 &#8211; Loyalty <span class='tooltipsall tooltip_post_id_custom_65b8f370bed5c234ee5b2a5555773d43 classtoolTipsCustomShortCode' style='border-bottom:2px dotted #888;'><img decoding="async" style="cursor: pointer;" src="/wp-content/uploads/2022/07/tooltip-icon.png" width="12" height="12" /></span><script type="text/javascript">jQuery("document").ready(function(){ toolTips('.tooltip_post_id_custom_65b8f370bed5c234ee5b2a5555773d43','Takes effect when you open the character details menu of the character you want to edit\.'); });</script><br />
        <h6>NOTES</h6>
        </div>
        "#;
        
        let trainer = parse_trainer_detail(sample, "test-slug").unwrap();
        
        assert_eq!(trainer.option_items.len(), 3);
        assert_eq!(trainer.option_items[0].title, "Alt+Num 1 - Battle: God Mode");
        assert!(trainer.option_items[0].note.as_ref().unwrap().contains("When activated, player units will ignore most damages"));
        assert!(trainer.option_items[0].note.as_ref().unwrap().contains("Only works in land battles"));

        assert_eq!(trainer.option_items[1].title, "Ctrl+Num / - Edit Mouse Hover Item Amount");
        assert!(trainer.option_items[1].note.as_ref().unwrap().contains("Open the inventory, then activate this option"));

        assert_eq!(trainer.option_items[2].title, "Alt+Num 1 - Loyalty");
        assert_eq!(trainer.option_items[2].note.as_ref().unwrap(), "Takes effect when you open the character details menu of the character you want to edit.");
    }

    #[test]
    fn test_real_game_pages() {
        let pages = [
            ("scratch_beast.html", "beast-of-reincarnation-trainer", 30),
            ("scratch_shogun.html", "total-war-shogun-2-complete-edition-trainer", 15),
            ("scratch_3k.html", "legend-of-heroes-three-kingdoms-trainer", 30),
        ];

        for (filename, slug, expected_min) in pages {
            let path = if std::path::Path::new(filename).exists() {
                filename.to_string()
            } else {
                format!("../{}", filename)
            };
            if let Ok(content) = std::fs::read_to_string(&path) {
                let trainer = parse_trainer_detail(&content, slug).unwrap();
                println!("{}: parsed {} options", slug, trainer.option_items.len());
                assert!(
                    trainer.option_items.len() >= expected_min,
                    "Page {} expected >= {} options, but got {}",
                    filename,
                    expected_min,
                    trainer.option_items.len()
                );
                // 确保没有任何一项包含 .ready 或 toolTips 脚本残留
                for item in &trainer.option_items {
                    assert!(!item.title.contains("ready"), "Title contains ready: {}", item.title);
                    assert!(!item.title.contains("toolTips"), "Title contains toolTips: {}", item.title);
                }
            }
        }
    }
}

