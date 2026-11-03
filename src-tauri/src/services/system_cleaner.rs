use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

const REPARSE_POINT_ATTRIBUTE: u32 = 0x400;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanupCategorySummary {
    pub id: String,
    pub name: String,
    pub description: String,
    pub icon: String,
    pub bytes: u64,
    pub file_count: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanupScanResult {
    pub total_bytes: u64,
    pub total_files: u64,
    pub categories: Vec<CleanupCategorySummary>,
    pub is_admin: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanupRunResult {
    pub freed_bytes: u64,
    pub cleaned_files: u64,
    pub failed_count: u64,
}

struct CategoryRule {
    id: &'static str,
    name: &'static str,
    description: &'static str,
    icon: &'static str,
    roots: Vec<PathBuf>,
    age_secs: Option<u64>,
}

fn env_dir(name: &str) -> Option<PathBuf> {
    std::env::var(name)
        .ok()
        .filter(|v| !v.trim().is_empty())
        .map(PathBuf::from)
}

fn system_root() -> PathBuf {
    env_dir("SystemRoot")
        .or_else(|| env_dir("WINDIR"))
        .unwrap_or_else(|| PathBuf::from("C:\\Windows"))
}

#[cfg(target_os = "windows")]
fn is_reparse_point(meta: &std::fs::Metadata) -> bool {
    use std::os::windows::fs::MetadataExt;
    meta.file_attributes() & REPARSE_POINT_ATTRIBUTE != 0
}

#[cfg(not(target_os = "windows"))]
fn is_reparse_point(meta: &std::fs::Metadata) -> bool {
    meta.file_type().is_symlink()
}

fn now_secs() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0)
}

fn shader_cache_dirs() -> Vec<PathBuf> {
    let Some(local) = env_dir("LOCALAPPDATA") else {
        return Vec::new();
    };
    [
        "NVIDIA\\DXCache",
        "NVIDIA\\GLCache",
        "AMD\\DxCache",
        "AMD\\GLCache",
        "D3DSCache",
        "Microsoft\\DirectXShaderCache",
    ]
    .iter()
    .map(|sub| local.join(sub))
    .filter(|p| p.is_dir())
    .collect()
}

fn browser_cache_dirs() -> Vec<PathBuf> {
    let mut dirs = Vec::new();
    let Some(local) = env_dir("LOCALAPPDATA") else {
        return dirs;
    };
    let browsers = [("Google", "Chrome"), ("Microsoft", "Edge")];
    for (vendor, name) in browsers {
        let user_data = local.join(vendor).join(name).join("User Data");
        if let Ok(entries) = std::fs::read_dir(&user_data) {
            for entry in entries.flatten() {
                let profile = entry.path();
                for cache in ["Cache", "Code Cache", "GPUCache", "ShaderCache"] {
                    let candidate = profile.join(cache);
                    if candidate.is_dir() {
                        dirs.push(candidate);
                    }
                }
            }
        }
    }
    dirs
}

fn thumbnail_cache_files() -> Vec<PathBuf> {
    let Some(local) = env_dir("LOCALAPPDATA") else {
        return Vec::new();
    };
    let explorer = local.join("Microsoft").join("Windows").join("Explorer");
    let mut files = Vec::new();
    if let Ok(entries) = std::fs::read_dir(&explorer) {
        for entry in entries.flatten() {
            let name = entry.file_name().to_string_lossy().to_ascii_lowercase();
            if name.starts_with("thumbcache_") || name.starts_with("iconcache_") {
                files.push(entry.path());
            }
        }
    }
    files
}

fn delivery_optimization_dirs() -> Vec<PathBuf> {
    let mut dirs = Vec::new();
    let root = system_root();
    let do_path = root
        .join("ServiceProfiles")
        .join("NetworkService")
        .join("AppData")
        .join("Local")
        .join("Microsoft")
        .join("Windows")
        .join("DeliveryOptimization")
        .join("Cache");
    if do_path.is_dir() {
        dirs.push(do_path);
    }
    if let Some(program_data) = env_dir("ProgramData") {
        let pdata_do = program_data
            .join("Microsoft")
            .join("Windows")
            .join("DeliveryOptimization")
            .join("Cache");
        if pdata_do.is_dir() {
            dirs.push(pdata_do);
        }
    }
    dirs
}

