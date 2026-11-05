<div align="center">

  <br />
  <img src="public/app-icon.png" width="136" height="136" alt="Advanced FlingTrainerManager Logo" style="border-radius: 28px; box-shadow: 0 12px 36px rgba(36, 200, 216, 0.28);" />

  #  Advanced FlingTrainerManager

  <p align="center">
    <strong>优雅 · 灵动 ·  纯粹</strong><br />
    专为 PC 玩家打造的次世代风灵月影修改器桌面生命周期管理客户端
  </p>

  <p align="center">
    <a href="https://github.com/RLlufee/Advanced-FlingTrainerManager/releases"><img src="https://img.shields.io/badge/Release-v0.2.37-00f2fe.svg?style=for-the-badge&logo=github&logoColor=white" alt="Release Version" /></a>
    <a href="https://tauri.app/"><img src="https://img.shields.io/badge/Tauri-v2.12-24C8D8.svg?style=for-the-badge&logo=tauri&logoColor=white" alt="Tauri Version" /></a>
    <a href="https://www.rust-lang.org/"><img src="https://img.shields.io/badge/Rust-2024%20Edition-DEA584.svg?style=for-the-badge&logo=rust&logoColor=white" alt="Rust Edition" /></a>
    <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19.1-61DAFB.svg?style=for-the-badge&logo=react&logoColor=black" alt="React 19" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/TailwindCSS-v4.0-38B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS v4" /></a>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/Platform-Windows%2010%2F11-0078D6.svg?style=flat-square&logo=windows" alt="Platform Windows" />
    <img src="https://img.shields.io/badge/Display-240Hz%2B%20Gaming%20Ready-ff007f.svg?style=flat-square" alt="240Hz High Refresh" />
    <img src="https://img.shields.io/badge/Memory-NT%20EmptyWorkingSet-10b981.svg?style=flat-square" alt="Kernel Memory Optimization" />
    <img src="https://img.shields.io/badge/Subsystem-Pure%20GUI%20(Zero%20Conhost)-8b5cf6.svg?style=flat-square" alt="Pure GUI" />
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-GPLv3-green.svg?style=flat-square" alt="GPLv3 License" /></a>
  </p>

  <p align="center">
    <a href="#-体验革新-传统方式-vs-本管理器"><b>⚡ 体验革新</b></a> •
    <a href="#-五大核心模块矩阵-feature-modules"><b>🧩 模块矩阵</b></a> •
    <a href="#-视网膜美学与动效-design--motion"><b>🎨 视觉引擎</b></a> •
    <a href="#-技术架构概览-architecture"><b>🛠️ 技术架构</b></a> •
    <a href="#-快速上手-quick-start"><b>🚀 快速上手</b></a> •
    <a href="#-常见问题-faq"><b>❓ 常见问题</b></a> 
  </p>

  <br />
</div>

> 💡 **告别弹窗广告、繁琐解压与古董黑框！**  
> 无论是 Steam 游戏一键联动双驱、离线中英拼音毫秒级搜库，还是 20px 磨砂亚克力小托盘与 Windows NT 内核级物理内存压缩，皆为追求极致体验的 PC 玩家而生。

---

## ⚡ 体验革新：传统方式 vs 本管理器

| 痛点场景 | 传统修改器管理 ❌ | Advanced FlingTrainerManager ✨ |
| :---: | :--- | :--- |
| **资源获取** | 广告弹窗满天飞、虚假高速链接、误下捆绑流氓软件 | 纯净网络爬虫毫秒直连官网全库，**零广告 · 零捆绑 · 零诱导** |
| **游戏搜索** | 只能机械搜索英文原名，中文译名容易脱节，不支持拼音 | 内置 SQLite 离线双语词库，支持 **英文 / 中文 / 拼音** 混合模糊检索 |
| **启动流程** | 手动启动游戏 -> 翻找文件夹解压修改器 -> 手动切回运行 | **一键双驱联动**：单次点击自动关联 Steam 游戏并同步呼出修改器 |
| **系统托盘** | Win32 祖传死板黑框右键菜单，极易卡死或误触发 | **260×320 悬浮亚克力磨砂小窗**，自适应吸附任务栏，失焦无感即收 |
| **内存负担** | 游戏与修改器进程散落残留，系统物理内存持续告急 | **Windows NT 内核级内存压缩**（`EmptyWorkingSet`），一键秒级释放 RAM |
| **视觉交互** | 灰暗死板、WebView 锁频 60Hz 掉帧、提权弹出黑控制台 | **Material 3 莫奈动态取色 + 240Hz 满血高刷 + 纯 GUI 零黑框闪现** |

---

