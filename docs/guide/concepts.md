# 基本概念

本章将介绍 PDF.js 的核心概念和架构，帮助您更好地理解和使用这个强大的 PDF 处理库。

## PDF.js 是什么

PDF.js 是由 Mozilla 开发的一个开源 JavaScript 库，用于在 Web 浏览器中渲染 PDF 文档。它完全使用 JavaScript 和 HTML5 技术实现，无需任何插件或原生代码支持。

### 主要特点

- **纯 JavaScript 实现**：无需浏览器插件，兼容性好
- **跨平台支持**：可在所有现代浏览器中运行
- **功能完整**：支持文本提取、注释、表单填写等
- **性能优化**：使用 Web Worker 避免阻塞主线程
- **开源免费**：基于 Apache 2.0 许可证

## 核心组件介绍

### PDFDocumentProxy

`PDFDocumentProxy` 是 PDF 文档的代理对象，代表一个已加载的 PDF 文档。

```javascript
// 获取文档代理对象
const loadingTask = pdfjsLib.getDocument('document.pdf');
const pdfDocument = await loadingTask.promise;

console.log('总页数:', pdfDocument.numPages);
console.log('PDF 信息:', pdfDocument.getMetadata());
```

**主要属性和方法：**
- `numPages`: 文档总页数
- `getPage(pageNumber)`: 获取指定页面
- `getMetadata()`: 获取文档元数据
- `getDestinations()`: 获取文档目标链接
- `destroy()`: 销毁文档对象，释放内存

### PDFPageProxy

`PDFPageProxy` 是 PDF 页面的代理对象，代表文档中的一个页面。

```javascript
// 获取页面代理对象
const page = await pdfDocument.getPage(1);

console.log('页面尺寸:', page.getViewport({ scale: 1.0 }));
```

**主要属性和方法：**
- `pageNumber`: 页面编号
- `getViewport(params)`: 获取页面视口信息
- `render(renderContext)`: 渲染页面到 Canvas
- `getTextContent()`: 获取页面文本内容
- `getAnnotations()`: 获取页面注释

### Canvas 渲染

PDF.js 使用 HTML5 Canvas 来渲染 PDF 页面。渲染过程需要提供渲染上下文：

```javascript
const canvas = document.getElementById('pdf-canvas');
const context = canvas.getContext('2d');
const viewport = page.getViewport({ scale: 1.5 });

// 设置 Canvas 尺寸
canvas.height = viewport.height;
canvas.width = viewport.width;

// 渲染页面
const renderContext = {
    canvasContext: context,
    viewport: viewport
};

await page.render(renderContext).promise;
```

## Worker 机制说明

PDF.js 使用 Web Worker 来处理 PDF 解析和渲染计算，避免阻塞浏览器主线程。

### 为什么需要 Worker

1. **避免界面冻结**：PDF 解析是计算密集型任务
2. **提升用户体验**：主线程可以继续响应用户交互
3. **并行处理**：可以同时处理多个 PDF 文档

### Worker 配置

```javascript
// 通过 CDN 配置
pdfjsLib.GlobalWorkerOptions.workerSrc = 
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// 通过 npm 配置
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
```

### Worker 生命周期

- **创建**：首次加载 PDF 时自动创建
- **复用**：多个文档可以共享同一个 Worker
- **销毁**：页面卸载时自动清理

## 渲染流程概述

PDF.js 的渲染流程包含以下几个主要步骤：

### 1. 文档加载

```javascript
// 创建加载任务
const loadingTask = pdfjsLib.getDocument({
    url: 'document.pdf',
    // 可选配置
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
    cMapPacked: true
});

// 监听加载进度
loadingTask.onProgress = (progress) => {
    console.log(`加载进度: ${(progress.loaded / progress.total * 100).toFixed(1)}%`);
};

// 获取文档对象
const pdfDocument = await loadingTask.promise;
```

### 2. 页面获取

```javascript
// 获取指定页面
const pageNumber = 1;
const page = await pdfDocument.getPage(pageNumber);
```

### 3. 视口计算

```javascript
// 计算页面视口
const scale = 1.5; // 缩放比例
const rotation = 0; // 旋转角度
const viewport = page.getViewport({ scale, rotation });
```

### 4. Canvas 准备

```javascript
// 准备 Canvas 元素
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');

// 设置 Canvas 尺寸
canvas.height = viewport.height;
canvas.width = viewport.width;
```

### 5. 页面渲染

```javascript
// 执行渲染
const renderTask = page.render({
    canvasContext: context,
    viewport: viewport
});

// 等待渲染完成
await renderTask.promise;
console.log('页面渲染完成');
```

## 主要 API 概览

### 全局 API

- `pdfjsLib.getDocument()`: 加载 PDF 文档
- `pdfjsLib.GlobalWorkerOptions`: Worker 全局配置
- `pdfjsLib.version`: 获取 PDF.js 版本

### 文档级 API

- `pdfDocument.numPages`: 获取总页数
- `pdfDocument.getPage()`: 获取指定页面
- `pdfDocument.getMetadata()`: 获取文档元数据
- `pdfDocument.getOutline()`: 获取文档大纲
- `pdfDocument.destroy()`: 销毁文档对象

### 页面级 API

- `page.getViewport()`: 获取页面视口
- `page.render()`: 渲染页面
- `page.getTextContent()`: 获取文本内容
- `page.getAnnotations()`: 获取注释信息
- `page.getOperatorList()`: 获取操作列表

### 工具类 API

- `pdfjsLib.Util`: 实用工具函数
- `pdfjsLib.PDFWorker`: Worker 管理
- `pdfjsLib.PDFDataRangeTransport`: 数据传输

## 内存管理

### 资源清理

```javascript
// 清理页面资源
if (page) {
    page.cleanup();
}

// 清理文档资源
if (pdfDocument) {
    await pdfDocument.destroy();
}

// 清理渲染任务
if (renderTask) {
    renderTask.cancel();
}
```

### 最佳实践

1. **及时清理**：使用完毕后立即调用 `destroy()` 方法
2. **避免内存泄漏**：不要保持对已销毁对象的引用
3. **合理缓存**：对于频繁访问的页面可以适当缓存
4. **监控内存**：在开发过程中监控内存使用情况

## 错误处理机制

PDF.js 提供了完善的错误处理机制：

```javascript
try {
    const pdfDocument = await pdfjsLib.getDocument('document.pdf').promise;
    const page = await pdfDocument.getPage(1);
    // 处理成功逻辑
} catch (error) {
    if (error instanceof pdfjsLib.InvalidPDFException) {
        console.error('无效的 PDF 文件');
    } else if (error instanceof pdfjsLib.MissingPDFException) {
        console.error('PDF 文件不存在');
    } else if (error instanceof pdfjsLib.UnexpectedResponseException) {
        console.error('网络请求失败');
    } else {
        console.error('未知错误:', error);
    }
}
```

## 下一步

现在您已经了解了 PDF.js 的基本概念，可以继续学习：

- [安装配置](/guide/installation) - 详细的安装和配置指南
- [快速开始](/guide/getting-started) - 开始您的第一个 PDF.js 项目
- [API 文档](/api/) - 查看完整的 API 参考
- [示例](/examples/) - 查看更多实用示例