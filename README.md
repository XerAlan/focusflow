# FocusFlow

一款帮助用户进入工作模式的 Windows 桌面专注应用。集成 **预设软件快捷启动 / 番茄钟 / 待办事项 / 专注统计 / 本地音乐 / 一键工作模式 / 每日留言** 等功能。

> 平台：Windows 10 / 11
> 技术栈：Electron 28 + React 18 + TypeScript + Vite + Zustand + Howler.js + ECharts

---

## 📸 界面预览

### 主窗口

![主窗口](docs/screenshots/main-window.png)

### 底部留言 + 时钟

![底部行](docs/screenshots/bottom-row.png)

### 专注统计（含目标进度条）

![专注统计](docs/screenshots/stats-detail.png)

### 设置面板（含工作模式配置）

![设置](docs/screenshots/settings.png)

### 专注完成弹窗（自动开始休息）

![专注完成](docs/screenshots/focus-complete.png)

> 截图采集说明见 [docs/screenshots/README.md](docs/screenshots/README.md)

---

## 🎬 功能演示

### 完整功能演示

![演示](docs/screenshots/demo.gif)

### 一键工作模式

![工作模式](docs/screenshots/workmode-flow.gif)

---

## 目录

- [核心功能](#核心功能)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [构建与打包](#构建与打包)
- [使用说明](#使用说明)
- [一键工作模式详解](#一键工作模式详解)
- [数据存储位置](#数据存储位置)
- [常见问题](#常见问题)

---

## 核心功能

| 模块 | 说明 |
| ---- | ---- |
| 🕒 **番茄钟** | 默认 25 分钟专注 / 5 分钟短休 / 15 分钟长休；每完成 4 个专注进入长休息。专注完成自动开始休息 + 弹窗提示。开始/暂停/重置/跳过齐全，进度环形可视化。 |
| ✅ **Todo** | 添加 / 编辑 / 删除 / 完成；未完成与已完成分组；支持拖拽排序 + 上下移动按钮；**已完成支持全选 + 批量删除 + 批量恢复**。 |
| 📊 **专注统计** | 自动记录每次完成的专注，按自然日聚合。**渐变色柱状图 + 目标参考线 + 今日高亮 + 进度条**。顶部展示「今日/本周」分钟数、番茄数、目标完成度。 |
| 🚀 **预设软件** | 在设置中添加 `.exe` 路径，主界面以网格形式展示，单击即启动；启动失败有 Toast 提示。 |
| 🎵 **本地音乐** | 基于 Howler.js 加载本地 `.mp3/.wav/.ogg/.flac`；支持播放列表、上一首/下一首、音量、循环模式。 |
| ⚡ **一键工作模式** | 按顺序**并行**启动预设中的软件、打开配置的网址、自动开始番茄钟；同时支持「工作模式默认音频」自动播放。 |
| 📝 **每日留言** | **内嵌式面板**（底部左侧），按日期记录心情/收获；**支持 Markdown / JSON / TXT 多种格式批量导出**（范围可选 全部/本周/本月/最近 7 天/最近 30 天）。 |
| 🕐 **时钟** | 底部右侧，实时显示 HH:MM:SS + 日期 + 星期。 |
| 🌑 **暗色主题** | 紫黑主色 `#7C4DFF`；支持 `F11` 全屏切换。 |
| 💾 **数据持久化** | 所有数据通过 `electron-store` 保存到本地，崩溃后重启自动恢复。 |
| 🛡 **可靠性** | React 错误边界 + 启动容错 + 批量启动失败汇总。 |

---

## 项目结构

```
FocusFlow/
├── main.ts                 # Electron 主进程（IPC 处理）
├── preload.ts              # 预加载脚本（contextBridge 暴露 window.electronAPI）
├── shared/
│   └── types.ts            # 主进程与渲染进程共享的 TS 类型
├── renderer/
│   ├── index.html          # HTML 入口
│   ├── main.tsx            # React 入口
│   ├── App.tsx             # 根组件
│   ├── components/
│   │   ├── PomodoroTimer.tsx
│   │   ├── TodoList.tsx
│   │   ├── PresetAppsGrid.tsx
│   │   ├── StatsChart.tsx
│   │   ├── AudioPlayer.tsx
│   │   ├── SettingsModal.tsx
│   │   ├── WorkModeButton.tsx
│   │   ├── NotesPanel.tsx          # 内嵌式每日留言
│   │   ├── Clock.tsx               # 实时时钟
│   │   ├── FocusCompleteDialog.tsx # 专注完成弹窗
│   │   └── ErrorBoundary.tsx
│   ├── store/              # Zustand 状态
│   │   ├── settingsStore.ts
│   │   ├── todoStore.ts
│   │   ├── pomodoroStore.ts
│   │   ├── audioStore.ts
│   │   ├── noteStore.ts
│   │   ├── uiStore.ts
│   │   └── persist.ts
│   ├── utils/              # 工具函数
│   │   ├── timer.ts        # 时间格式化 / 阶段切换
│   │   ├── date.ts         # 自然日聚合
│   │   ├── chart.ts        # ECharts 配置
│   │   ├── id.ts           # ID 生成
│   │   ├── launchWorkMode.ts
│   │   └── markdownExport.ts # 多种格式导出
│   ├── ipc/
│   │   └── index.ts        # window.electronAPI 二次封装
│   └── styles/
│       └── global.css
├── docs/
│   └── screenshots/        # README 引用的截图与 GIF
├── assets/                 # 图标等静态资源
├── package.json
├── tsconfig.json           # 渲染进程 TS 配置
├── tsconfig.electron.json  # 主进程 TS 配置
├── vite.config.ts
├── electron-builder.json
└── README.md
```

---

## 快速开始

### 1. 环境要求

- **Node.js** 18 或 20（推荐 20 LTS）
- **npm** 9+（或 pnpm / yarn）
- **Windows 10/11**

### 2. 安装依赖

```bash
cd FocusFlow
npm install
```

### 3. 启动开发模式（热重载）

```bash
npm run dev
```

该命令会：
1. 启动 Vite 开发服务器（端口 5173）
2. 编译主进程 TS（输出到 `dist/main/`）
3. 启动 Electron，加载 `http://localhost:5173`

> 如果 Electron 启动后窗口空白，请检查 Vite 是否成功启动。控制台应显示 `Local: http://localhost:5173/`。

### 4. 仅启动渲染进程（不打开 Electron）

```bash
npm run dev:vite
```

可在浏览器中预览 UI（部分 IPC 功能不可用）。

---

## 构建与打包

### 构建（不打包）

```bash
npm run build
```

输出：
- `dist/renderer/`：渲染进程静态文件
- `dist/main/`：主进程 JS（main.js、preload.js、shared/）

### 打包成安装包（NSIS）

```bash
npm run package
```

输出：
- `release/FocusFlow Setup-1.0.0.exe`（默认文件名，详见 `electron-builder.json`）

> 首次打包可能需要从 GitHub 下载 Electron 二进制，需要稳定网络。**Windows 上如遇 `winCodeSign` 符号链接权限错误**，可在「Windows 设置 → 更新与安全 → 开发者选项」中开启「开发人员模式」。

### 自定义图标

把 256×256 的 `icon.ico` 放到 `assets/` 下，再执行 `npm run package`。

---

## 使用说明

### 首次启动

应用打开后是空状态。依次在「设置」中：

1. **通用** — 设置番茄/休息时长、默认音量、是否开机自启。
2. **预设软件** — 添加若干 `.exe` 路径，主界面会出现对应的图标。
3. **工作模式** — 在「软件启动项」中从预设软件选择或添加临时启动项；在「网址启动项」中输入 `https://...`；可选设置「工作模式默认音频」。

### 日常使用

- **主界面**
  - 上：工具栏（标题、全屏、设置）
  - 中：左：番茄钟 + 音乐控制 | 中：Todo List | 右：预设软件 + 专注统计
  - 下：左：每日留言（可直接编辑）| 右：实时时钟
  - 底：状态栏（阶段 / 剩余时间 / 启动消息）
- **快捷键**
  - `F11`：切换全屏（主进程已绑定；按 `Esc` 退出全屏）
  - `Enter`：保存 Todo / 设置项

### 每日留言使用

1. 底部左侧默认显示今天的留言面板
2. 在 textarea 中直接输入 → 500ms 后自动保存
3. 点击日期侧边栏可切换查看/编辑历史日期
4. **批量导出**：点「📤 导出 ▾」→ 选择范围（全部/本周/本月/最近 7 天/最近 30 天）和格式（Markdown/JSON/纯文本）→ 点「立即导出」

### 专注完成流程

1. 25 分钟专注倒计时结束
2. 自动开始 5 分钟短休息（4 次后变 15 分钟长休息）
3. 弹出「🎉 专注完成！」庆祝弹窗
4. 选择：
   - **☕ 开始休息**：立即开始（默认行为，因为已经自动开始了）
   - **⏭ 跳过休息**：跳过本次休息
   - **专注下一轮**：跳到下一轮专注
5. 30 秒未操作自动关闭（跳到专注模式）

---

## 一键工作模式详解

> 点击主界面橙色的「⚡ 工作模式」按钮后：

1. **批量启动软件**（并行）
   - 遍历 `WorkModeConfig.appItems`：
     - `type === 'preset'`：查找关联的 `PresetApp`，找不到则提示「已忽略失效项」。
     - `type === 'custom'`：直接使用配置的路径。
   - 对每条记录调用 `child_process.spawn`（绝对路径先做存在性校验）。
   - 失败的项累积到 Toast 汇总。

2. **批量打开网址**（并行）
   - 调用 `shell.openExternal` 在系统默认浏览器中打开每个 URL。
   - 失败项（`http://` 缺失等）累积到 Toast。

3. **自动开始番茄钟**
   - 如果未运行：若剩余时间为 0 则先 `reset()` 再 `start()`，否则直接 `start()`。
   - 如果已经在运行：**不重复开始**，保持现状。

4. **可选：默认音频**
   - 若配置了「工作模式默认音频」，先停止当前音频并播放新音频。
   - 若未配置，则**不修改**当前音频状态。

5. **反馈**
   - 状态栏显示「正在启动工作模式...」与「工作模式已就绪 · 启动 X 个应用，Y 个网址」。
   - Toast 通知单条启动 / 失败汇总。
   - 启动期间显示顶部加载条 + 出现「中止启动」按钮。

---

## 数据存储位置

使用 `electron-store`，数据文件位于：

```
%APPDATA%/focusflow/focusflow-data.json
```

> Windows 上 `%APPDATA%` 通常是 `C:\Users\<你的用户名>\AppData\Roaming`。

存储的键：
- `settings` — 用户设置（番茄时长、预设软件、工作模式等）
- `todos` — Todo 列表
- `pomodoroState` — 当前番茄状态（崩溃恢复用）
- `pomodoroHistory` — 历史专注记录
- `audioPlaylist` / `audioCurrentIndex` — 播放列表与当前曲目
- `dailyNotes` — 每日留言（按日期索引）

清除应用数据：删除上面的 `focusflow-data.json` 即可恢复出厂状态。

---

## IPC 通信契约

| Channel | 方向 | 说明 |
| ------- | ---- | ---- |
| `launch-app` | renderer → main | 启动单个软件 |
| `launch-apps-batch` | renderer → main | 批量启动软件（工作模式） |
| `open-url` | renderer → main | 在默认浏览器中打开 URL |
| `open-urls-batch` | renderer → main | 批量打开 URL |
| `select-audio-file` | renderer → main | 打开音频选择对话框 |
| `select-exe-file` | renderer → main | 打开 exe 选择对话框 |
| `save-text-file` | renderer → main | 保存文本文件（导出 MD/JSON/TXT） |
| `toggle-fullscreen` | renderer → main | 切换全屏 |
| `get-app-version` | renderer → main | 返回 app.getVersion() |
| `set-auto-startup` | renderer → main | 开机自启开关 |
| `show-notification` | renderer → main | 发送系统通知 |
| `store-get/set/delete` | renderer → main | electron-store 封装 |

> 详细见 [shared/types.ts](shared/types.ts) 与 [main.ts](main.ts)。

---

## 常见问题

### Q1. 安装包能安装到非系统盘吗？
A：可以。`electron-builder.json` 中 `oneClick: false` 且 `allowToChangeInstallationDirectory: true`，安装时可选路径。

### Q2. 为什么预设软件启动失败？
A：检查路径是否为绝对路径且程序存在；或尝试以管理员权限启动 FocusFlow（部分受保护目录需要）。

### Q3. 工作模式启动失败能否中断？
A：可以。启动期间会出现「中止启动」按钮，点击会取消后续动作（注：已启动的子进程不会被强制关闭，因为它们是 `detached: true`）。

### Q4. 全屏后底部有空白？
A：已在 v1.1 修复。如果旧版本仍有问题，请在 GitHub 提 Issue。

### Q5. 如何重置所有数据？
A：删除 `%APPDATA%/focusflow/focusflow-data.json` 后重启应用。

### Q6. 能改成本地白噪声吗？
A：当前版本仅支持本地音频文件；可在「工作模式默认音频」中选择你自己的白噪声文件。

### Q7. 能换皮肤吗？
A：CSS 变量集中在 [renderer/styles/global.css](renderer/styles/global.css) 顶部 `(:root)`，直接修改 `bg-primary / bg-card / color-primary` 等即可。

---

## 开发提示

- 状态管理使用 **Zustand**，每个 store 都通过 `persist.ts` 封装了防抖写入 `electron-store`。
- 主进程通过 `preload.ts` 暴露最小 API，**渲染进程无 Node 权限**（`contextIsolation: true`，`nodeIntegration: false`）。
- 启动子进程使用 `detached: true` + `unref()`，子进程与主进程解耦。
- React 组件均包裹了 `ErrorBoundary`，单组件崩溃不会影响整体。
- 布局使用 `flex: 1 1 0` + `vh` 单位 + `clamp()` 自适应不同屏幕分辨率。

---

## License

MIT
