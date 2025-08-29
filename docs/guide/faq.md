# 常见问题

本章收集了 PDF.js 使用过程中的常见问题和解决方案。

## 安装和配置问题

### Q: 为什么 PDF.js 无法在本地文件系统中工作？

**A:** PDF.js 需要通过 HTTP(S) 协议访问，不能直接在 `file://` 协议下工作。这是由于浏览器的安全限制。

**解决方案：**
```bash
# 使用简单的 HTTP 服务器
npx serve .
# 或者
python -m http.server 8000
# 或者
php -S localhost:8000
```

### Q: 如何解决 "Cannot read property 'getDocument' of undefined" 错误？

**A:** 这通常是因为 PDF.js 库没有正确加载。

**解决方案：**
```html
<!-- 确保正确引入 PDF.js -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<script>
// 等待库加载完成
if (typeof pdfjsLib !== 'undefined') {
    console.log('PDF.js 已加载');
} else {
    console.error('PDF.js 加载失败');
}
</script>
```

### Q: Worker 文件路径错误怎么办？

**A:** 需要正确设置 Worker 文件路径。

**解决方案：**
```javascript
// 方法1：使用 CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// 方法2：使用本地文件
pdfjsLib.GlobalWorkerOptions.workerSrc = './pdf.worker.js';

// 方法3：使用相对路径
pdfjsLib.GlobalWorkerOptions.workerSrc = '../node_modules/pdfjs-dist/build/pdf.worker.js';
```

## 渲染问题

### Q: PDF 页面显示模糊怎么办？

**A:** 这通常是由于设备像素比（DPR）或缩放设置不当造成的。

**解决方案：**
```javascript
function renderPageCrisp(page, canvas) {
    const devicePixelRatio = window.devicePixelRatio || 1;
    const scale = 1.5 * devicePixelRatio;
    
    const viewport = page.getViewport({ scale });
    const context = canvas.getContext('2d');
    
    // 设置实际尺寸
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    // 设置显示尺寸
    canvas.style.width = (viewport.width / devicePixelRatio) + 'px';
    canvas.style.height = (viewport.height / devicePixelRatio) + 'px';
    
    // 缩放上下文
    context.scale(devicePixelRatio, devicePixelRatio);
    
    return page.render({
        canvasContext: context,
        viewport: page.getViewport({ scale: 1.5 })
    }).promise;
}
```

### Q: 如何解决中文字体显示问题？

**A:** PDF.js 可能无法正确显示某些中文字体。

**解决方案：**
```javascript
// 1. 启用标准字体
const loadingTask = pdfjsLib.getDocument({
    url: 'document.pdf',
    useSystemFonts: true,
    standardFontDataUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/standard_fonts/'
});

// 2. 自定义字体映射
const fontMap = {
    'SimSun': 'serif',
    'SimHei': 'sans-serif',
    'KaiTi': 'cursive'
};

// 3. CSS 字体回退
```

```css
canvas {
    font-family: 'SimSun', 'Microsoft YaHei', serif;
}
```

### Q: 页面渲染很慢怎么办？

**A:** 可以通过多种方式优化渲染性能。

**解决方案：**
```javascript
// 1. 降低渲染质量
const viewport = page.getViewport({ scale: 1.0 }); // 降低缩放比例

// 2. 使用渐进式渲染
const renderContext = {
    canvasContext: context,
    viewport: viewport,
    intent: 'display', // 或 'print'
    renderInteractiveForms: false // 禁用表单渲染
};

// 3. 启用文本层优化
const renderTask = page.render(renderContext);
renderTask.onProgress = function(progress) {
    console.log('渲染进度:', progress.loaded / progress.total);
};
```

## 内存问题

### Q: 应用占用内存过多怎么办？

**A:** 需要实施内存管理策略。

