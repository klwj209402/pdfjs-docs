# 安装配置

本章将详细介绍如何在不同环境中安装和配置 PDF.js。

## 安装方式

### 通过 CDN

最简单的方式是通过 CDN 引入 PDF.js，适合快速原型开发和简单项目：

```html
<!DOCTYPE html>
<html>
<head>
    <title>PDF.js 示例</title>
</head>
<body>
    <canvas id="pdf-canvas"></canvas>
    
    <!-- 引入 PDF.js -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
    <script>
        // 配置 Worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    </script>
</body>
</html>
```

**优点：**
- 无需构建工具
- 快速上手
- CDN 缓存优化

**缺点：**
- 依赖网络连接
- 版本控制不够灵活
- 无法进行代码分割

### 通过 npm

推荐在现代前端项目中使用 npm 安装，支持模块化和构建优化：

```bash
npm install pdfjs-dist
```

然后在您的代码中引入：

```javascript
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';

// 配置 Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
```

**优点：**
- 版本控制精确
- 支持代码分割
- 离线开发
- 与构建工具集成

**缺点：**
- 需要构建工具
- 配置相对复杂

### 通过 yarn

如果您的项目使用 yarn 作为包管理器：

```bash
yarn add pdfjs-dist
```

使用方式与 npm 相同。

### 下载源码

您也可以从 [GitHub](https://github.com/mozilla/pdf.js) 下载源码并构建：

```bash
git clone https://github.com/mozilla/pdf.js.git
cd pdf.js
npm install
npm run build
```

构建完成后，在 `build/` 目录下会生成以下文件：
- `pdf.js` - 主库文件
- `pdf.worker.js` - Worker 文件
- `pdf.min.js` - 压缩版主库
- `pdf.worker.min.js` - 压缩版 Worker

## 环境配置

### Web Worker 配置

PDF.js 需要配置 Web Worker 来处理 PDF 解析任务：

#### CDN 方式

```javascript
// 使用 CDN 版本
pdfjsLib.GlobalWorkerOptions.workerSrc = 
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
```

#### npm 方式

```javascript
// 方式一：使用 worker entry
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// 方式二：使用相对路径
pdfjsLib.GlobalWorkerOptions.workerSrc = '/node_modules/pdfjs-dist/build/pdf.worker.js';

// 方式三：使用 URL（适用于 Webpack 5+）
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.js',
    import.meta.url
).toString();
```

### 字体映射配置

对于包含 CJK（中日韩）字符的 PDF，需要配置字体映射：

```javascript
const loadingTask = pdfjsLib.getDocument({
    url: 'document.pdf',
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
    cMapPacked: true
});
```

**本地部署字体映射文件：**

```bash
# 复制字体映射文件到项目
cp -r node_modules/pdfjs-dist/cmaps/ public/cmaps/
```

```javascript
// 使用本地字体映射
const loadingTask = pdfjsLib.getDocument({
    url: 'document.pdf',
    cMapUrl: '/cmaps/',
    cMapPacked: true
});
```

### 标准字体配置

对于使用标准字体的 PDF，可以配置标准字体路径：

```javascript
const loadingTask = pdfjsLib.getDocument({
    url: 'document.pdf',
    standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/'
});
```

## 构建工具集成

### Webpack 配置

在 Webpack 项目中使用 PDF.js：

```javascript
// webpack.config.js
module.exports = {
    // ... 其他配置
    resolve: {
        alias: {
            'pdfjs-dist/build/pdf.worker.entry': 'pdfjs-dist/build/pdf.worker.js'
        }
    },
    module: {
        rules: [
            {
                test: /\.worker\.js$/,
                use: { loader: 'worker-loader' }
            }
        ]
    }
};
```

### Vite 配置

在 Vite 项目中使用 PDF.js：

```javascript
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
    optimizeDeps: {
        include: ['pdfjs-dist']
    },
    worker: {
        format: 'es'
    }
});
```

### Rollup 配置

在 Rollup 项目中使用 PDF.js：

```javascript
// rollup.config.js
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
    // ... 其他配置
    plugins: [
        nodeResolve(),
        commonjs()
    ],
    external: ['pdfjs-dist/build/pdf.worker.entry']
};
```

## 框架集成

### React 项目

在 Create React App 中使用：

```bash
npm install pdfjs-dist
```

```javascript
// 在 public/index.html 中添加
<script>
    if (typeof window !== 'undefined') {
        window.pdfjsWorkerSrc = '%PUBLIC_URL%/pdf.worker.js';
    }
</script>
```

```javascript
// 在组件中使用
import * as pdfjsLib from 'pdfjs-dist';

// 配置 Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = window.pdfjsWorkerSrc || 
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
```

### Vue 项目

在 Vue CLI 项目中使用：

```bash
npm install pdfjs-dist
```

```javascript
// 在 vue.config.js 中配置
module.exports = {
    configureWebpack: {
        resolve: {
            alias: {
                'pdfjs-dist/build/pdf.worker.entry': 'pdfjs-dist/build/pdf.worker.js'
            }
        }
    }
};
```

### Angular 项目

在 Angular 项目中使用：

```bash
npm install pdfjs-dist
npm install @types/pdfjs-dist
```

```javascript
// 在 angular.json 中添加
"assets": [
    {
        "glob": "**/*",
        "input": "node_modules/pdfjs-dist/build",
        "output": "/assets/pdfjs/"
    }
]
```

```typescript
// 在组件中使用
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/assets/pdfjs/pdf.worker.js';
```

## 环境变量配置

### 开发环境

```javascript
// 开发环境配置
if (process.env.NODE_ENV === 'development') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/node_modules/pdfjs-dist/build/pdf.worker.js';
} else {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}
```

### 生产环境

```javascript
// 生产环境优化
const PDFJS_CONFIG = {
    workerSrc: 'https://cdn.example.com/pdf.worker.min.js',
    cMapUrl: 'https://cdn.example.com/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: 'https://cdn.example.com/standard_fonts/',
    // 禁用字体回退
    disableFontFace: false,
    // 启用流式加载
    disableStream: false,
    // 启用范围请求
    disableRange: false
};

pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_CONFIG.workerSrc;
```

## 常见问题

### Worker 路径错误

**问题：** `Setting up fake worker failed`

**解决方案：**
```javascript
// 确保 Worker 路径正确
pdfjsLib.GlobalWorkerOptions.workerSrc = 'correct/path/to/pdf.worker.js';
```

### 跨域问题

**问题：** `CORS policy` 错误

**解决方案：**
1. 确保 PDF 文件和 Worker 文件都配置了正确的 CORS 头
2. 使用代理服务器
3. 将文件部署到同一域名下

### 字体显示问题

**问题：** 中文字符显示为方块

**解决方案：**
```javascript
// 配置字体映射
const loadingTask = pdfjsLib.getDocument({
    url: 'document.pdf',
    cMapUrl: '/cmaps/',
    cMapPacked: true
});
```

### 内存泄漏

**问题：** 长时间使用后内存占用过高

**解决方案：**
```javascript
// 及时清理资源
if (pdfDocument) {
    await pdfDocument.destroy();
}
```

## 下一步

现在您已经完成了 PDF.js 的安装和配置，可以继续学习：

- [基本概念](/guide/concepts) - 了解 PDF.js 的核心概念
- [快速开始](/guide/getting-started) - 开始您的第一个 PDF.js 项目
- [Vue 集成](/guide/vue-integration) - 在 Vue 项目中使用 PDF.js
- [React 集成](/guide/react-integration) - 在 React 项目中使用 PDF.js