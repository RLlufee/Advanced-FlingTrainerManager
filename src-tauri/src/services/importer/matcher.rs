use regex::Regex;
use std::path::Path;

/// 从修改器文件名中启发式提取游戏名称与版本号
pub fn parse_game_info_from_filename(filename: &str) -> (String, String) {
    let name_without_ext = Path::new(filename)
        .file_stem()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| filename.to_string());

    // 1. 去除常见的发布组/来源前缀与后缀
    let mut cleaned = name_without_ext;
    let noisy_tags = [
        "[FLiNG]",
        "(FLiNG)",
        "-FLiNG",
        "_FLiNG",
        "FLiNG",
        "[3DM]",
        "(3DM)",
        "-3DM",
        "_3DM",
        "3DM",
        "[游侠]",
        "(游侠)",
        "游侠",
        "Trainer",
        "trainer",
        "TRAINER",
        "Cheats",
        "cheats",
        "Cheat",
        "cheat",
        "修改器",
    ];

    // 2. 正则提取版本号 (如 v1.0, v1.12, v1.0-v1.3+, 2024.08.20 等)
    let ver_regex =
        Regex::new(r"(?i)\b(v\d+(\.\d+)*(\-v\d+(\.\d+)*\+?)?|\d{4}\.\d{2}\.\d{2})\b").unwrap();
    let version = if let Some(caps) = ver_regex.find(&cleaned) {
        caps.as_str().to_string()
    } else {
        "v1.0+".to_string()
    };

    // 剔除 Plus 选项数量 (如 Plus 17, Plus 34)
    let plus_regex = Regex::new(r"(?i)\bplus\s*\d+\b").unwrap();
    cleaned = plus_regex.replace_all(&cleaned, " ").to_string();

    // 剔除版本号字符串
    cleaned = ver_regex.replace_all(&cleaned, " ").to_string();

    // 替换点号、下划线、连字符为单个空格
    cleaned = cleaned.replace(['.', '_', '-'], " ");

    for tag in noisy_tags {
        cleaned = cleaned.replace(tag, " ");
    }

    // 过滤连续多余空格
    let game_name: String = cleaned
        .split_whitespace()
        .collect::<Vec<&str>>()
        .join(" ")
        .trim()
        .to_string();

    let final_name = if game_name.is_empty() {
        Path::new(filename)
            .file_stem()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_else(|| "未知游戏修改器".to_string())
    } else {
        game_name
    };

    (final_name, version)
}

pub fn sanitize_folder_name(name: &str) -> String {
    let invalid = ['<', '>', ':', '"', '/', '\\', '|', '?', '*'];
    let sanitized: String = name
        .chars()
        .map(|c| if invalid.contains(&c) { ' ' } else { c })
        .collect();

    let trimmed = sanitized.trim().trim_matches('.').trim();
    if trimmed.is_empty() {
        "Unknown_Game".to_string()
    } else {
        trimmed.split_whitespace().collect::<Vec<&str>>().join(" ")
    }
}
