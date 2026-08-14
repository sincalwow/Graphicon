# Graphicon

> 面向浏览器的专业矢量图形编辑器，提供路径与贝塞尔节点编辑、图层管理、精准布局、多格式导出，以及可选的安全 AI SVG 生成能力。

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Fabric.js](https://img.shields.io/badge/Powered%20by-Fabric.js-red)](https://fabricjs.com/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-339933)](https://nodejs.org/)

Graphicon 使用 **Fabric.js 5.3.1** 作为画布引擎。默认编辑器仍然可以直接打开 `index.html` 使用；当需要 AI SVG 生成功能时，请通过内置的轻量本地服务启动，以便把 API 密钥保留在服务器环境中，而不是暴露给浏览器。

## 功能概览

| 范畴 | 功能 |
| --- | --- |
| 专业工作区 | 深色专业主题、标尺式工作区、紧凑浮动工具栏、属性检查器、图层面板、缩放与平移导航。 |
| 矢量编辑 | 添加文字、内置 SVG 图标、图片与 SVG 导入；移动、缩放、旋转、复制、删除、组合、解组。 |
| 路径与贝塞尔 | 钢笔工具创建开放或闭合路径；节点编辑模式可拖动锚点、切换直线/贝塞尔曲线、调节控制柄和删除节点。 |
| 图层与布局 | 图层工作台可选择、重命名、显示/隐藏、锁定/解锁、上移/下移；支持对齐、等距分布和统一尺寸。 |
| 样式与画布 | 支持文字样式、对象透明度、矢量填充/描边换色、位图近似色替换、网格、比例锁定和 64–4096 px 画布。 |
| 导出中心 | 支持按对象边界导出透明 PNG、白底 JPG、透明 WebP、可编辑 SVG 与 `.graphicon` 项目文件；可选择 1×–4× 位图倍率。 |
| AI SVG 助手 | 通过同源服务器安全调用任何 OpenAI Chat Completions 兼容服务，把生成结果作为可继续编辑的 SVG 加入画布。 |

## 快速开始

### 仅使用本地编辑功能

直接以现代浏览器打开 `index.html`。该方式支持画布、路径、图层、编辑、项目保存和所有本地导出功能。

```bash
git clone https://github.com/sincalwow/Graphicon.git
cd Graphicon
# 在浏览器中打开 index.html
```

本地图片和 SVG 可以通过“上传素材”导入，也可以拖入工作区。Fabric.js、Font Awesome 和字体来自公共 CDN；首次使用需要联网。若需要完全离线运行，请将这些资源替换为本地副本。

### 启用 AI SVG 助手

AI 功能采用独立的同源服务代理，**API 密钥只保存在服务器环境变量中，不会写入 HTML、项目文件或浏览器请求头**。服务使用 Node.js 内置模块，无需安装第三方依赖。

```bash
cd Graphicon
cp .env.example .env
# 在 .env 中填入你自己的 AI_API_KEY；请勿提交 .env
set -a && source .env && set +a
npm start
```

然后访问 `http://localhost:4173`。服务默认调用 OpenAI Chat Completions 兼容接口；可通过下列环境变量切换到任意兼容提供商：

| 变量 | 用途 | 示例 |
| --- | --- | --- |
| `AI_API_KEY` | 提供商密钥，必填 | `your_provider_key` |
| `AI_API_BASE` | Chat Completions 兼容服务基础地址 | `https://api.openai.com/v1` |
| `AI_MODEL` | 用于 SVG 生成的模型名称 | `gpt-4.1-mini` |
| `PORT` | 本地服务端口 | `4173` |

> 请不要把真实密钥填入 `index.html`、Git 仓库或前端部署平台的公开变量。生产环境应由托管服务的私有环境变量注入 `AI_API_KEY`。

## 矢量路径工作流

点击顶部的**钢笔路径**，在画布中单击添加锚点；按住 `Shift` 单击可创建初始曲线节点。双击画布或再次点击首个锚点可完成路径，也可以在右侧路径面板选择“闭合路径”。

选中由钢笔创建的路径后，点击**节点与贝塞尔编辑**。白色锚点用于改变轮廓；双击锚点或使用“切换曲线”可添加/移除蓝色控制柄；拖动蓝色控制柄可改变贝塞尔曲线方向。完成编辑后点击“完成编辑”，路径会恢复为普通可选对象。

## 项目与导出工作流

`.graphicon` 是 Graphicon 的 JSON 项目格式，包含画布尺寸、网格状态、图层元数据与可编辑对象数据。它不是发布格式；请使用导出中心生成 PNG、JPG、WebP 或 SVG。

导出中心会忽略网格、辅助线和编辑控制柄，并按实际对象边界加留白裁切。PNG 和 WebP 保持透明背景；JPG 使用白色背景；SVG 保持图形对象的矢量结构。

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
| `P` | 开启或关闭钢笔路径工具 |
| `N` | 开启或关闭节点与贝塞尔编辑 |
| `Esc` | 取消当前钢笔路径或退出节点编辑 |
| `+` / `-` | 放大或缩小画布视图 |
| `1` / `2` | 重置视图 / 聚焦当前选区 |
| 按住 `Space` 或 `Alt` 并拖拽 | 平移画布视图 |

## 技术构成

| 组件 | 用途 |
| --- | --- |
| HTML5 / CSS3 / Vanilla JavaScript | 编辑器界面、路径交互、图层、布局和导出逻辑。 |
| [Fabric.js 5.3.1](https://fabricjs.com/) | 画布对象、SVG、图片、选择、路径与序列化。 |
| Node.js 内置 `http` / `fetch` | 提供静态入口并安全代理外部 AI SVG 生成请求。 |
| [Font Awesome 6.4.0](https://fontawesome.com/) | 工具栏与操作图标。 |
| [Inter](https://fonts.google.com/specimen/Inter) | 界面字体。 |

## 贡献

欢迎通过 Issue 提出可复现的问题、交互建议或素材库扩展方案。提交改动时，请保持直接打开 `index.html` 的基础编辑能力，并在不同画布尺寸下验证路径编辑、导入、图层、撤销/重做、项目恢复以及 PNG/SVG 导出流程。涉及 AI 服务时，严禁提交真实 API 密钥。

## 许可证

本项目采用 [MIT License](LICENSE) 开源。
