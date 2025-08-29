# 性能优化

本章将详细介绍 PDF.js 的性能优化策略，帮助您构建高效的 PDF 处理应用。

## 核心优化原则

### 1. 按需加载

只加载用户当前需要查看的内容：

```javascript
class LazyPDFViewer {
    constructor(container) {
        this.container = container;
        this.loadedPages = new Map();
        this.visiblePages = new Set();
        this.observer = new IntersectionObserver(
            this.handleIntersection.bind(this),
            { threshold: 0.1 }
        );
    }
    
    async loadDocument(url) {
        this.pdfDocument = await pdfjsLib.getDocument(url).promise;
        this.createPagePlaceholders();
    }
    
    createPagePlaceholders() {
        for (let i = 1; i <= this.pdfDocument.numPages; i++) {
            const pageDiv = document.createElement('div');
            pageDiv.className = 'pdf-page-placeholder';
            pageDiv.dataset.pageNumber = i;
            pageDiv.style.height = '800px'; // 预估高度
            
            this.container.appendChild(pageDiv);
            this.observer.observe(pageDiv);
        }
    }
    
    async handleIntersection(entries) {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                const pageNumber = parseInt(entry.target.dataset.pageNumber);
                await this.loadPage(pageNumber, entry.target);
            }
        }
    }
    
    async loadPage(pageNumber, container) {
        if (this.loadedPages.has(pageNumber)) return;
        
        try {
            const page = await this.pdfDocument.getPage(pageNumber);
            const canvas = document.createElement('canvas');
            const viewport = page.getViewport({ scale: 1.5 });
            
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            container.style.height = viewport.height + 'px';
            
            const renderContext = {
                canvasContext: canvas.getContext('2d'),
                viewport: viewport
            };
            
            await page.render(renderContext).promise;
            
            container.innerHTML = '';
            container.appendChild(canvas);
            this.loadedPages.set(pageNumber, page);
            
        } catch (error) {
            console.error(`加载第 ${pageNumber} 页失败:`, error);
        }
    }
}
```

### 2. 虚拟滚动

对于大型文档，实现虚拟滚动以减少 DOM 节点：

```javascript
class VirtualPDFScroller {
    constructor(container, itemHeight = 800) {
        this.container = container;
        this.itemHeight = itemHeight;
        this.visibleCount = Math.ceil(container.clientHeight / itemHeight) + 2;
        this.scrollTop = 0;
        this.totalPages = 0;
        
        this.setupScrollListener();
    }
    
    setupScrollListener() {
        this.container.addEventListener('scroll', () => {
            this.scrollTop = this.container.scrollTop;
            this.updateVisiblePages();
        });
    }
    
    setTotalPages(count) {
        this.totalPages = count;
        this.container.style.height = count * this.itemHeight + 'px';
        this.updateVisiblePages();
    }
    
    updateVisiblePages() {
        const startIndex = Math.floor(this.scrollTop / this.itemHeight);
        const endIndex = Math.min(startIndex + this.visibleCount, this.totalPages);
        
        // 清除现有页面
        this.container.innerHTML = '';
        
        // 创建可见页面
        for (let i = startIndex; i < endIndex; i++) {
            const pageDiv = this.createPageElement(i + 1);
            pageDiv.style.position = 'absolute';
            pageDiv.style.top = (i * this.itemHeight) + 'px';
            this.container.appendChild(pageDiv);
            
            // 异步加载页面内容
            this.loadPageContent(i + 1, pageDiv);
        }
    }
}
```

## 内存管理

### 1. 页面缓存策略

实现智能的页面缓存机制：

```javascript
class PDFPageCache {
    constructor(maxSize = 10) {
        this.maxSize = maxSize;
        this.cache = new Map();
        this.accessOrder = [];
    }
    
    set(pageNumber, pageData) {
        // 如果已存在，更新访问顺序
        if (this.cache.has(pageNumber)) {
            this.updateAccessOrder(pageNumber);
            return;
        }
        
        // 如果缓存已满，移除最久未访问的页面
        if (this.cache.size >= this.maxSize) {
            this.evictLeastRecentlyUsed();
        }
        
        this.cache.set(pageNumber, pageData);
        this.accessOrder.push(pageNumber);
    }
    
    get(pageNumber) {
        if (this.cache.has(pageNumber)) {
            this.updateAccessOrder(pageNumber);
            return this.cache.get(pageNumber);
        }
        return null;
    }
    
    updateAccessOrder(pageNumber) {
        const index = this.accessOrder.indexOf(pageNumber);
        if (index > -1) {
            this.accessOrder.splice(index, 1);
        }
        this.accessOrder.push(pageNumber);
    }
    
    evictLeastRecentlyUsed() {
        const lruPage = this.accessOrder.shift();
        const pageData = this.cache.get(lruPage);
        
        // 清理页面资源
        if (pageData && pageData.cleanup) {
            pageData.cleanup();
        }
        
        this.cache.delete(lruPage);
        console.log(`清理缓存页面: ${lruPage}`);
    }
    
    clear() {
        for (const [pageNumber, pageData] of this.cache) {
            if (pageData && pageData.cleanup) {
                pageData.cleanup();
            }
        }
        this.cache.clear();
        this.accessOrder = [];
    }
}
```