fn get_cleanup_rules() -> Vec<CategoryRule> {
    let mut rules = Vec::new();

    // 1. 显卡与 DirectX 着色器缓存
    rules.push(CategoryRule {
        id: "shader_cache",
        name: "显卡与游戏着色器缓存",
        description: "DirectX / NVIDIA / AMD 着色器预编译缓存，解决游戏卡顿与换驱动残留",
        icon: "Gamepad2",
        roots: shader_cache_dirs(),
        age_secs: None,
    });

    // 2. 游戏与用户临时缓存
    let mut temp_roots = vec![std::env::temp_dir(), system_root().join("Temp")];
    if let Some(local) = env_dir("LOCALAPPDATA") {
        let dumps = local.join("CrashDumps");
        if dumps.is_dir() {
            temp_roots.push(dumps);
        }
    }
    rules.push(CategoryRule {
        id: "temp_files",
        name: "游戏解压与临时中转文件",
        description: "修改器与游戏启动时产生的无用临时文件，释放磁盘空间",
        icon: "FolderSync",
        roots: temp_roots,
        age_secs: Some(2 * 86_400), // 超过2天
    });

    // 3. 错误报告与崩溃转储
    if let Some(local) = env_dir("LOCALAPPDATA") {
        let wer = local.join("Microsoft").join("Windows").join("WER");
        if wer.is_dir() {
            rules.push(CategoryRule {
                id: "crash_dumps",
                name: "游戏闪退与错误报告日志",
                description: "Windows Error Reporting 生成的崩溃内存转储与报告文件",
                icon: "AlertOctagon",
                roots: vec![wer],
                age_secs: Some(3 * 86_400),
            });
        }
    }

    // 4. Windows 更新与交付分发
    let mut update_roots = vec![system_root().join("SoftwareDistribution").join("Download")];
    update_roots.extend(delivery_optimization_dirs());
    rules.push(CategoryRule {
        id: "update_cache",
        name: "系统更新与分发交付缓存",
        description: "Windows Update 安装包下载留存与 DeliveryOptimization P2P 共享缓存",
        icon: "DownloadCloud",
        roots: update_roots,
        age_secs: None,
    });

    // 5. 浏览器内核缓存
    rules.push(CategoryRule {
        id: "browser_cache",
        name: "浏览器内核与网页缓存",
        description: "Chrome 与 Edge 浏览器的临时网络缓存、GPU 渲染与 Code Cache",
        icon: "Globe",
        roots: browser_cache_dirs(),
        age_secs: None,
    });

    // 6. 缩略图与图标缓存
    let thumb_files = thumbnail_cache_files();
    if !thumb_files.is_empty() {
        rules.push(CategoryRule {
            id: "thumb_cache",
            name: "系统缩略图与图标缓存",
            description: "Windows 资源管理器 thumbcache_* 数据库，定期重建可防图标错乱",
            icon: "Image",
            roots: thumb_files,
            age_secs: None,
        });
    }

    rules
}

fn walk_path<F>(
    path: &Path,
    age_secs: Option<u64>,
    now: u64,
    on_file: &mut F,
    depth: u32,
) -> (u64, u64)
where
    F: FnMut(&Path, u64),
{
    if depth > 20 {
        return (0, 0);
    }
    let Ok(meta) = std::fs::symlink_metadata(path) else {
        return (0, 0);
    };
    if is_reparse_point(&meta) {
        return (0, 0);
    }

    if meta.is_file() {
        if let Some(age) = age_secs {
            let modified = meta
                .modified()
                .ok()
                .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
                .map(|d| d.as_secs())
                .unwrap_or(0);
            if now.saturating_sub(modified) < age {
                return (0, 0);
            }
        }
        let size = meta.len();
        on_file(path, size);
        return (size, 1);
    }

    if meta.is_dir() {
        let mut total_bytes = 0u64;
        let mut total_count = 0u64;
        if let Ok(entries) = std::fs::read_dir(path) {
            for entry in entries.flatten() {
                let (bytes, count) = walk_path(&entry.path(), age_secs, now, on_file, depth + 1);
                total_bytes = total_bytes.saturating_add(bytes);
                total_count = total_count.saturating_add(count);
            }
        }
        return (total_bytes, total_count);
    }

    (0, 0)
}

#[cfg(target_os = "windows")]
fn is_admin() -> bool {
    unsafe { windows_sys::Win32::UI::Shell::IsUserAnAdmin() != 0 }
}

#[cfg(not(target_os = "windows"))]
fn is_admin() -> bool {
    false
}

pub fn scan_system_cleanup() -> Result<CleanupScanResult, String> {
    let now = now_secs();
    let rules = get_cleanup_rules();
    let mut categories = Vec::new();
    let mut grand_total_bytes = 0u64;
    let mut grand_total_files = 0u64;

    for rule in &rules {
        let mut cat_bytes = 0u64;
        let mut cat_count = 0u64;

        for root in &rule.roots {
            let mut on_file = |_path: &Path, size: u64| {
                cat_bytes = cat_bytes.saturating_add(size);
                cat_count = cat_count.saturating_add(1);
            };
            walk_path(root, rule.age_secs, now, &mut on_file, 0);
        }

        grand_total_bytes = grand_total_bytes.saturating_add(cat_bytes);
        grand_total_files = grand_total_files.saturating_add(cat_count);

        categories.push(CleanupCategorySummary {
            id: rule.id.to_string(),
            name: rule.name.to_string(),
            description: rule.description.to_string(),
            icon: rule.icon.to_string(),
            bytes: cat_bytes,
            file_count: cat_count,
        });
    }

    Ok(CleanupScanResult {
        total_bytes: grand_total_bytes,
        total_files: grand_total_files,
        categories,
        is_admin: is_admin(),
    })
}

pub fn run_system_cleanup(selected_categories: Vec<String>) -> Result<CleanupRunResult, String> {
    let now = now_secs();
    let rules = get_cleanup_rules();
    let mut freed_bytes = 0u64;
    let mut cleaned_files = 0u64;
    let mut failed_count = 0u64;

    for rule in &rules {
        if !selected_categories.iter().any(|cat| cat == rule.id) {
            continue;
        }

        for root in &rule.roots {
            let mut on_file = |path: &Path, size: u64| match std::fs::remove_file(path) {
                Ok(()) => {
                    freed_bytes = freed_bytes.saturating_add(size);
                    cleaned_files = cleaned_files.saturating_add(1);
                }
                Err(_) => {
                    failed_count = failed_count.saturating_add(1);
                }
            };
            walk_path(root, rule.age_secs, now, &mut on_file, 0);
        }
    }

    Ok(CleanupRunResult {
        freed_bytes,
        cleaned_files,
        failed_count,
    })
}