## 🧩 五大核心模块矩阵 (Feature Modules)

<div align="center">

| 🚀 启动中心 | 📥 下载中心 | ⚙️ 设置中心 | 🧰 更多工具 | 🛸 亚克力托盘 |
| :---: | :---: | :---: | :---: | :---: |
| 游戏修改器双驱启动 | 官网全库秒级抓取 | 6大偏好细分中枢 | NT内核物理内存压缩 | 20px 大圆角磨砂浮窗 |
| 离线双语拼音秒搜 | Staging 隔离防损流水线 | 事务级无损目录搬家 | 硬件健康体检看板 | 自适应物理吸附任务栏 |
| 热键自动解析与记忆 | 零残留自动解压部署 | 莫奈动态调色盘沙盒 | 游戏环境运行库直达 | 托盘迷你极客工具集 |

</div>

<br />

<details open>
<summary><b>🔍 点击展开 / 收起各模块深度特性一览</b></summary>
<br />

#### 🚀 1. 启动中心 (Launch Center)
- 🎮 **一键双驱启动**：智能关联 Steam AppID 与本地游戏执行体，单次点击同步拉起游戏与修改器；
- 📖 **离线双语联想**：内嵌 `fling_translations.db` 离线词典，支持中英双语、民间昵称与拼音首字母毫秒定位；
- ⌨️ **热键映射面板**：自动语法分析修改器内嵌快捷键，支持作弊项状态记忆与按键模拟触发；
- 📂 **外部资产秒级扫描**：一键导入玩家历史收藏文件夹，深度递归解析并智能补全游戏海报与元数据。

#### 📥 2. 下载中心 (Download Center)
- ⚡ **官网秒级抓取**：高性能爬虫引擎直连官网全量修改器库，分类清晰，即点即看；
- 🛡️ **Staging 暂存流水线**：下载包自动进入隔离暂存区，哈希校验通过后静默解压部署，零垃圾残留；
- 🖼️ **富媒体详情视窗**：版本历程、兼容架构、热键速查、游戏封面一应俱全。

#### ⚙️ 3. 设置中心 (Settings Center)
- 🖥️ **系统与窗口行为**：开机自启（注册表驱动）、关闭窗口最小化至托盘驻留、管理员提权无黑重启；
- 💾 **便携存储管理**：自定义安装目录、事务级跨盘迁移（带异常自动回滚）、离线词库重建；
- 🎨 **外观与色彩沙盒**：Material 3 莫奈动态取色、明暗双模秒切、调色盘 Hex 自定义；
- 🎬 **动效实验室**：Motion 弹簧力学刚度/阻尼无级微调，微交互独立开关；
- 🌐 **网络代理通道**：HTTP/SOCKS5 代理网关配置、Steam CDN 加速节点切换。

#### 🧰 4. 更多工具 (More Tools)
- 🧹 **内存极限压缩**：调用 Windows NT 内核 `EmptyWorkingSet`，秒级剥离闲置物理分页；
- 💻 **硬件体检仪表盘**：CPU 核心、GPU 渲染器、多分区磁盘占用、内存负载与 Uptime 实时监控，一键导出体检报告；
- 🛠️ **游戏运行库直达**：DirectX 修复、VC++ 运行库集合、Windows 游戏模式及 Xbox Game Bar 快速直达。

#### 🛸 5. 亚克力悬浮托盘 (Acrylic Tray)
- 🪟 **独立亚克力浮窗**：`260px × 320px` 透明毛玻璃形态，失焦自收缩，彻底淘汰 Win32 原生黑框；
- 🎯 **自适应吸附**：距屏幕任务栏上边缘 12px 智能对齐，平滑贴合；
- ⚡ **迷你操作台**：一键内存释放、直达修改器目录、提权重启、彻底退出。

</details>

---