### 2. 内存监控

监控和控制内存使用：

```javascript
class MemoryMonitor {
    constructor(warningThreshold = 50, criticalThreshold = 80) {
        this.warningThreshold = warningThreshold; // MB
        this.criticalThreshold = criticalThreshold; // MB
        this.checkInterval = 5000; // 5秒检查一次
        
        this.startMonitoring();
    }
    
    startMonitoring() {
        if ('memory' in performance) {
            setInterval(() => {
                this.checkMemoryUsage();
            }, this.checkInterval);
        }
    }
    
    checkMemoryUsage() {
        if (!('memory' in performance)) return;
        
        const memInfo = performance.memory;
        const usedMB = memInfo.usedJSHeapSize / 1024 / 1024;
        const totalMB = memInfo.totalJSHeapSize / 1024 / 1024;
        const limitMB = memInfo.jsHeapSizeLimit / 1024 / 1024;
        
        console.log(`内存使用: ${usedMB.toFixed(1)}MB / ${limitMB.toFixed(1)}MB`);
        
        if (usedMB > this.criticalThreshold) {
            this.handleCriticalMemory();
        } else if (usedMB > this.warningThreshold) {
            this.handleWarningMemory();
        }
    }
    
    handleWarningMemory() {
        console.warn('内存使用接近警告阈值，建议清理缓存');
        // 触发轻量级清理
        this.triggerLightCleanup();
    }
    
    handleCriticalMemory() {
        console.error('内存使用过高，执行紧急清理');
        // 触发激进清理
        this.triggerAggressiveCleanup();
    }
    
    triggerLightCleanup() {
        // 清理部分缓存
        if (window.pdfPageCache) {
            const cacheSize = window.pdfPageCache.cache.size;
            const targetSize = Math.floor(cacheSize * 0.7);
            
            while (window.pdfPageCache.cache.size > targetSize) {
                window.pdfPageCache.evictLeastRecentlyUsed();
            }
        }
    }
    
    triggerAggressiveCleanup() {
        // 清理所有缓存
        if (window.pdfPageCache) {
            window.pdfPageCache.clear();
        }
        
        // 强制垃圾回收（如果可用）
        if (window.gc) {
            window.gc();
        }
    }
}
```

## 渲染优化

### 1. 渲染队列

控制并发渲染数量：

```javascript
class RenderQueue {
    constructor(maxConcurrent = 2) {
        this.maxConcurrent = maxConcurrent;
        this.queue = [];
        this.running = new Set();
    }
    
    async add(renderTask) {
        return new Promise((resolve, reject) => {
            this.queue.push({
                task: renderTask,
                resolve,
                reject
            });
            
            this.processQueue();
        });
    }
    
    async processQueue() {
        if (this.running.size >= this.maxConcurrent || this.queue.length === 0) {
            return;
        }
        
        const item = this.queue.shift();
        const taskId = Symbol('renderTask');
        this.running.add(taskId);
        
        try {
            const result = await item.task();
            item.resolve(result);
        } catch (error) {
            item.reject(error);
        } finally {
            this.running.delete(taskId);
            // 处理下一个任务
            setTimeout(() => this.processQueue(), 0);
        }
    }
}

// 使用示例
const renderQueue = new RenderQueue(3);

async function renderPageOptimized(page, canvas) {
    return renderQueue.add(async () => {
        const viewport = page.getViewport({ scale: 1.5 });
        const context = canvas.getContext('2d');
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        
        await page.render(renderContext).promise;
        return canvas;
    });
}
```

### 2. 渲染优先级

根据页面可见性设置渲染优先级：

