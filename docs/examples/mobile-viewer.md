# 移动端PDF查看器

本示例展示如何为移动设备创建优化的PDF查看器，包括触摸手势、响应式布局和性能优化。

## 基础移动端查看器

创建适配移动设备的PDF查看器：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>移动端PDF查看器</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      overflow: hidden;
    }
    
    .viewer-container {
      position: relative;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
    }
    
    .pdf-container {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: auto;
      -webkit-overflow-scrolling: touch;
    }
    
    .page-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 10px;
      gap: 10px;
    }
    
    .pdf-page {
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      background: white;
      border-radius: 4px;
      max-width: 100%;
      height: auto;
    }
    
    .toolbar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 10px;
      display: flex;
      justify-content: space-around;
      align-items: center;
      z-index: 1000;
      transform: translateY(100%);
      transition: transform 0.3s ease;
    }
    
    .toolbar.visible {
      transform: translateY(0);
    }
    
    .toolbar button {
      background: none;
      border: none;
      color: white;
      font-size: 16px;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .toolbar button:active {
      background: rgba(255,255,255,0.2);
    }
    
    .page-info {
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0,0,0,0.7);
      color: white;
      padding: 8px 12px;
      border-radius: 20px;
      font-size: 14px;
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .page-info.visible {
      opacity: 1;
    }
    
    .loading {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 20px;
      border-radius: 8px;
      z-index: 2000;
    }
  </style>
</head>
<body>
  <div class="viewer-container">
    <div class="pdf-container" id="pdfContainer">
      <div class="page-container" id="pageContainer">
        <!-- PDF页面将在这里渲染 -->
      </div>
    </div>
    
    <div class="toolbar" id="toolbar">
      <button id="prevBtn">◀</button>
      <button id="zoomOutBtn">-</button>
      <button id="fitBtn">适应</button>
      <button id="zoomInBtn">+</button>
      <button id="nextBtn">▶</button>
    </div>
    
    <div class="page-info" id="pageInfo">
      <span id="currentPage">1</span> / <span id="totalPages">1</span>
    </div>
    
    <div class="loading" id="loading" style="display: none;">
      加载中...
    </div>
  </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <script>
    /**
     * 移动端PDF查看器类
     */
    class MobilePDFViewer {
      constructor(container) {
        this.container = container;
        this.pdfContainer = document.getElementById('pdfContainer');
        this.pageContainer = document.getElementById('pageContainer');
        this.toolbar = document.getElementById('toolbar');
        this.pageInfo = document.getElementById('pageInfo');
        this.loading = document.getElementById('loading');
        
        this.pdf = null;
        this.currentPage = 1;
        this.totalPages = 0;
        this.scale = 1.0;
        this.pages = new Map();
        
        this.initializeEventListeners();
        this.setupTouchGestures();
      }
      
      /**
       * 初始化事件监听器
       */
      initializeEventListeners() {
        // 工具栏按钮
        document.getElementById('prevBtn').addEventListener('click', () => this.previousPage());
        document.getElementById('nextBtn').addEventListener('click', () => this.nextPage());
        document.getElementById('zoomInBtn').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoomOutBtn').addEventListener('click', () => this.zoomOut());
        document.getElementById('fitBtn').addEventListener('click', () => this.fitToWidth());
        
        // 滚动事件
        this.pdfContainer.addEventListener('scroll', () => this.onScroll());
        
        // 点击显示/隐藏工具栏
        this.pdfContainer.addEventListener('click', () => this.toggleToolbar());
        
        // 阻止默认的缩放行为
        document.addEventListener('gesturestart', (e) => e.preventDefault());
        document.addEventListener('gesturechange', (e) => e.preventDefault());
        document.addEventListener('gestureend', (e) => e.preventDefault());
      }
      
      /**
       * 设置触摸手势
       */
      setupTouchGestures() {
        let initialDistance = 0;
        let initialScale = 1;
        let isZooming = false;
        
        this.pdfContainer.addEventListener('touchstart', (e) => {
          if (e.touches.length === 2) {
            isZooming = true;
            initialDistance = this.getDistance(e.touches[0], e.touches[1]);
            initialScale = this.scale;
            e.preventDefault();
          }
        });
        
        this.pdfContainer.addEventListener('touchmove', (e) => {
          if (isZooming && e.touches.length === 2) {
            const currentDistance = this.getDistance(e.touches[0], e.touches[1]);
            const scaleChange = currentDistance / initialDistance;
            const newScale = Math.max(0.5, Math.min(3.0, initialScale * scaleChange));
            
            if (Math.abs(newScale - this.scale) > 0.1) {
              this.setScale(newScale);
            }
            
            e.preventDefault();
          }
        });
        
        this.pdfContainer.addEventListener('touchend', (e) => {
          if (isZooming) {
            isZooming = false;
          }
        });
      }
      
      /**
       * 计算两点间距离
       * @param {Touch} touch1 - 第一个触摸点
       * @param {Touch} touch2 - 第二个触摸点
       * @returns {number} 距离
       */
      getDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
      }
      
      /**
       * 加载PDF文档
       * @param {string} url - PDF文件URL
       */
      async loadDocument(url) {
        try {
          this.showLoading(true);
          
          const loadingTask = pdfjsLib.getDocument(url);
          this.pdf = await loadingTask.promise;
          this.totalPages = this.pdf.numPages;
          
          this.updatePageInfo();
          await this.renderVisiblePages();
          
          this.showLoading(false);
        } catch (error) {
          console.error('PDF加载失败:', error);
          this.showLoading(false);
          alert('PDF加载失败，请检查文件路径');
        }
      }
      
      /**
       * 渲染可见页面
       */
      async renderVisiblePages() {
        if (!this.pdf) return;
        
        const containerRect = this.pdfContainer.getBoundingClientRect();
        const scrollTop = this.pdfContainer.scrollTop;
        const viewportHeight = containerRect.height;
        
        // 计算可见页面范围
        const startPage = Math.max(1, this.currentPage - 1);
        const endPage = Math.min(this.totalPages, this.currentPage + 1);
        
        // 渲染页面
        for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
          if (!this.pages.has(pageNum)) {
            await this.renderPage(pageNum);
          }
        }
        
        // 清理不可见页面
        this.cleanupInvisiblePages(startPage, endPage);
      }
      
      /**
       * 渲染单个页面
       * @param {number} pageNum - 页面编号
       */
      async renderPage(pageNum) {
        try {
          const page = await this.pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: this.scale });
          
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          // 设置canvas尺寸
          const outputScale = window.devicePixelRatio || 1;
          canvas.width = Math.floor(viewport.width * outputScale);
          canvas.height = Math.floor(viewport.height * outputScale);
          canvas.style.width = Math.floor(viewport.width) + 'px';
          canvas.style.height = Math.floor(viewport.height) + 'px';
          
          const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;
          
          canvas.className = 'pdf-page';
          canvas.dataset.pageNumber = pageNum;
          
          // 渲染页面
          const renderContext = {
            canvasContext: context,
            viewport: viewport,
            transform: transform
          };
          
          await page.render(renderContext).promise;
          
          // 添加到容器
          this.pageContainer.appendChild(canvas);
          this.pages.set(pageNum, canvas);
          
        } catch (error) {
          console.error(`页面${pageNum}渲染失败:`, error);
        }
      }
      
      /**
       * 清理不可见页面
       * @param {number} startPage - 开始页面
       * @param {number} endPage - 结束页面
       */
      cleanupInvisiblePages(startPage, endPage) {
        for (const [pageNum, canvas] of this.pages) {
          if (pageNum < startPage || pageNum > endPage) {
            canvas.remove();
            this.pages.delete(pageNum);
          }
        }
      }
      
      /**
       * 设置缩放比例
       * @param {number} newScale - 新的缩放比例
       */
      async setScale(newScale) {
        this.scale = newScale;
        
        // 清除所有页面
        this.pageContainer.innerHTML = '';
        this.pages.clear();
        
        // 重新渲染
        await this.renderVisiblePages();
      }
      
      /**
       * 放大
       */
      zoomIn() {
        const newScale = Math.min(3.0, this.scale * 1.2);
        this.setScale(newScale);
      }
      
      /**
       * 缩小
       */
      zoomOut() {
        const newScale = Math.max(0.5, this.scale / 1.2);
        this.setScale(newScale);
      }
      
      /**
       * 适应宽度
       */
      async fitToWidth() {
        if (!this.pdf) return;
        
        const page = await this.pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.0 });
        const containerWidth = this.pdfContainer.clientWidth - 20; // 减去padding
        
        const newScale = containerWidth / viewport.width;
        this.setScale(newScale);
      }
      
      /**
       * 上一页
       */
      previousPage() {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.updatePageInfo();
          this.renderVisiblePages();
        }
      }
      
      /**
       * 下一页
       */
      nextPage() {
        if (this.currentPage < this.totalPages) {
          this.currentPage++;
          this.updatePageInfo();
          this.renderVisiblePages();
        }
      }
      
      /**
       * 滚动事件处理
       */
      onScroll() {
        // 根据滚动位置更新当前页面
        const scrollTop = this.pdfContainer.scrollTop;
        const pages = Array.from(this.pages.values());
        
        for (const canvas of pages) {
          const rect = canvas.getBoundingClientRect();
          const containerRect = this.pdfContainer.getBoundingClientRect();
          
          if (rect.top <= containerRect.top + containerRect.height / 2 &&
              rect.bottom >= containerRect.top + containerRect.height / 2) {
            const pageNum = parseInt(canvas.dataset.pageNumber);
            if (pageNum !== this.currentPage) {
              this.currentPage = pageNum;
              this.updatePageInfo();
            }
            break;
          }
        }
        
        // 显示页面信息
        this.showPageInfo();
      }
      
      /**
       * 切换工具栏显示
       */
      toggleToolbar() {
        this.toolbar.classList.toggle('visible');
        
        // 3秒后自动隐藏
        setTimeout(() => {
          this.toolbar.classList.remove('visible');
        }, 3000);
      }
      
      /**
       * 显示页面信息
       */
      showPageInfo() {
        this.pageInfo.classList.add('visible');
        
        // 2秒后隐藏
        setTimeout(() => {
          this.pageInfo.classList.remove('visible');
        }, 2000);
      }
      
      /**
       * 更新页面信息
       */
      updatePageInfo() {
        document.getElementById('currentPage').textContent = this.currentPage;
        document.getElementById('totalPages').textContent = this.totalPages;
      }
      
      /**
       * 显示/隐藏加载状态
       * @param {boolean} show - 是否显示
       */
      showLoading(show) {
        this.loading.style.display = show ? 'block' : 'none';
      }
    }
    
    // 初始化查看器
    const viewer = new MobilePDFViewer(document.querySelector('.viewer-container'));
    
    // 加载示例PDF
    viewer.loadDocument('sample.pdf');
  </script>
