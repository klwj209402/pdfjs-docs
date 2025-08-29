# API 文档

PDF.js 提供了丰富的 JavaScript API，用于在 Web 应用程序中处理 PDF 文档。本文档详细介绍了所有可用的 API 接口。

## 核心 API

核心 API 提供了 PDF 文档加载、解析和基本操作的功能：

- **[getDocument](/api/get-document)** - 加载 PDF 文档的主要入口点
- **[PDFDocumentProxy](/api/pdf-document-proxy)** - PDF 文档代理对象，提供文档级别的操作
- **[PDFPageProxy](/api/pdf-page-proxy)** - PDF 页面代理对象，提供页面级别的操作
- **[GlobalWorkerOptions](/api/global-worker-options)** - 全局 Worker 配置选项

## 显示层组件

显示层组件负责将 PDF 内容渲染到页面上：

- **[AnnotationLayer](/api/annotation-layer)** - 注释层，用于显示 PDF 注释
- **[TextLayer](/api/text-layer)** - 文本层，用于文本选择和搜索
- **[XfaLayer](/api/xfa-layer)** - XFA 表单层，用于显示 XFA 表单
- **[DrawLayer](/api/draw-layer)** - 绘制层，用于自定义绘制操作

## 编辑器组件

编辑器组件提供了 PDF 注释和表单的编辑功能：

- **[AnnotationEditorLayer](/api/annotation-editor-layer)** - 注释编辑器层
- **[AnnotationEditorUIManager](/api/annotation-editor-ui-manager)** - 注释编辑器 UI 管理器
- **[ColorPicker](/api/color-picker)** - 颜色选择器组件

## 工具类

工具类提供了各种辅助功能：

- **[PDFWorker](/api/pdf-worker)** - PDF Worker 管理
- **[PDFDataRangeTransport](/api/pdf-data-range-transport)** - 数据传输工具
- **[Util](/api/util)** - 通用工具函数
- **[常量和枚举](/api/constants)** - 常用常量和枚举值

## 快速开始

如果您是第一次使用 PDF.js，建议从以下资源开始：

1. [快速开始指南](/guide/getting-started) - 了解如何安装和配置 PDF.js
2. [基本概念](/guide/concepts) - 理解 PDF.js 的核心概念
3. [简单PDF渲染示例](/examples/basic-rendering) - 查看基础使用示例

## API 版本

本文档基于 PDF.js 最新版本编写。不同版本之间可能存在 API 差异，请根据您使用的版本查阅相应文档。