```javascript
class PriorityRenderer {
    constructor() {
        this.highPriorityQueue = [];
        this.normalPriorityQueue = [];
        this.lowPriorityQueue = [];
        this.isProcessing = false;
    }
    
    addRenderTask(task, priority = 'normal') {
        const queues = {
            'high': this.highPriorityQueue,
            'normal': this.normalPriorityQueue,
            'low': this.lowPriorityQueue
        };
        
        queues[priority].push(task);
        this.processNext();
    }
    
    async processNext() {
        if (this.isProcessing) return;
        
        let task = this.getNextTask();
        if (!task) return;
        
        this.isProcessing = true;
        
        try {
            await task();
        } catch (error) {
            console.error('渲染任务失败:', error);
        } finally {
            this.isProcessing = false;
            // 使用 requestIdleCallback 在浏览器空闲时处理下一个任务
            if (window.requestIdleCallback) {
                requestIdleCallback(() => this.processNext());
            } else {
                setTimeout(() => this.processNext(), 0);
            }
        }
    }
    
    getNextTask() {
        if (this.highPriorityQueue.length > 0) {
            return this.highPriorityQueue.shift();
        }
        if (this.normalPriorityQueue.length > 0) {
            return this.normalPriorityQueue.shift();
        }
        if (this.lowPriorityQueue.length > 0) {
            return this.lowPriorityQueue.shift();
        }
        return null;
    }
}
```

## 网络优化

### 1. 分块加载

实现 PDF 文件的分块加载：

```javascript
class ChunkedPDFLoader {
    constructor(url, chunkSize = 1024 * 1024) { // 1MB chunks
        this.url = url;
        this.chunkSize = chunkSize;
        this.loadedChunks = new Map();
        this.fileSize = 0;
    }
    
    async initialize() {
        // 获取文件大小
        const response = await fetch(this.url, { method: 'HEAD' });
        this.fileSize = parseInt(response.headers.get('content-length'));
        
        // 加载初始块（包含 PDF 头部信息）
        await this.loadChunk(0);
        
        return this.createPDFDocument();
    }
    
    async loadChunk(chunkIndex) {
        if (this.loadedChunks.has(chunkIndex)) {
            return this.loadedChunks.get(chunkIndex);
        }
        
        const start = chunkIndex * this.chunkSize;
        const end = Math.min(start + this.chunkSize - 1, this.fileSize - 1);
        
        const response = await fetch(this.url, {
            headers: {
                'Range': `bytes=${start}-${end}`
            }
        });
        
        const chunk = await response.arrayBuffer();
        this.loadedChunks.set(chunkIndex, chunk);
        
        console.log(`加载块 ${chunkIndex}: ${start}-${end}`);
        return chunk;
    }
    
    createPDFDocument() {
        const loadingTask = pdfjsLib.getDocument({
            url: this.url,
            rangeChunkSize: this.chunkSize,
            disableAutoFetch: true,
            disableStream: false
        });
        
        return loadingTask.promise;
    }
}
```

### 2. 预加载策略

智能预加载相邻页面：

```javascript
class SmartPreloader {
    constructor(pdfDocument, preloadDistance = 2) {
        this.pdfDocument = pdfDocument;
        this.preloadDistance = preloadDistance;
        this.preloadedPages = new Set();
        this.preloadQueue = [];
    }
    
    preloadAroundPage(currentPage) {
        const startPage = Math.max(1, currentPage - this.preloadDistance);
        const endPage = Math.min(this.pdfDocument.numPages, currentPage + this.preloadDistance);
        
        for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
            if (!this.preloadedPages.has(pageNum) && pageNum !== currentPage) {
                this.schedulePreload(pageNum);
            }
        }
    }
    
    schedulePreload(pageNumber) {
        if (this.preloadQueue.includes(pageNumber)) return;
        
        this.preloadQueue.push(pageNumber);
        
        // 使用 requestIdleCallback 在浏览器空闲时预加载
        if (window.requestIdleCallback) {
            requestIdleCallback(() => this.processPreloadQueue());
        } else {
            setTimeout(() => this.processPreloadQueue(), 100);
        }
    }
    
    async processPreloadQueue() {
        if (this.preloadQueue.length === 0) return;
        
        const pageNumber = this.preloadQueue.shift();
        
        try {
            const page = await this.pdfDocument.getPage(pageNumber);
            
            // 预渲染到离屏 Canvas
            const canvas = new OffscreenCanvas(200, 300); // 小尺寸预览
            const context = canvas.getContext('2d');
            const viewport = page.getViewport({ scale: 0.2 });
            
            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;
            
            this.preloadedPages.add(pageNumber);
            console.log(`预加载页面 ${pageNumber} 完成`);
            
        } catch (error) {
            console.warn(`预加载页面 ${pageNumber} 失败:`, error);
        }
        
        // 继续处理队列
        if (this.preloadQueue.length > 0) {
            setTimeout(() => this.processPreloadQueue(), 50);
        }
    }
}
```

## 用户体验优化

### 1. 渐进式加载

实现渐进式页面加载效果：