</body>
</html>
```

## 高级移动端功能

### 1. 预加载和缓存

```javascript
/**
 * 页面预加载管理器
 */
class PagePreloader {
  constructor(pdf, maxCacheSize = 10) {
    this.pdf = pdf;
    this.maxCacheSize = maxCacheSize;
    this.cache = new Map();
    this.preloadQueue = [];
  }
  
  /**
   * 预加载页面
   * @param {number} pageNum - 页面编号
   * @param {number} scale - 缩放比例
   */
  async preloadPage(pageNum, scale) {
    const cacheKey = `${pageNum}-${scale}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    try {
      const page = await this.pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      // 添加到缓存
      this.addToCache(cacheKey, canvas);
      
      return canvas;
      
    } catch (error) {
      console.error(`预加载页面${pageNum}失败:`, error);
      return null;
    }
  }
  
  /**
   * 添加到缓存
   * @param {string} key - 缓存键
   * @param {HTMLCanvasElement} canvas - Canvas元素
   */
  addToCache(key, canvas) {
    // 如果缓存已满，删除最旧的项
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, canvas.cloneNode(true));
  }
  
  /**
   * 获取缓存的页面
   * @param {number} pageNum - 页面编号
   * @param {number} scale - 缩放比例
   * @returns {HTMLCanvasElement|null} 缓存的Canvas
   */
  getCachedPage(pageNum, scale) {
    const cacheKey = `${pageNum}-${scale}`;
    return this.cache.get(cacheKey)?.cloneNode(true) || null;
  }
  
  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear();
  }
}
```

### 2. 虚拟滚动

```javascript
/**
 * 虚拟滚动PDF查看器
 */
class VirtualScrollViewer {
  constructor(container, pdf) {
    this.container = container;
    this.pdf = pdf;
    this.pageHeight = 800; // 估算页面高度
    this.visibleRange = { start: 0, end: 0 };
    this.renderedPages = new Map();
    
    this.setupVirtualScroll();
  }
  
  /**
   * 设置虚拟滚动
   */
  setupVirtualScroll() {
    // 创建虚拟容器
    this.virtualContainer = document.createElement('div');
    this.virtualContainer.style.height = `${this.pdf.numPages * this.pageHeight}px`;
    this.virtualContainer.style.position = 'relative';
    
    // 创建可见区域
    this.visibleArea = document.createElement('div');
    this.visibleArea.style.position = 'absolute';
    this.visibleArea.style.top = '0';
    this.visibleArea.style.width = '100%';
    
    this.virtualContainer.appendChild(this.visibleArea);
    this.container.appendChild(this.virtualContainer);
    
    // 监听滚动
    this.container.addEventListener('scroll', () => this.onVirtualScroll());
  }
  
  /**
   * 虚拟滚动处理
   */
  async onVirtualScroll() {
    const scrollTop = this.container.scrollTop;
    const containerHeight = this.container.clientHeight;
    
    // 计算可见页面范围
    const startPage = Math.floor(scrollTop / this.pageHeight);
    const endPage = Math.min(
      this.pdf.numPages - 1,
      Math.ceil((scrollTop + containerHeight) / this.pageHeight)
    );
    
    // 更新可见范围
    if (startPage !== this.visibleRange.start || endPage !== this.visibleRange.end) {
      this.visibleRange = { start: startPage, end: endPage };
      await this.updateVisiblePages();
    }
  }
  
  /**
   * 更新可见页面
   */
  async updateVisiblePages() {
    // 移除不可见页面
    for (const [pageNum, element] of this.renderedPages) {
      if (pageNum < this.visibleRange.start || pageNum > this.visibleRange.end) {
        element.remove();
        this.renderedPages.delete(pageNum);
      }
    }
    
    // 渲染新的可见页面
    for (let pageNum = this.visibleRange.start; pageNum <= this.visibleRange.end; pageNum++) {
      if (!this.renderedPages.has(pageNum)) {
        await this.renderVirtualPage(pageNum);
      }
    }
  }
  
  /**
   * 渲染虚拟页面
   * @param {number} pageNum - 页面编号（从0开始）
   */
  async renderVirtualPage(pageNum) {
    try {
      const page = await this.pdf.getPage(pageNum + 1);
      const viewport = page.getViewport({ scale: 1.0 });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.position = 'absolute';
      canvas.style.top = `${pageNum * this.pageHeight}px`;
      canvas.style.left = '50%';
      canvas.style.transform = 'translateX(-50%)';
      canvas.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      this.visibleArea.appendChild(canvas);
      this.renderedPages.set(pageNum, canvas);
      
      // 更新实际页面高度
      this.pageHeight = Math.max(this.pageHeight, viewport.height + 20);
      
    } catch (error) {
      console.error(`虚拟页面${pageNum + 1}渲染失败:`, error);
    }
  }
}
```

### 3. 性能优化

```javascript
/**
 * 移动端性能优化工具
 */
class MobileOptimizer {
  /**
   * 检测设备性能
   * @returns {Object} 设备性能信息
   */
  static detectDevicePerformance() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    const performance = {
      devicePixelRatio: window.devicePixelRatio || 1,
      hardwareConcurrency: navigator.hardwareConcurrency || 2,
      memory: navigator.deviceMemory || 4,
      webgl: !!gl,
      touchSupport: 'ontouchstart' in window
    };
    
    // 性能等级评估
    let performanceLevel = 'high';
    if (performance.memory < 2 || performance.hardwareConcurrency < 4) {
      performanceLevel = 'low';
    } else if (performance.memory < 4 || performance.hardwareConcurrency < 6) {
      performanceLevel = 'medium';
    }
    
    performance.level = performanceLevel;
    return performance;
  }
  
  /**
   * 获取优化配置
   * @param {Object} devicePerformance - 设备性能信息
   * @returns {Object} 优化配置
   */
  static getOptimizedConfig(devicePerformance) {
    const configs = {
      high: {
        maxCacheSize: 15,
        preloadPages: 3,
        renderQuality: 2.0,
        enableVirtualScroll: false,
        maxConcurrentRenders: 3
      },
      medium: {
        maxCacheSize: 10,
        preloadPages: 2,
        renderQuality: 1.5,
        enableVirtualScroll: true,
        maxConcurrentRenders: 2
      },
      low: {
        maxCacheSize: 5,
        preloadPages: 1,
        renderQuality: 1.0,
        enableVirtualScroll: true,
        maxConcurrentRenders: 1
      }
    };
    
    return configs[devicePerformance.level];
  }
  
  /**
   * 节流函数
   * @param {Function} func - 要节流的函数
   * @param {number} delay - 延迟时间
   * @returns {Function} 节流后的函数
   */
  static throttle(func, delay) {
    let timeoutId;
    let lastExecTime = 0;
    
    return function (...args) {
      const currentTime = Date.now();
      
      if (currentTime - lastExecTime > delay) {
        func.apply(this, args);
        lastExecTime = currentTime;
      } else {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func.apply(this, args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    };
  }
  
  /**
   * 防抖函数
   * @param {Function} func - 要防抖的函数
   * @param {number} delay - 延迟时间
   * @returns {Function} 防抖后的函数
   */
  static debounce(func, delay) {
    let timeoutId;
    
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }
}

// 使用示例
const devicePerf = MobileOptimizer.detectDevicePerformance();
const config = MobileOptimizer.getOptimizedConfig(devicePerf);

console.log('设备性能:', devicePerf);
console.log('优化配置:', config);
```

## 注意事项

### 1. 内存管理
- 及时清理不可见页面的Canvas元素
- 限制同时渲染的页面数量
- 使用对象池复用Canvas元素

### 2. 触摸体验
- 禁用默认的缩放手势
- 实现平滑的缩放动画
- 支持双击缩放

### 3. 性能优化
- 根据设备性能调整渲染质量
- 使用虚拟滚动处理大文档
- 实现页面预加载和缓存

### 4. 用户体验
- 提供清晰的加载状态
- 支持横屏和竖屏切换
- 实现直观的手势操作

这个移动端PDF查看器提供了完整的触摸支持、性能优化和用户体验优化，适合在移动设备上使用。