**解决方案：**
```javascript
// 1. 及时清理页面
class PDFPageManager {
    constructor() {
        this.loadedPages = new Map();
        this.maxPages = 5; // 最多保留5个页面
    }
    
    async getPage(pageNumber) {
        if (this.loadedPages.has(pageNumber)) {
            return this.loadedPages.get(pageNumber);
        }
        
        // 清理旧页面
        if (this.loadedPages.size >= this.maxPages) {
            const oldestPage = this.loadedPages.keys().next().value;
            this.loadedPages.delete(oldestPage);
        }
        
        const page = await this.pdfDocument.getPage(pageNumber);
        this.loadedPages.set(pageNumber, page);
        return page;
    }
    
    cleanup() {
        this.loadedPages.clear();
    }
}

// 2. 销毁文档
if (pdfDocument) {
    await pdfDocument.destroy();
    pdfDocument = null;
}
```

### Q: 如何检测内存泄漏？

**A:** 使用浏览器开发工具和代码监控。

**解决方案：**
```javascript
// 内存监控
function monitorMemory() {
    if ('memory' in performance) {
        const memInfo = performance.memory;
        console.log({
            used: (memInfo.usedJSHeapSize / 1024 / 1024).toFixed(2) + 'MB',
            total: (memInfo.totalJSHeapSize / 1024 / 1024).toFixed(2) + 'MB',
            limit: (memInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(2) + 'MB'
        });
    }
}

// 定期检查
setInterval(monitorMemory, 5000);
```

## 网络问题

### Q: 如何处理大文件加载超时？

**A:** 设置合适的超时时间和重试机制。

**解决方案：**
```javascript
async function loadPDFWithTimeout(url, timeout = 30000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const loadingTask = pdfjsLib.getDocument({
            url: url,
            httpHeaders: {
                'Cache-Control': 'no-cache'
            },
            withCredentials: false
        });
        
        // 监听进度
        loadingTask.onProgress = function(progress) {
            console.log(`加载进度: ${(progress.loaded / progress.total * 100).toFixed(1)}%`);
        };
        
        const pdfDocument = await loadingTask.promise;
        clearTimeout(timeoutId);
        return pdfDocument;
        
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('加载超时，请检查网络连接');
        }
        throw error;
    }
}
```

### Q: 如何处理 CORS 跨域问题？

**A:** 配置服务器或使用代理。

**解决方案：**
```javascript
// 1. 服务器端设置 CORS 头
// Apache .htaccess
/*
Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
Header set Access-Control-Allow-Headers "Content-Type"
*/

// 2. 使用代理
const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
const pdfUrl = proxyUrl + 'https://example.com/document.pdf';

// 3. 后端代理
fetch('/api/pdf-proxy?url=' + encodeURIComponent(originalUrl))
    .then(response => response.blob())
    .then(blob => {
        const url = URL.createObjectURL(blob);
        return pdfjsLib.getDocument(url).promise;
    });
```

## 兼容性问题

### Q: 在旧版浏览器中无法工作怎么办？

**A:** PDF.js 需要现代浏览器支持，可以添加兼容性检查。

**解决方案：**
```javascript
function checkBrowserCompatibility() {
    const requiredFeatures = {
        'Promise': typeof Promise !== 'undefined',
        'ArrayBuffer': typeof ArrayBuffer !== 'undefined',
        'Uint8Array': typeof Uint8Array !== 'undefined',
        'Worker': typeof Worker !== 'undefined',
        'Canvas': !!document.createElement('canvas').getContext
    };
    
    const unsupported = [];
    for (const [feature, supported] of Object.entries(requiredFeatures)) {
        if (!supported) {
            unsupported.push(feature);
        }
    }
    
    if (unsupported.length > 0) {
        throw new Error(`浏览器不支持以下特性: ${unsupported.join(', ')}`);
    }
    
    return true;
}

// 使用前检查
try {
    checkBrowserCompatibility();
    // 继续加载 PDF.js
} catch (error) {
    alert('您的浏览器版本过低，请升级到最新版本');
}
```