```javascript
class ProgressiveLoader {
    async loadPageProgressively(page, canvas) {
        const viewport = page.getViewport({ scale: 1.5 });
        const context = canvas.getContext('2d');
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // 第一阶段：低质量快速预览
        await this.renderLowQuality(page, context, viewport);
        
        // 第二阶段：高质量渲染
        await this.renderHighQuality(page, context, viewport);
    }
    
    async renderLowQuality(page, context, viewport) {
        const lowResViewport = page.getViewport({ scale: 0.5 });
        const tempCanvas = document.createElement('canvas');
        const tempContext = tempCanvas.getContext('2d');
        
        tempCanvas.width = lowResViewport.width;
        tempCanvas.height = lowResViewport.height;
        
        // 渲染低分辨率版本
        await page.render({
            canvasContext: tempContext,
            viewport: lowResViewport
        }).promise;
        
        // 放大到目标尺寸
        context.imageSmoothingEnabled = true;
        context.drawImage(
            tempCanvas, 
            0, 0, tempCanvas.width, tempCanvas.height,
            0, 0, viewport.width, viewport.height
        );
    }
    
    async renderHighQuality(page, context, viewport) {
        // 渲染高质量版本
        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;
    }
}
```

### 2. 加载状态指示

提供详细的加载进度反馈：

```javascript
class LoadingIndicator {
    constructor(container) {
        this.container = container;
        this.progressBar = null;
        this.statusText = null;
        this.createIndicator();
    }
    
    createIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'loading-indicator';
        indicator.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-progress">
                <div class="progress-bar"></div>
            </div>
            <div class="loading-status">正在加载...</div>
        `;
        
        this.progressBar = indicator.querySelector('.progress-bar');
        this.statusText = indicator.querySelector('.loading-status');
        
        this.container.appendChild(indicator);
    }
    
    updateProgress(loaded, total, status = '') {
        if (total > 0) {
            const percent = (loaded / total) * 100;
            this.progressBar.style.width = percent + '%';
        }
        
        if (status) {
            this.statusText.textContent = status;
        }
    }
    
    setStatus(status) {
        this.statusText.textContent = status;
    }
    
    hide() {
        const indicator = this.container.querySelector('.loading-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
}

// 使用示例
const loadingIndicator = new LoadingIndicator(document.getElementById('pdf-container'));

const loadingTask = pdfjsLib.getDocument('document.pdf');

loadingTask.onProgress = function(progress) {
    loadingIndicator.updateProgress(
        progress.loaded, 
        progress.total, 
        `正在下载... ${Math.round((progress.loaded / progress.total) * 100)}%`
    );
};

try {
    loadingIndicator.setStatus('正在解析 PDF...');
    const pdfDocument = await loadingTask.promise;
    loadingIndicator.hide();
} catch (error) {
    loadingIndicator.setStatus('加载失败');
}
```

## 性能监控

### 1. 性能指标收集

```javascript
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            loadTime: 0,
            renderTimes: [],
            memoryUsage: [],
            errorCount: 0
        };
    }
    
    startLoadTimer() {
        this.loadStartTime = performance.now();
    }
    
    endLoadTimer() {
        this.metrics.loadTime = performance.now() - this.loadStartTime;
    }
    
    recordRenderTime(pageNumber, renderTime) {
        this.metrics.renderTimes.push({
            page: pageNumber,
            time: renderTime,
            timestamp: Date.now()
        });
    }
    
    recordMemoryUsage() {
        if ('memory' in performance) {
            const memInfo = performance.memory;
            this.metrics.memoryUsage.push({
                used: memInfo.usedJSHeapSize,
                total: memInfo.totalJSHeapSize,
                timestamp: Date.now()
            });
        }
    }
    
    getAverageRenderTime() {
        if (this.metrics.renderTimes.length === 0) return 0;
        
        const total = this.metrics.renderTimes.reduce((sum, item) => sum + item.time, 0);
        return total / this.metrics.renderTimes.length;
    }
    
    generateReport() {
        return {
            loadTime: this.metrics.loadTime,
            averageRenderTime: this.getAverageRenderTime(),
            totalPages: this.metrics.renderTimes.length,
            errorCount: this.metrics.errorCount,
            peakMemoryUsage: Math.max(...this.metrics.memoryUsage.map(m => m.used))
        };
    }
}
```

## 最佳实践总结

### 1. 加载优化
- 使用 Worker 进行后台处理
- 实现分块加载和范围请求
- 启用流式加载（disableStream: false）
- 合理设置缓存策略

### 2. 渲染优化
- 控制并发渲染数量
- 实现虚拟滚动
- 使用渐进式加载
- 优化 Canvas 尺寸和缩放

### 3. 内存管理
- 实现页面缓存和清理机制
- 监控内存使用情况
- 及时释放不需要的资源
- 避免内存泄漏

### 4. 用户体验
- 提供详细的加载进度
- 实现平滑的滚动体验
- 优化首屏加载时间
- 处理网络异常情况

通过实施这些性能优化策略，您可以显著提升 PDF.js 应用的性能和用户体验。记住，性能优化是一个持续的过程，需要根据实际使用情况不断调整和改进。