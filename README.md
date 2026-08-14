# Graphicon

> 面向浏览器的专业矢量图形编辑器，提供路径与贝塞尔节点编辑、图层管理、精准布局、多格式导出、插件扩展、实时协作，以及可选的安全 AI SVG 生成能力。

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Fabric.js](https://img.shields.io/badge/Powered%20by-Fabric.js-red)](https://fabricjs.com/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-339933)](https://nodejs.org/)

Graphicon 使用 **Fabric.js 5.3.1** 作为画布引擎。直接打开 `index.html` 可使用基础编辑、路径、图层和本地导出；需要 AI SVG 或实时协作时，应通过内置 Node.js 服务启动。该服务将 API 密钥保留在服务器环境中，并提供同实例内存协作房间。

## 功能概览

| 范畴 | 功能 |
| --- | --- |
| 专业工作区 | 深色专业主题、标尺式工作区、紧凑浮动工具栏、属性检查器、图层面板、缩放与平移导航。 |
| 矢量编辑 | 添加文字、内置 SVG 图标、图片与 SVG 导入；移动、缩放、旋转、复制、删除、组合、解组。 |
| 路径与贝塞尔 | 钢笔工具创建开放或闭合路径；节点编辑模式可拖动锚点、切换直线/贝塞尔曲线、调节控制柄和删除节点；Paper.js 提供简化、平滑及布尔路径运算。 |
| 图层与布局 | 图层工作台可选择、重命名、显示/隐藏、锁定/解锁、上移/下移；支持对齐、等距分布和统一尺寸。 |
| 样式与画布 | 支持文字样式、对象透明度、矢量填充/描边换色、网格、比例锁定以及 64–4096 px 画布尺寸。 |
| 导出中心 | 支持按对象边界导出透明 PNG、白底 JPG、透明 WebP、可编辑 SVG 与 `.graphicon` 项目文件；可选择 1×–4× 位图倍率。 |
| 插件系统 | 提供受控 `Graphicon.registerPlugin()` API，可注册自定义图形工具和选区滤镜；内含星形、黑白滤镜和独立徽章示例插件。 |
| 实时协作 | 支持基于房间的多用户在线成员状态、最后写入快照同步和断开清理。 |
| AI SVG 助手 | 通过同源服务器安全调用 OpenAI Chat Completions 兼容服务，把生成结果作为可编辑 SVG 加入画布。 |

## 快速开始

### 仅使用本地编辑功能

直接以现代浏览器打开 `index.html`。该方式支持画布、路径、图层、插件、项目保存和本地导出，但不支持实时协作或 AI 请求。

```bash
git clone https://github.com/sincalwow/Graphicon.git
cd Graphicon
# 在浏览器中打开 index.html
```

本地图片和 SVG 可以通过“上传素材”导入，也可以拖入工作区。Fabric.js、Font Awesome 和字体来自公共 CDN；首次使用需要联网。若需要完全离线运行，请将这些资源替换为本地副本。

### 启用 AI SVG 与实时协作

AI 与协作通过同一个本地服务提供。安装依赖后启动服务，并访问 `http://localhost:4173`：

```bash
cd Graphicon
pnpm install
cp .env.example .env
# 可选：在 .env 中填写 AI_API_KEY；实时协作无需 AI 密钥
set -a && source .env && set +a
pnpm start
```

| 变量 | 用途 | 示例 |
| --- | --- | --- |
| `AI_API_KEY` | AI 提供商密钥；仅 AI SVG 必填 | `your_provider_key` |
| `AI_API_BASE` | Chat Completions 兼容服务基础地址 | `https://api.openai.com/v1` |
| `AI_MODEL` | 用于 SVG 生成的模型名称 | `gpt-4.1-mini` |
| `PORT` | 本地服务端口 | `4173` |

> **安全说明：** API 密钥只会从服务端环境变量读取，不会写入 HTML、项目文件或浏览器请求头。不要提交 `.env`，也不要加载来源不明的插件脚本。

## 插件开发

插件是一个可信 JavaScript 文件。页面加载时可通过 `window.Graphicon.registerPlugin()` 注册工具或滤镜。项目提供 [示例插件](plugins/example-badge-plugin.js)，并在 `index.html` 中展示了加载方式。

```js
window.Graphicon.registerPlugin({
  id: 'acme.my-tool',
  name: 'My Tool',
  version: '1.0.0',
  setup(api) {
    api.registerTool({
      id: 'add-shape',
      label: '自定义图形',
      icon: 'fa-star',
      run({ fabric, canvas }) {
        const object = new fabric.Circle({ radius: 40, fill: '#0d99ff' });
        api.addObject(object, '自定义图形');
      },
    });

    api.registerFilter({
      id: 'my-filter',
      label: '自定义滤镜',
      run({ object }) {
        if (!object) throw new Error('请先选择对象');
        object.set({ opacity: 0.75 });
      },
    });
  },
});
```

插件 API 公开 `fabric`、`registerTool`、`registerFilter`、`addObject`、`getActiveObject`、`getSelectedObjects`、`showToast`、`requestRender` 和 `saveHistory`。插件以页面脚本权限执行，**仅应安装并在 `index.html` 中引用已审查的可信脚本**；当前版本不会下载或执行用户粘贴的远程代码。

## 实时协作

在左侧“实时协作”面板输入相同房间号和显示名称，点击“加入”。后加入者会接收房间中的现有画布；后续对象新增、删除与修改会以防抖后的完整画布快照同步至其他成员。成员列表会反映当前在线用户。

> 当前协作协议采用**最后写入快照**策略：适合小团队共创和演示，不提供逐对象冲突合并、历史版本、权限控制或持久化。房间状态保存在单个服务进程的内存中，服务重启会清空；多实例部署会形成彼此隔离的房间。生产使用应部署为持续运行的单一服务实例，并在后续迭代中接入共享数据库、认证与冲突合并机制。

## 矢量路径与导出工作流

点击顶部的**钢笔路径**，在画布中单击添加锚点；按住 `Shift` 单击可创建初始曲线节点。双击画布或再次点击首个锚点可完成路径，也可以在右侧路径面板选择“闭合路径”。选中路径后，点击**节点与贝塞尔编辑**；白色锚点调整轮廓，蓝色控制柄调整曲线方向。

### 路径几何与布尔运算

Graphicon 保留 Fabric.js 处理画布对象、选择、交互、序列化与导出，并在独立的 Paper.js 作用域中完成几何计算。选择两个非位图矢量对象后，可以使用右侧“路径几何”面板执行**合并、相减、相交、排除**。完成计算后，结果会转换回 Fabric 对象；单一路径尽可能保留为带 `editablePathData` 的贝塞尔对象，以便继续进行节点编辑。

对单个路径可使用“简化路径”降低冗余节点，或使用“平滑曲线”生成连续的 Catmull–Rom 贝塞尔轮廓。节点拖动的画布刷新会批处理到动画帧，避免高频控制柄移动反复触发同步重绘。布尔计算为显式点击操作，并非拖动时实时运算；复杂自相交、含位图或超大节点路径应先简化，结果也应在导出前复核。

`.graphicon` 是 Graphicon 的 JSON 项目格式，包含画布尺寸、网格状态、图层元数据与可编辑对象数据。导出中心会忽略网格、辅助线和编辑控制柄，并按实际对象边界加留白裁切。PNG/WebP 保持透明背景；JPG 使用白色背景；SVG 保持图形对象的矢量结构。

## 自动化测试

项目提供 Playwright 浏览器端到端测试；测试会自行启动隔离服务并使用 Chromium 验证真实交互。

```bash
pnpm run check      # 静态入口与文档契约检查
pnpm run test:e2e   # 插件、路径/贝塞尔、PNG/JPG/WebP/SVG 导出与双客户端协作
pnpm test           # 运行全部质量检查
```

当前端到端覆盖包含插件加载和操作、三节点可编辑路径、贝塞尔曲线控制柄、Paper.js 的合并/相减/相交/排除、路径简化与平滑、PNG/JPG/WebP/SVG 下载内容，以及同房间双页面画布同步。

## 快捷键

| 快捷键 | 功能 |
| --- | --- |
| `Ctrl/Cmd + Z` | 撤销 |
| `Ctrl/Cmd + Y` 或 `Ctrl/Cmd + Shift + Z` | 重做 |
| `Delete` / `Backspace` | 删除选中对象 |
| `Ctrl/Cmd + C` 或 `Ctrl/Cmd + D` | 复制选中对象 |
| `Ctrl/Cmd + A` | 选择所有可见、未锁定的对象 |
| `Ctrl/Cmd + G` / `Ctrl/Cmd + Shift + G` | 组合 / 解组 |
| `Ctrl/Cmd + S` | 下载当前 `.graphicon` 项目文件 |
| `P` / `N` / `Esc` | 钢笔路径 / 节点编辑 / 取消或退出编辑 |
| `+` / `-` | 放大或缩小画布视图 |
| `1` / `2` | 重置视图 / 聚焦当前选区 |
| 按住 `Space` 或 `Alt` 并拖拽 | 平移画布视图 |

## 技术构成

| 组件 | 用途 |
| --- | --- |
| HTML5 / CSS3 / Vanilla JavaScript | 编辑器、插件宿主、路径交互、图层、布局、导出和协作客户端。 |
| [Fabric.js 5.3.1](https://fabricjs.com/) | 画布对象、SVG、图片、选择、交互控制与序列化。 |
| [Paper.js 0.12.18](https://paperjs.org/) | 隔离的路径几何计算、贝塞尔简化/平滑和合并、相减、相交、排除运算。 |
| Node.js / [`ws`](https://github.com/websockets/ws) | 静态入口、安全 AI 代理和房间 WebSocket 协作服务。 |
| [Playwright](https://playwright.dev/) | 使用 Chromium 进行端到端自动化测试。 |
| [Font Awesome 6.4.0](https://fontawesome.com/) | 工具栏与操作图标。 |

## 贡献

欢迎通过 Issue 提出可复现的问题、交互建议或素材库扩展方案。提交改动时，请运行 `pnpm test`。涉及 AI 服务时严禁提交真实 API 密钥；涉及插件时请审查脚本来源；涉及协作协议时应保持房间隔离、消息大小限制与远端画布加载保护。

## 许可证

本项目采用 [MIT License](LICENSE) 开源。
