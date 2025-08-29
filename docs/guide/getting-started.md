# 快速开始

本指南将帮助您快速上手 PDF.js，从安装到渲染第一个 PDF 文档。

## 安装

### 通过 CDN

最简单的方式是通过 CDN 引入 PDF.js：

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

### 通过 npm

如果您使用构建工具，可以通过 npm 安装：

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

### 下载源码

您也可以从 [GitHub](https://github.com/mozilla/pdf.js) 下载源码并构建：

```bash
git clone https://github.com/mozilla/pdf.js.git
cd pdf.js
npm install
npm run build
```

## 基本使用

### 渲染 PDF 页面

以下是一个完整的示例，展示如何加载并渲染 PDF 的第一页：

```html
<!DOCTYPE html>
<html>
<head>
    <title>PDF.js 基本示例</title>
    <style>
        #pdf-canvas {
            border: 1px solid #ccc;
            display: block;
            margin: 20px auto;
        }
    </style>
</head>
<body>
    <h1>PDF.js 基本示例</h1>
    <canvas id="pdf-canvas"></canvas>
    
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
    <script>
        // 配置 Worker 路径
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        // PDF 文件路径
        const pdfUrl = 'path/to/your/document.pdf';
        
        // 加载 PDF 文档
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        
        loadingTask.promise.then(function(pdf) {
            console.log('PDF 加载成功，总页数:', pdf.numPages);
            
            // 获取第一页
            return pdf.getPage(1);
        }).then(function(page) {
            console.log('页面加载成功');
            
            // 设置缩放比例
            const scale = 1.5;
            const viewport = page.getViewport({ scale: scale });
            
            // 准备 Canvas
            const canvas = document.getElementById('pdf-canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            // 渲染页面
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            
            const renderTask = page.render(renderContext);
            
            return renderTask.promise;
        }).then(function() {
            console.log('页面渲染完成');
        }).catch(function(error) {
            console.error('错误:', error);
        });
    </script>
</body>
</html>
```

### 处理多页面

```javascript
// 渲染所有页面
function renderAllPages(pdf) {
    const container = document.getElementById('pdf-container');
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        pdf.getPage(pageNum).then(function(page) {
            const scale = 1.2;
            const viewport = page.getViewport({ scale: scale });
            
            // 为每页创建 Canvas
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            canvas.style.display = 'block';
            canvas.style.margin = '10px auto';
            canvas.style.border = '1px solid #ccc';
            
            container.appendChild(canvas);
            
            // 渲染页面
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            
            page.render(renderContext);
        });
    }
}

// 使用示例
pdfjsLib.getDocument('document.pdf').promise.then(renderAllPages);
```

### 添加进度监听

```javascript
const loadingTask = pdfjsLib.getDocument('large-document.pdf');

// 监听加载进度
loadingTask.onProgress = function(progress) {
    const percent = Math.round((progress.loaded / progress.total) * 100);
    console.log(`加载进度: ${percent}%`);
    
    // 更新进度条
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
        progressBar.style.width = percent + '%';
        progressBar.textContent = percent + '%';
    }
};

loadingTask.promise.then(function(pdf) {
    console.log('PDF 加载完成');
    // 隐藏进度条
    document.getElementById('progress-container').style.display = 'none';
});
```

### 处理密码保护的 PDF

```javascript
const loadingTask = pdfjsLib.getDocument('protected.pdf');

// 处理密码请求
loadingTask.onPassword = function(callback, reason) {
    let password;
    
    if (reason === pdfjsLib.PasswordResponses.NEED_PASSWORD) {
        password = prompt('此 PDF 需要密码，请输入:');
    } else if (reason === pdfjsLib.PasswordResponses.INCORRECT_PASSWORD) {
        password = prompt('密码错误，请重新输入:');
    }
    
    if (password) {
        callback(password);
    } else {
        // 用户取消输入
        callback(null);
    }
};

loadingTask.promise.then(function(pdf) {
    console.log('PDF 解锁成功');
}).catch(function(error) {
    console.error('无法打开 PDF:', error);
});
```

## 响应式设计

为了让 PDF 在不同屏幕尺寸下都能正常显示，您可以实现响应式渲染：

```javascript
function renderPageResponsive(page, container) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    // 计算适合容器的缩放比例
    const containerWidth = container.clientWidth - 40; // 留出边距
    const viewport = page.getViewport({ scale: 1.0 });
    const scale = containerWidth / viewport.width;
    const scaledViewport = page.getViewport({ scale: scale });
    
    // 设置 Canvas 尺寸
    canvas.height = scaledViewport.height;
    canvas.width = scaledViewport.width;
    
    // 处理高 DPI 屏幕
    const outputScale = window.devicePixelRatio || 1;
    if (outputScale !== 1) {
        canvas.width *= outputScale;
        canvas.height *= outputScale;
        canvas.style.width = scaledViewport.width + 'px';
        canvas.style.height = scaledViewport.height + 'px';
        context.scale(outputScale, outputScale);
    }
    
    canvas.style.display = 'block';
    canvas.style.margin = '20px auto';
    canvas.style.border = '1px solid #ddd';
    canvas.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    
    container.appendChild(canvas);
    
    // 渲染页面
    return page.render({
        canvasContext: context,
        viewport: scaledViewport
    }).promise;
}

// 窗口大小改变时重新渲染
window.addEventListener('resize', function() {
    // 防抖处理
    clearTimeout(window.resizeTimer);
    window.resizeTimer = setTimeout(function() {
        // 重新渲染所有页面
        rerenderAllPages();
    }, 250);
});
```

## 错误处理

完善的错误处理是必要的：

```javascript
function loadPDF(url) {
    const loadingTask = pdfjsLib.getDocument(url);
    
    return loadingTask.promise.catch(function(error) {
        let errorMessage = '加载 PDF 时发生错误: ';
        
        if (error instanceof pdfjsLib.InvalidPDFException) {
            errorMessage += '无效的 PDF 文件';
        } else if (error instanceof pdfjsLib.MissingPDFException) {
            errorMessage += 'PDF 文件不存在';
        } else if (error instanceof pdfjsLib.UnexpectedResponseException) {
            errorMessage += '网络请求失败';
        } else {
            errorMessage += error.message || '未知错误';
        }
        
        console.error(errorMessage);
        
        // 显示错误信息给用户
        const errorDiv = document.getElementById('error-message');
        if (errorDiv) {
            errorDiv.textContent = errorMessage;
            errorDiv.style.display = 'block';
        }
        
        throw error;
    });
}
```

## 性能优化建议

1. **使用 Web Worker**: PDF.js 默认使用 Web Worker 来处理 PDF 解析，避免阻塞主线程

2. **按需加载页面**: 对于大文档，只渲染当前可见的页面

3. **合理设置缩放比例**: 过高的缩放比例会消耗更多内存和 CPU

4. **及时清理资源**: 使用完毕后调用 `destroy()` 方法

```javascript
// 清理资源
function cleanup() {
    if (window.currentPDF) {
        window.currentPDF.destroy();
        window.currentPDF = null;
    }
}

// 页面卸载时清理
window.addEventListener('beforeunload', cleanup);
```

## 下一步

现在您已经掌握了 PDF.js 的基本使用方法，可以继续学习：

- [基本概念](/guide/concepts) - 了解 PDF.js 的核心概念
- [API 文档](/api/) - 查看完整的 API 参考
- [示例](/examples/) - 查看更多实用示例
- [性能优化](/guide/performance) - 学习性能优化技巧

## 常见问题

### Q: 为什么需要配置 Worker？

A: PDF.js 使用 Web Worker 来处理 PDF 解析，避免阻塞主线程。您需要指定 Worker 脚本的路径。

### Q: 如何处理跨域问题？

A: 确保 PDF 文件和 Worker 脚本都正确配置了 CORS 头，或者将它们放在同一域名下。

### Q: 渲染的文字模糊怎么办？

A: 在高 DPI 屏幕上需要考虑 `devicePixelRatio`，参考上面的响应式设计示例。

### Q: 如何提取 PDF 中的文本？

A: 使用 `page.getTextContent()` 方法，详见 [文本提取示例](/examples/text-extraction)。