## 🎨 视网膜美学与动效 (Design & Motion)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Retina Visual Experience                        │
├─────────────────────┬──────────────────────────┬───────────────────────┤
│ 💎 Material 3 莫奈  │ 🌊 Spring 弹性物理力学   │ 🚀 240Hz+ 满血电竞高刷│
│ 提取壁纸派生 6 级主色│ 告别生硬机械过渡，自然回弹│ 解锁 WebView2 锁频限制│
└─────────────────────┴──────────────────────────┴───────────────────────┘
```

<br />

| 交互组件 | 视觉特色 | 体验升级 |
| :--- | :--- | :--- |
| **`MagneticTab` 磁吸胶囊** | 标签页切换自带惯性拉伸与弹性形变 | 犹如水滴般丝滑游走于各导航项之间 |
| **`JellyIcon` 果冻弹簧** | 标题栏专属 Logo、托盘小窗及高频按钮轻触回弹 | 生动灵动的触觉反馈，拒绝死板静态界面 |
| **`FluidSlider` 液体滑块** | 连续数值拖拽如液体流淌，附带动态数值气泡 | 精准调校阻尼、模糊半径与透明度 |
| **`TypewriterTooltip` 打字机** | 悬停开关时字符轻快逐字跃出 | 极客感十足的实时微动效提示 |
| **壁纸游乐场抽屉** | `0~40px` 高斯模糊、蒙版浓度、暗角与胶片颗粒质感 | 随意打造属于你自己的沉浸式背景世界 |

---

## 🛠️ 技术架构概览 (Architecture)

```
┌──────────────────────────────────────────────────────────────┐
│                 Advanced FlingTrainerManager                 │
└──────────────────────────────┬───────────────────────────────┘
                               │
       ┌───────────────────────┴───────────────────────┐
       ▼                                               ▼
┌─────────────────────────────┐         ┌──────────────────────────────┐
│     Frontend (React 19)     │  IPC    │      Backend (Rust 2024)     │
├─────────────────────────────┤ <=====> ├──────────────────────────────┤
│ • Vite 8 + TypeScript       │ Channel │ • Tauri v2.12 Framework      │
│ • Tailwind CSS v4 Engine    │         │ • Windows NT Win32 APIs      │
│ • Motion 14 Spring Physics  │         │ • reqwest + scraper (Spider) │
│ • Material 3 Monet Color    │         │ • rusqlite (Local Dict DB)   │
│ • Acrylic Tray Popup Webview│         │ • Pure GUI (Zero conhost)    │
└─────────────────────────────┘         └──────────────────────────────┘
```

---

## 🚀 快速上手 (Quick Start)

> [!NOTE]
> 运行环境要求：**Windows 10 / 11 (64-bit)**，**Node.js 18+**（推荐 pnpm 9+），以及 **Rust 1.80+ (2024 Edition)**。

```bash
# 1. 克隆代码仓库
git clone https://github.com/RLlufee/Advanced-FlingTrainerManager.git
cd Advanced-FlingTrainerManager

# 2. 安装前端依赖
pnpm install

# 3. 启动本地全栈热重载开发模式
pnpm tauri dev

# 4. 生产环境编译打包 (生成 NSIS 极速安装程序)
pnpm tauri build
```

---

## ❓ 常见问题 (FAQ)

<details>
<summary><b>🛡️ 杀毒软件对修改器报毒怎么办？</b></summary>
<br />

> 修改器需要使用底层 Windows API（`OpenProcess`、`WriteProcessMemory`）挂钩游戏内存以修改数据，此行为会被多数安全软件标记为特征报毒。
> 
> **本管理器 100% 开源纯净**，资源均直接来自风灵月影官网。建议在 Windows Defender 中将修改器存储目录（默认为 `trainers/`）加入**排除项名单**。
</details>

<details>
<summary><b>⚡ 为什么需要“以管理员权限重启”？</b></summary>
<br />

> Windows NT 严格的安全隔离机制限制了普通进程向高完整性级别进程执行内存挂钩。如果游戏是以管理员权限启动的，修改器必须具备相同权限才能正常注入。
> 
> 点击托盘浮窗或设置中心的「🛡️ 以管理员身份重启」即可**无黑框平滑提权**。
</details>

<details>
<summary><b>🪟 为什么关闭主窗口后还在后台运行？</b></summary>
<br />

> 为实现即时唤醒与托盘常驻一键内存清理，默认开启了「关闭主窗口最小化至托盘」。
> 
> 若需点击直接退出，可在 **设置 -> 系统与窗口行为** 中关闭该选项，或右键托盘浮窗点击 **彻底退出**。
</details>

<details>
<summary><b>📦 跨盘符搬家（目录迁移）安全吗？</b></summary>
<br />

> 搬家引擎采用**事务性（Transactional）复制机制**：先在目标盘校验完整性，全部无损确认后才更新数据库并清理源目录；中途发生意外自动安全回滚，**绝不丢失任何修改器文件**。
</details>

---

## 🤝 贡献与署名 (Authors & Credits)




<div align="center">

<img src="https://github.com/RLlufee.png" width="84" height="84" style="border-radius: 50%; box-shadow: 0 4px 16px rgba(33, 129, 153, 0.15);" /><br />**青衣 ([@RLlufee](https://github.com/RLlufee))** 

<br />

**开源协议**：本项目基于 [GPLv3 License](LICENSE) 开放源码。修改器资源版权均归原作者“风灵月影”所有，本项目仅供个人学习与交流使用。

<br />
