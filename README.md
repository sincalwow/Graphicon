# Graphicon

> 一个无需构建步骤的浏览器端矢量图形编辑器。打开单一 HTML 文件即可绘制、组合、调整并导出设计稿。

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Fabric.js](https://img.shields.io/badge/Powered%20by-Fabric.js-red)](https://fabricjs.com/)

Graphicon 以 **Fabric.js 5.3.1** 为图形引擎，提供深色工作区、内置 SVG 素材库与本地文件导入能力。项目坚持单文件分发，适合快速制作图标、简单海报和 SVG 草图，也便于离线保存、二次定制或静态站点托管。

## 功能概览

| 范畴 | 功能 |
| --- | --- |
| 编辑 | 添加文字与内置 SVG 图标；导入图片和 SVG；移动、缩放、旋转、复制、删除、组合与解组。 |
| 对齐 | 支持画布边缘/中心对齐，以及对象中心和边缘的智能吸附与辅助线。 |
| 样式 | 支持文字加粗与斜体、对象透明度、矢量填充/描边换色，以及位图主色提取和近似色替换。 |
| 画布 | 可配置 64–4096 px 的画布宽高；提供网格参考、比例锁定和空白新建流程。 |
| 项目文件 | 可将画布及元素下载为 `.graphicon` 项目文件，随后重新打开继续编辑。 |
| 导出 | 按内容边界导出 2× 透明 PNG，或导出可编辑 SVG。 |

## 快速开始

项目不需要安装 Node.js、依赖或构建工具。克隆仓库后，直接在 Chrome、Edge、Firefox 等现代浏览器中打开 `index.html` 即可使用。

```bash
git clone https://github.com/sincalwow/Graphicon.git
cd Graphicon
# 在浏览器中打开 "index.html"
```

本地图片和 SVG 可通过“上传素材”按钮导入，也可以直接拖入工作区。由于第三方依赖由公共 CDN 提供，首次使用需要联网；如需完全离线运行，请将 Fabric.js、Font Awesome 和字体资源替换为本地副本。

> `.graphicon` 是 Graphicon 的 JSON 项目格式，包含画布尺寸、网格状态与完整的可编辑对象数据。它不是图片格式；如需用于发布，请导出 PNG 或 SVG。

## 工作流程

新建设计后，可以先在右侧设置画布尺寸，再从左侧素材库添加图标、添加文字或拖入图片。选中对象后，右侧属性面板可调整尺寸、透明度和颜色。画布中存在对象时，“保存”会下载项目文件；使用“打开”即可恢复该设计。

为避免误操作，“新建”会在当前画布含有内容时要求确认。导出的 PNG 与 SVG 只包含设计对象，不包含编辑辅助线和网格。

## 快捷键

| 快捷键 | 功能 |
| --- | --- |
| `Ctrl/Cmd + Z` | 撤销 |
| `Ctrl/Cmd + Y` 或 `Ctrl/Cmd + Shift + Z` | 重做 |
| `Delete` / `Backspace` | 删除选中对象 |
| `Ctrl/Cmd + C` 或 `Ctrl/Cmd + D` | 复制选中对象 |
| `Ctrl/Cmd + G` | 将多选对象组合 |
| `Ctrl/Cmd + Shift + G` | 解组 |
| `Ctrl/Cmd + S` | 下载当前 `.graphicon` 项目文件 |
| 拖动对象 | 触发智能吸附；可在右侧关闭吸附或辅助线 |

## 技术构成

| 组件 | 用途 |
| --- | --- |
| HTML5 / CSS3 / Vanilla JavaScript | 单文件用户界面和交互逻辑。 |
| [Fabric.js 5.3.1](https://fabricjs.com/) | 画布对象、SVG、图片、选择与序列化。 |
| [Font Awesome 6.4.0](https://fontawesome.com/) | 工具栏图标。 |
| [Inter](https://fonts.google.com/specimen/Inter) | 界面字体。 |

## 贡献

欢迎通过 Issue 提出可复现的问题、交互建议或素材库扩展方案。提交改动时，请保持单文件运行能力，避免引入未声明的构建依赖，并在不同画布尺寸下验证导入、编辑、撤销/重做、项目恢复和导出流程。

## 许可证

本项目采用 [MIT License](LICENSE) 开源。