### Q: 在移动设备上性能差怎么办？

**A:** 针对移动设备进行优化。

**解决方案：**
```javascript
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function getMobileOptimizedScale() {
    if (isMobileDevice()) {
        return Math.min(window.devicePixelRatio || 1, 2); // 限制最大缩放
    }
    return 1.5;
}

// 移动设备优化配置
const mobileConfig = {
    scale: getMobileOptimizedScale(),
    renderInteractiveForms: false,
    intent: 'display',
    enableWebGL: false // 在某些移动设备上禁用 WebGL
};
```

## 文件格式问题

### Q: 某些 PDF 文件无法打开怎么办？

**A:** 可能是 PDF 版本或加密问题。

**解决方案：**
```javascript
async function validatePDFFile(file) {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // 检查 PDF 文件头
    const header = String.fromCharCode(...uint8Array.slice(0, 8));
    if (!header.startsWith('%PDF-')) {
        throw new Error('不是有效的 PDF 文件');
    }
    
    // 检查 PDF 版本
    const version = header.substring(5, 8);
    const supportedVersions = ['1.0', '1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '2.0'];
    
    if (!supportedVersions.includes(version)) {
        console.warn(`PDF 版本 ${version} 可能不完全支持`);
    }
    
    return true;
}

// 使用示例
try {
    await validatePDFFile(file);
    const pdfDocument = await pdfjsLib.getDocument(arrayBuffer).promise;
} catch (error) {
    console.error('PDF 文件验证失败:', error.message);
}
```

### Q: 如何处理密码保护的 PDF？

**A:** 实现密码输入界面。

**解决方案：**
```javascript
class PasswordHandler {
    constructor() {
        this.maxAttempts = 3;
        this.attempts = 0;
    }
    
    async handlePasswordProtectedPDF(url) {
        const loadingTask = pdfjsLib.getDocument(url);
        
        loadingTask.onPassword = (callback, reason) => {
            this.attempts++;
            
            if (this.attempts > this.maxAttempts) {
                callback(null); // 取消加载
                throw new Error('密码尝试次数过多');
            }
            
            const message = reason === pdfjsLib.PasswordResponses.NEED_PASSWORD 
                ? '此 PDF 需要密码:' 
                : '密码错误，请重新输入:';
            
            const password = prompt(message);
            callback(password);
        };
        
        try {
            return await loadingTask.promise;
        } catch (error) {
            if (error.name === 'PasswordException') {
                throw new Error('密码验证失败');
            }
            throw error;
        }
    }
}
```

## 性能优化问题

### Q: 如何实现页面懒加载？

**A:** 使用 Intersection Observer API。

**解决方案：**
```javascript
class LazyPDFRenderer {
    constructor(container) {
        this.container = container;
        this.observer = new IntersectionObserver(
            this.handleIntersection.bind(this),
            { rootMargin: '100px' } // 提前100px开始加载
        );
    }
    
    createPagePlaceholder(pageNumber) {
        const placeholder = document.createElement('div');
        placeholder.className = 'pdf-page-placeholder';
        placeholder.dataset.pageNumber = pageNumber;
        placeholder.style.height = '800px';
        placeholder.innerHTML = `<div class="loading">正在加载第 ${pageNumber} 页...</div>`;
        
        this.observer.observe(placeholder);
        return placeholder;
    }
    
    async handleIntersection(entries) {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                const pageNumber = parseInt(entry.target.dataset.pageNumber);
                await this.renderPage(pageNumber, entry.target);
                this.observer.unobserve(entry.target);
            }
        }
    }
}
```

### Q: 如何减少首屏加载时间？

**A:** 优先加载第一页，其他页面按需加载。

