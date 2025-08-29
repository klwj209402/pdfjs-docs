# 快速开始

本指南将帮助您快速上手 PDF.js，从安装到渲染第一个 PDF 文档。

## 安装

### 通过 CDN 引入

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
        // 设置 Worker 路径
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    </script>
</body>
</html>
```

### 通过 npm 安装

如果你使用现代前端构建工具，可以通过 npm 安装：

```bash
npm install pdfjs-dist
```

然后在你的项目中引入：

```javascript
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';

// 设置 Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
```

### 下载源码

你也可以直接下载 PDF.js 的构建文件：

1. 访问 [PDF.js 发布页面](https://github.com/mozilla/pdf.js/releases)
2. 下载最新版本的 `pdfjs-dist` 包
3. 解压并将文件放到你的项目中

```html
<script src="./pdfjs/build/pdf.js"></script>
<script>
    pdfjsLib.GlobalWorkerOptions.workerSrc = './pdfjs/build/pdf.worker.js';
</script>
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

在实际应用中，错误处理非常重要：

```javascript
async function loadPDFWithErrorHandling(url) {
    try {
        const loadingTask = pdfjsLib.getDocument(url);
        
        // 监听加载进度
        loadingTask.onProgress = function(progress) {
            console.log(`加载进度: ${(progress.loaded / progress.total * 100).toFixed(1)}%`);
        };
        
        // 处理密码保护的 PDF
        loadingTask.onPassword = function(callback, reason) {
            const password = prompt('请输入 PDF 密码:');
            callback(password);
        };
        
        const pdfDocument = await loadingTask.promise;
        return pdfDocument;
        
    } catch (error) {
        console.error('PDF 加载失败:', error);
        
        // 根据错误类型提供不同的处理
        if (error.name === 'InvalidPDFException') {
            alert('无效的 PDF 文件');
        } else if (error.name === 'MissingPDFException') {
            alert('PDF 文件不存在');
        } else if (error.name === 'UnexpectedResponseException') {
            alert('网络错误，请检查文件路径');
        } else {
            alert('加载 PDF 时发生未知错误');
        }
        
        throw error;
    }
}
```

## 性能优化建议

### 1. 按需加载页面

不要一次性渲染所有页面，而是根据用户的滚动位置按需加载：

```javascript
class LazyPDFViewer {
    constructor(container) {
        this.container = container;
        this.loadedPages = new Set();
        this.setupIntersectionObserver();
    }
    
    setupIntersectionObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const pageNumber = parseInt(entry.target.dataset.pageNumber);
                    this.loadPage(pageNumber);
                }
            });
        }, {
            rootMargin: '100px' // 提前 100px 开始加载
        });
    }
    
    async loadPage(pageNumber) {
        if (this.loadedPages.has(pageNumber)) return;
        
        this.loadedPages.add(pageNumber);
        const page = await this.pdfDocument.getPage(pageNumber);
        const canvas = document.querySelector(`[data-page-number="${pageNumber}"] canvas`);
        await this.renderPage(page, canvas);
    }
}
```

### 2. 内存管理

及时清理不需要的页面和资源：

```javascript
class PDFPageManager {
    constructor(maxCachedPages = 5) {
        this.maxCachedPages = maxCachedPages;
        this.pageCache = new Map();
    }
    
    async getPage(pageNumber) {
        if (this.pageCache.has(pageNumber)) {
            return this.pageCache.get(pageNumber);
        }
        
        // 如果缓存已满，删除最旧的页面
        if (this.pageCache.size >= this.maxCachedPages) {
            const firstKey = this.pageCache.keys().next().value;
            this.pageCache.delete(firstKey);
        }
        
        const page = await this.pdfDocument.getPage(pageNumber);
        this.pageCache.set(pageNumber, page);
        return page;
    }
    
    clearCache() {
        this.pageCache.clear();
    }
}
```

### 3. 渲染优化

使用合适的缩放比例和渲染选项：

```javascript
function getOptimalScale() {
    const devicePixelRatio = window.devicePixelRatio || 1;
    const containerWidth = document.getElementById('pdf-container').clientWidth;
    
    // 根据容器宽度和设备像素比计算最佳缩放
    return Math.min(containerWidth / 595, devicePixelRatio * 1.5); // 595 是 A4 纸的标准宽度
}

async function renderPageOptimized(page, canvas) {
    const scale = getOptimalScale();
    const viewport = page.getViewport({ scale });
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    const renderContext = {
        canvasContext: canvas.getContext('2d'),
        viewport: viewport,
        intent: 'display', // 'display' 或 'print'
        renderInteractiveForms: false // 如果不需要表单，可以禁用以提高性能
    };
    
    return page.render(renderContext).promise;
}
```













## 常见问题

### Q: 为什么 PDF.js 在本地文件系统中无法工作？

**A:** PDF.js 需要通过 HTTP(S) 协议访问，不能直接在 `file://` 协议下工作。你需要启动一个本地服务器：

```bash
# 使用 Python
python -m http.server 8000

# 使用 Node.js
npx serve .

# 使用 PHP
php -S localhost:8000
```

### Q: 如何解决 "Cannot read property 'getDocument' of undefined" 错误？

**A:** 这通常是因为 PDF.js 库没有正确加载。确保：

1. 脚本标签的 `src` 路径正确
2. 在使用 `pdfjsLib` 之前，库已经完全加载
3. 检查浏览器控制台是否有其他错误

### Q: PDF 页面显示模糊怎么办？

**A:** 这通常是由于设备像素比问题。尝试调整缩放比例：

```javascript
const scale = window.devicePixelRatio || 1;
const viewport = page.getViewport({ scale: scale * 1.5 });
```

### Q: 如何处理大文件的加载性能？

**A:** 可以使用以下策略：

1. 启用流式加载：`disableStream: false`
2. 禁用自动获取：`disableAutoFetch: true`
3. 实现虚拟滚动
4. 使用缩略图预览