**解决方案：**
```javascript
async function optimizedPDFLoad(url) {
    // 1. 快速加载文档信息
    const loadingTask = pdfjsLib.getDocument({
        url: url,
        disableAutoFetch: true, // 禁用自动获取所有页面
        disableStream: false    // 启用流式加载
    });
    
    const pdfDocument = await loadingTask.promise;
    
    // 2. 立即渲染第一页
    const firstPage = await pdfDocument.getPage(1);
    await renderPage(firstPage, document.getElementById('first-page-canvas'));
    
    // 3. 后台预加载其他页面
    setTimeout(() => {
        preloadPages(pdfDocument, 2, Math.min(5, pdfDocument.numPages));
    }, 100);
    
    return pdfDocument;
}

async function preloadPages(pdfDocument, startPage, endPage) {
    for (let i = startPage; i <= endPage; i++) {
        try {
            await pdfDocument.getPage(i);
            console.log(`预加载页面 ${i} 完成`);
        } catch (error) {
            console.warn(`预加载页面 ${i} 失败:`, error);
        }
    }
}
```

## 调试问题

### Q: 如何启用 PDF.js 调试模式？

**A:** 设置调试标志和日志级别。

**解决方案：**
```javascript
// 启用详细日志
pdfjsLib.GlobalWorkerOptions.verbosity = pdfjsLib.VerbosityLevel.INFOS;

// 或者更详细的调试信息
pdfjsLib.GlobalWorkerOptions.verbosity = pdfjsLib.VerbosityLevel.WARNINGS;

// 监听所有事件
const loadingTask = pdfjsLib.getDocument('document.pdf');

loadingTask.onProgress = function(progress) {
    console.log('加载进度:', progress);
};

loadingTask.onPassword = function(callback, reason) {
    console.log('密码请求:', reason);
};

loadingTask.promise.then(function(pdfDocument) {
    console.log('PDF 信息:', {
        numPages: pdfDocument.numPages,
        fingerprint: pdfDocument.fingerprint,
        info: pdfDocument.info
    });
});
```

### Q: 如何捕获和分析错误？

**A:** 实现全面的错误处理和日志系统。

**解决方案：**
```javascript
class PDFDebugger {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.setupGlobalErrorHandling();
    }
    
    setupGlobalErrorHandling() {
        window.addEventListener('error', (event) => {
            if (event.error && event.error.stack && event.error.stack.includes('pdf')) {
                this.logError('Global Error', event.error);
            }
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            if (event.reason && event.reason.toString().includes('pdf')) {
                this.logError('Unhandled Promise Rejection', event.reason);
            }
        });
    }
    
    logError(type, error) {
        const errorInfo = {
            type: type,
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        this.errors.push(errorInfo);
        console.error('PDF.js Error:', errorInfo);
        
        // 可选：发送到错误监控服务
        this.reportError(errorInfo);
    }
    
    async reportError(errorInfo) {
        try {
            await fetch('/api/pdf-errors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(errorInfo)
            });
        } catch (e) {
            console.warn('无法发送错误报告:', e);
        }
    }
    
    getErrorSummary() {
        return {
            totalErrors: this.errors.length,
            recentErrors: this.errors.slice(-5),
            errorTypes: this.errors.reduce((acc, error) => {
                acc[error.type] = (acc[error.type] || 0) + 1;
                return acc;
            }, {})
        };
    }
}

// 使用调试器
const debugger = new PDFDebugger();
```

## 部署问题

### Q: 如何在生产环境中优化 PDF.js？

**A:** 使用压缩版本和 CDN。

**解决方案：**
```html
<!-- 生产环境配置 -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<script>
// 生产环境配置
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// 禁用调试信息
pdfjsLib.GlobalWorkerOptions.verbosity = pdfjsLib.VerbosityLevel.ERRORS;

// 启用缓存
const cacheConfig = {
    disableAutoFetch: false,
    disableStream: false,
    cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
    cMapPacked: true
};
</script>
```

通过这些常见问题的解答，您应该能够解决大部分 PDF.js 使用过程中遇到的问题。如果遇到其他问题，建议查看浏览器控制台的错误信息，并参考 PDF.js 官方文档。