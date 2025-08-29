# PDF.js 高级功能示例

本示例展示 PDF.js 的高级功能，包括缩略图生成、书签导航、搜索高亮、页面旋转、缩放控制、打印功能等。

## 完整示例

### HTML 结构

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PDF.js 高级功能示例</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            overflow: hidden;
        }
        
        .app-container {
            display: flex;
            height: 100vh;
        }
        
        /* 侧边栏 */
        .sidebar {
            width: 300px;
            background: #2c3e50;
            color: white;
            display: flex;
            flex-direction: column;
            transition: width 0.3s ease;
        }
        
        .sidebar.collapsed {
            width: 50px;
        }
        
        .sidebar-header {
            padding: 15px;
            background: #34495e;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .sidebar-title {
            font-size: 16px;
            font-weight: bold;
        }
        
        .sidebar.collapsed .sidebar-title {
            display: none;
        }
        
        .toggle-sidebar {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 5px;
            border-radius: 3px;
        }
        
        .toggle-sidebar:hover {
            background: rgba(255, 255, 255, 0.1);
        }
        
        .sidebar-tabs {
            display: flex;
            background: #34495e;
        }
        
        .sidebar.collapsed .sidebar-tabs {
            flex-direction: column;
        }
        
        .tab-button {
            flex: 1;
            padding: 10px;
            background: none;
            border: none;
            color: #bdc3c7;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .tab-button.active {
            background: #2c3e50;
            color: white;
        }
        
        .tab-button:hover {
            background: rgba(255, 255, 255, 0.1);
        }
        
        .sidebar.collapsed .tab-button {
            writing-mode: vertical-rl;
            text-orientation: mixed;
        }
        
        .sidebar-content {
            flex: 1;
            overflow-y: auto;
            padding: 15px;
        }
        
        .sidebar.collapsed .sidebar-content {
            display: none;
        }
        
        /* 缩略图 */
        .thumbnails {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 10px;
        }
        
        .thumbnail {
            border: 2px solid transparent;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.3s ease;
            background: white;
            padding: 5px;
        }
        
        .thumbnail:hover {
            border-color: #3498db;
            transform: scale(1.05);
        }
        
        .thumbnail.active {
            border-color: #e74c3c;
        }
        
        .thumbnail canvas {
            width: 100%;
            height: auto;
            display: block;
        }
        
        .thumbnail-label {
            text-align: center;
            font-size: 12px;
            margin-top: 5px;
            color: #2c3e50;
        }
        
        /* 书签 */
        .bookmarks {
            list-style: none;
        }
        
        .bookmark-item {
            margin-bottom: 5px;
        }
        
        .bookmark-link {
            display: block;
            padding: 8px 12px;
            color: #ecf0f1;
            text-decoration: none;
            border-radius: 3px;
            transition: background 0.3s ease;
            font-size: 14px;
        }
        
        .bookmark-link:hover {
            background: rgba(255, 255, 255, 0.1);
        }
        
        .bookmark-children {
            margin-left: 20px;
            margin-top: 5px;
        }
        
        /* 搜索 */
        .search-container {
            margin-bottom: 15px;
        }
        
        .search-input {
            width: 100%;
            padding: 10px;
            border: none;
            border-radius: 5px;
            font-size: 14px;
            background: #34495e;
            color: white;
        }
        
        .search-input::placeholder {
            color: #bdc3c7;
        }
        
        .search-results {
            margin-top: 10px;
        }
        
        .search-result {
            padding: 8px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
            margin-bottom: 5px;
            cursor: pointer;
            font-size: 12px;
        }
        
        .search-result:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        
        .search-result-page {
            color: #3498db;
            font-weight: bold;
        }
        
        .search-result-text {
            margin-top: 3px;
            line-height: 1.4;
        }
        
        .search-highlight {
            background: #f39c12;
            color: #2c3e50;
            padding: 1px 2px;
            border-radius: 2px;
        }
        
        /* 主内容区 */
        .main-content {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        
        /* 工具栏 */
        .toolbar {
            background: white;
            padding: 10px 20px;
            border-bottom: 1px solid #ddd;
            display: flex;
            align-items: center;
            gap: 15px;
            flex-wrap: wrap;
        }
        
        .toolbar-group {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .toolbar-separator {
            width: 1px;
            height: 30px;
            background: #ddd;
        }
        
        .toolbar button {
            padding: 8px 12px;
            border: 1px solid #ddd;
            background: white;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s ease;
        }
        
        .toolbar button:hover {
            background: #f8f9fa;
            border-color: #007bff;
        }
        
        .toolbar button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .toolbar button.active {
            background: #007bff;
            color: white;
            border-color: #007bff;
        }
        
        .toolbar input[type="file"] {
            display: none;
        }
        
        .toolbar input[type="number"] {
            width: 60px;
            padding: 6px;
            border: 1px solid #ddd;
            border-radius: 4px;
            text-align: center;
        }
        
        .toolbar select {
            padding: 6px;
            border: 1px solid #ddd;
            border-radius: 4px;
            background: white;
        }
        
        .page-info {
            font-weight: bold;
            color: #495057;
        }
        
        .zoom-info {
            font-weight: bold;
            color: #495057;
            min-width: 60px;
            text-align: center;
        }
        
        /* PDF 查看器 */
        .pdf-viewer {
            flex: 1;
            overflow: auto;
            background: #e9ecef;
            position: relative;
        }
        
        .pdf-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px;
            min-height: 100%;
        }
        
        .pdf-page {
            margin-bottom: 20px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            background: white;
            position: relative;
        }
        
        .pdf-page canvas {
            display: block;
        }
        
        .text-layer {
            position: absolute;
            left: 0;
            top: 0;
            right: 0;
            bottom: 0;
            overflow: hidden;
            opacity: 0.2;
            line-height: 1.0;
        }
        
        .text-layer > span {
            color: transparent;
            position: absolute;
            white-space: pre;
            cursor: text;
            transform-origin: 0% 0%;
        }
        
        .text-layer .highlight {
            background: #ff6;
            color: transparent;
        }
        
        /* 加载状态 */
        .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 200px;
            color: #6c757d;
            font-size: 16px;
        }
        
        .loading::before {
            content: '';
            width: 20px;
            height: 20px;
            border: 2px solid #dee2e6;
            border-top: 2px solid #007bff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 10px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* 错误状态 */
        .error {
            color: #dc3545;
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            padding: 15px;
            border-radius: 5px;
            margin: 20px;
        }
        
        /* 响应式设计 */
        @media (max-width: 768px) {
            .sidebar {
                position: absolute;
                z-index: 1000;
                height: 100%;
                transform: translateX(-100%);
                transition: transform 0.3s ease;
            }
            
            .sidebar.open {
                transform: translateX(0);
            }
            
            .toolbar {
                padding: 8px 10px;
                gap: 8px;
            }
            
            .toolbar button {
                padding: 6px 8px;
                font-size: 12px;
            }
        }
        
        /* 打印样式 */
        @media print {
            .sidebar,
            .toolbar {
                display: none !important;
            }
            
            .main-content {
                width: 100% !important;
            }
            
            .pdf-page {
                page-break-after: always;
                margin: 0;
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="app-container">
        <!-- 侧边栏 -->
        <div class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <span class="sidebar-title">PDF 导航</span>
                <button class="toggle-sidebar" onclick="toggleSidebar()">
                    <span id="sidebar-icon">◀</span>
                </button>
            </div>
            
            <div class="sidebar-tabs">
                <button class="tab-button active" onclick="switchTab('thumbnails')">缩略图</button>
                <button class="tab-button" onclick="switchTab('bookmarks')">书签</button>
                <button class="tab-button" onclick="switchTab('search')">搜索</button>
            </div>
            
            <div class="sidebar-content">
                <!-- 缩略图标签页 -->
                <div id="thumbnails-tab" class="tab-content">
                    <div id="thumbnails" class="thumbnails">
                        <div class="loading">暂无缩略图</div>
                    </div>
                </div>
                
                <!-- 书签标签页 -->
                <div id="bookmarks-tab" class="tab-content" style="display: none;">
                    <ul id="bookmarks" class="bookmarks">
                        <li class="loading">暂无书签</li>
                    </ul>
                </div>
                
                <!-- 搜索标签页 -->
                <div id="search-tab" class="tab-content" style="display: none;">
                    <div class="search-container">
                        <input type="text" id="search-input" class="search-input" placeholder="搜索文档内容..." />
                    </div>
                    <div id="search-results" class="search-results">
                        <div class="loading">输入关键词开始搜索</div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- 主内容区 -->
        <div class="main-content">
            <!-- 工具栏 -->
            <div class="toolbar">
                <!-- 文件操作 -->
                <div class="toolbar-group">
                    <input type="file" id="file-input" accept=".pdf" />
                    <button onclick="document.getElementById('file-input').click()">打开文件</button>
                    <button onclick="loadSamplePDF()">示例文档</button>
                </div>
                
                <div class="toolbar-separator"></div>
                
                <!-- 页面导航 -->
                <div class="toolbar-group">
                    <button id="prev-page" onclick="prevPage()" disabled>上一页</button>
                    <input type="number" id="page-input" min="1" value="1" onchange="goToPage(this.value)" />
                    <span class="page-info">/ <span id="total-pages">0</span></span>
                    <button id="next-page" onclick="nextPage()" disabled>下一页</button>
                </div>
                
                <div class="toolbar-separator"></div>
                
                <!-- 缩放控制 -->
                <div class="toolbar-group">
                    <button onclick="zoomOut()">缩小</button>
                    <span class="zoom-info" id="zoom-info">100%</span>
                    <button onclick="zoomIn()">放大</button>
                    <select id="zoom-select" onchange="setZoom(this.value)">
                        <option value="auto">自适应</option>
                        <option value="page-fit">适合页面</option>
                        <option value="page-width">适合宽度</option>
                        <option value="0.5">50%</option>
                        <option value="0.75">75%</option>
                        <option value="1" selected>100%</option>
                        <option value="1.25">125%</option>
                        <option value="1.5">150%</option>
                        <option value="2">200%</option>
                    </select>
                </div>
                
                <div class="toolbar-separator"></div>
                
                <!-- 页面操作 -->
                <div class="toolbar-group">
                    <button id="rotate-left" onclick="rotatePage(-90)">逆时针旋转</button>
                    <button id="rotate-right" onclick="rotatePage(90)">顺时针旋转</button>
                </div>
                
                <div class="toolbar-separator"></div>
                
                <!-- 视图模式 -->
                <div class="toolbar-group">
                    <button id="single-page" class="active" onclick="setViewMode('single')">单页</button>
                    <button id="continuous" onclick="setViewMode('continuous')">连续</button>
                </div>
                
                <div class="toolbar-separator"></div>
                
                <!-- 其他功能 -->
                <div class="toolbar-group">
                    <button onclick="toggleFullscreen()">全屏</button>
                    <button onclick="printPDF()">打印</button>
                    <button onclick="downloadPDF()">下载</button>
                </div>
            </div>
            
            <!-- PDF 查看器 -->
            <div class="pdf-viewer" id="pdf-viewer">
                <div id="loading" class="loading">请选择 PDF 文件</div>
                <div id="error" class="error" style="display: none;"></div>
                <div id="pdf-container" class="pdf-container" style="display: none;"></div>
            </div>
        </div>
    </div>
    
    <!-- 引入 PDF.js -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
    <script>
        // 配置 PDF.js Worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        // 全局变量
        let pdfDoc = null;
        let currentPage = 1;
        let currentZoom = 1;
        let currentRotation = 0;
        let viewMode = 'single'; // 'single' 或 'continuous'
        let searchResults = [];
        let currentSearchIndex = -1;
        
        // DOM 元素
        const fileInput = document.getElementById('file-input');
        const loadingDiv = document.getElementById('loading');
        const errorDiv = document.getElementById('error');
        const pdfContainer = document.getElementById('pdf-container');
        const searchInput = document.getElementById('search-input');
        
        // 文件输入处理
        fileInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file && file.type === 'application/pdf') {
                loadPDFFromFile(file);
            } else {
                showError('请选择有效的 PDF 文件');
            }
        });
        
        // 搜索输入处理
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const query = this.value.trim();
                if (query.length >= 2) {
                    searchInPDF(query);
                } else {
                    clearSearchResults();
                }
            }, 300);
        });
        
        // 从文件加载 PDF
        function loadPDFFromFile(file) {
            const fileReader = new FileReader();
            
            fileReader.onload = function() {
                const typedArray = new Uint8Array(this.result);
                loadPDF(typedArray);
            };
            
            fileReader.readAsArrayBuffer(file);
        }
        
        // 加载示例 PDF
        function loadSamplePDF() {
            const sampleUrl = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';
            loadPDF(sampleUrl);
        }
        
        // 加载 PDF 文档
        function loadPDF(source) {
            showLoading('正在加载 PDF...');
            hideError();
            
            const loadingTask = pdfjsLib.getDocument(source);
            
            loadingTask.promise.then(function(pdf) {
                pdfDoc = pdf;
                currentPage = 1;
                currentRotation = 0;
                
                hideLoading();
                showPDFContainer();
                
                document.getElementById('total-pages').textContent = pdf.numPages;
                document.getElementById('page-input').max = pdf.numPages;
                
                renderCurrentView();
                generateThumbnails();
                loadBookmarks();
                updateControls();
                
            }).catch(function(error) {
                hideLoading();
                showError('加载 PDF 时发生错误: ' + error.message);
            });
        }
        
        // 渲染当前视图
        function renderCurrentView() {
            if (!pdfDoc) return;
            
            if (viewMode === 'single') {
                renderSinglePage(currentPage);
            } else {
                renderContinuousPages();
            }
        }
        
        // 渲染单页
        function renderSinglePage(pageNum) {
            pdfContainer.innerHTML = '';
            
            pdfDoc.getPage(pageNum).then(function(page) {
                const pageDiv = createPageElement(page, pageNum);
                pdfContainer.appendChild(pageDiv);
            }).catch(function(error) {
                showError('渲染页面时发生错误: ' + error.message);
            });
        }
        
        // 渲染连续页面
        function renderContinuousPages() {
            pdfContainer.innerHTML = '';
            
            const promises = [];
            for (let i = 1; i <= pdfDoc.numPages; i++) {
                promises.push(pdfDoc.getPage(i));
            }
            
            Promise.all(promises).then(function(pages) {
                pages.forEach(function(page, index) {
                    const pageDiv = createPageElement(page, index + 1);
                    pdfContainer.appendChild(pageDiv);
                });
            }).catch(function(error) {
                showError('渲染页面时发生错误: ' + error.message);
            });
        }
        
        // 创建页面元素
        function createPageElement(page, pageNum) {
            const pageDiv = document.createElement('div');
            pageDiv.className = 'pdf-page';
            pageDiv.setAttribute('data-page', pageNum);
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 计算视口
            const viewport = page.getViewport({ 
                scale: currentZoom,
                rotation: currentRotation
            });
            
            // 设置 Canvas 尺寸
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            // 渲染页面
            const renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };
            
            page.render(renderContext);
            
            // 创建文本层
            const textLayerDiv = document.createElement('div');
            textLayerDiv.className = 'text-layer';
            textLayerDiv.style.width = viewport.width + 'px';
            textLayerDiv.style.height = viewport.height + 'px';
            
            // 渲染文本层
            page.getTextContent().then(function(textContent) {
                pdfjsLib.renderTextLayer({
                    textContent: textContent,
                    container: textLayerDiv,
                    viewport: viewport,
                    textDivs: []
                });
            });
            
            pageDiv.appendChild(canvas);
            pageDiv.appendChild(textLayerDiv);
            
            return pageDiv;
        }
        
        // 生成缩略图
        function generateThumbnails() {
            if (!pdfDoc) return;
            
            const thumbnailsContainer = document.getElementById('thumbnails');
            thumbnailsContainer.innerHTML = '';
            
            for (let i = 1; i <= pdfDoc.numPages; i++) {
                const thumbnailDiv = document.createElement('div');
                thumbnailDiv.className = 'thumbnail';
                thumbnailDiv.setAttribute('data-page', i);
                
                if (i === currentPage) {
                    thumbnailDiv.classList.add('active');
                }
                
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                const label = document.createElement('div');
                label.className = 'thumbnail-label';
                label.textContent = `第 ${i} 页`;
                
                thumbnailDiv.appendChild(canvas);
                thumbnailDiv.appendChild(label);
                thumbnailsContainer.appendChild(thumbnailDiv);
                
                // 渲染缩略图
                pdfDoc.getPage(i).then(function(page) {
                    const viewport = page.getViewport({ scale: 0.3 });
                    
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    
                    const renderContext = {
                        canvasContext: ctx,
                        viewport: viewport
                    };
                    
                    page.render(renderContext);
                });
                
                // 点击事件
                thumbnailDiv.addEventListener('click', function() {
                    const pageNum = parseInt(this.getAttribute('data-page'));
                    goToPage(pageNum);
                });
            }
        }
        
        // 加载书签
        function loadBookmarks() {
            if (!pdfDoc) return;
            
            pdfDoc.getOutline().then(function(outline) {
                const bookmarksContainer = document.getElementById('bookmarks');
                bookmarksContainer.innerHTML = '';
                
                if (!outline || outline.length === 0) {
                    bookmarksContainer.innerHTML = '<li class="loading">此文档没有书签</li>';
                    return;
                }
                
                outline.forEach(function(item) {
                    const bookmarkItem = createBookmarkItem(item);
                    bookmarksContainer.appendChild(bookmarkItem);
                });
            }).catch(function(error) {
                console.error('加载书签时发生错误:', error);
            });
        }
        
        // 创建书签项
        function createBookmarkItem(item) {
            const li = document.createElement('li');
            li.className = 'bookmark-item';
            
            const link = document.createElement('a');
            link.className = 'bookmark-link';
            link.textContent = item.title;
            link.href = '#';
            
            // 处理书签点击
            link.addEventListener('click', function(event) {
                event.preventDefault();
                
                if (item.dest) {
                    navigateToDestination(item.dest);
                }
            });
            
            li.appendChild(link);
            
            // 处理子书签
            if (item.items && item.items.length > 0) {
                const childrenUl = document.createElement('ul');
                childrenUl.className = 'bookmark-children';
                
                item.items.forEach(function(childItem) {
                    const childBookmark = createBookmarkItem(childItem);
                    childrenUl.appendChild(childBookmark);
                });
                
                li.appendChild(childrenUl);
            }
            
            return li;
        }
        
        // 导航到目标位置
        function navigateToDestination(dest) {
            if (!pdfDoc) return;
            
            pdfDoc.getDestination(dest).then(function(destination) {
                if (destination) {
                    pdfDoc.getPageIndex(destination[0]).then(function(pageIndex) {
                        const pageNum = pageIndex + 1;
                        goToPage(pageNum);
                    });
                }
            }).catch(function(error) {
                console.error('导航到目标位置时发生错误:', error);
            });
        }
        
        // 在 PDF 中搜索
        function searchInPDF(query) {
            if (!pdfDoc) return;
            
            showSearchLoading();
            searchResults = [];
            currentSearchIndex = -1;
            
            const promises = [];
            
            for (let i = 1; i <= pdfDoc.numPages; i++) {
                promises.push(
                    pdfDoc.getPage(i).then(function(page) {
                        return page.getTextContent().then(function(textContent) {
                            const pageText = textContent.items.map(item => item.str).join(' ');
                            const matches = findTextMatches(pageText, query);
                            
                            return {
                                pageNum: i,
                                matches: matches,
                                text: pageText
                            };
                        });
                    })
                );
            }
            
            Promise.all(promises).then(function(pages) {
                pages.forEach(function(page) {
                    if (page.matches.length > 0) {
                        page.matches.forEach(function(match) {
                            searchResults.push({
                                pageNum: page.pageNum,
                                text: page.text,
                                match: match
                            });
                        });
                    }
                });
                
                displaySearchResults(query);
            }).catch(function(error) {
                showSearchError('搜索时发生错误: ' + error.message);
            });
        }
        
        // 查找文本匹配
        function findTextMatches(text, query) {
            const matches = [];
            const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            let match;
            
            while ((match = regex.exec(text)) !== null) {
                matches.push({
                    index: match.index,
                    text: match[0],
                    context: getContext(text, match.index, 50)
                });
            }
            
            return matches;
        }
        
        // 获取上下文
        function getContext(text, index, contextLength) {
            const start = Math.max(0, index - contextLength);
            const end = Math.min(text.length, index + contextLength);
            return text.substring(start, end);
        }
        
        // 显示搜索结果
        function displaySearchResults(query) {
            const resultsContainer = document.getElementById('search-results');
            resultsContainer.innerHTML = '';
            
            if (searchResults.length === 0) {
                resultsContainer.innerHTML = '<div class="loading">未找到匹配结果</div>';
                return;
            }
            
            searchResults.forEach(function(result, index) {
                const resultDiv = document.createElement('div');
                resultDiv.className = 'search-result';
                
                const pageSpan = document.createElement('div');
                pageSpan.className = 'search-result-page';
                pageSpan.textContent = `第 ${result.pageNum} 页`;
                
                const textDiv = document.createElement('div');
                textDiv.className = 'search-result-text';
                textDiv.innerHTML = highlightText(result.match.context, query);
                
                resultDiv.appendChild(pageSpan);
                resultDiv.appendChild(textDiv);
                
                // 点击事件
                resultDiv.addEventListener('click', function() {
                    goToPage(result.pageNum);
                    highlightSearchResult(result);
                });
                
                resultsContainer.appendChild(resultDiv);
            });
        }
        
        // 高亮文本
        function highlightText(text, query) {
            const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            return text.replace(regex, '<span class="search-highlight">$1</span>');
        }
        
        // 高亮搜索结果
        function highlightSearchResult(result) {
            // 这里可以在页面上高亮显示搜索结果
            // 由于 PDF.js 的文本层实现复杂，这里只是示例
            console.log('高亮搜索结果:', result);
        }
        
        // 页面导航
        function goToPage(pageNum) {
            if (!pdfDoc) return;
            
            pageNum = parseInt(pageNum);
            if (pageNum < 1 || pageNum > pdfDoc.numPages) return;
            
            currentPage = pageNum;
            
            if (viewMode === 'single') {
                renderSinglePage(currentPage);
            } else {
                // 连续模式下滚动到指定页面
                const pageElement = document.querySelector(`[data-page="${pageNum}"]`);
                if (pageElement) {
                    pageElement.scrollIntoView({ behavior: 'smooth' });
                }
            }
            
            updateControls();
            updateThumbnailSelection();
        }
        
        function prevPage() {
            if (currentPage > 1) {
                goToPage(currentPage - 1);
            }
        }
        
        function nextPage() {
            if (pdfDoc && currentPage < pdfDoc.numPages) {
                goToPage(currentPage + 1);
            }
        }
        
        // 缩放控制
        function zoomIn() {
            setZoom(currentZoom * 1.25);
        }
        
        function zoomOut() {
            setZoom(currentZoom / 1.25);
        }
        
        function setZoom(zoom) {
            if (typeof zoom === 'string') {
                switch (zoom) {
                    case 'auto':
                        zoom = calculateAutoZoom();
                        break;
                    case 'page-fit':
                        zoom = calculatePageFitZoom();
                        break;
                    case 'page-width':
                        zoom = calculatePageWidthZoom();
                        break;
                    default:
                        zoom = parseFloat(zoom);
                }
            }
            
            zoom = Math.max(0.1, Math.min(5, zoom));
            currentZoom = zoom;
            
            renderCurrentView();
            updateZoomInfo();
        }
        
        function calculateAutoZoom() {
            // 自动计算合适的缩放比例
            return 1;
        }
        
        function calculatePageFitZoom() {
            // 计算适合页面的缩放比例
            if (!pdfDoc) return 1;
            
            const viewerWidth = document.getElementById('pdf-viewer').clientWidth - 40;
            const viewerHeight = document.getElementById('pdf-viewer').clientHeight - 40;
            
            // 这里需要获取页面的原始尺寸来计算
            return Math.min(viewerWidth / 600, viewerHeight / 800); // 假设页面尺寸
        }
        
        function calculatePageWidthZoom() {
            // 计算适合宽度的缩放比例
            if (!pdfDoc) return 1;
            
            const viewerWidth = document.getElementById('pdf-viewer').clientWidth - 40;
            return viewerWidth / 600; // 假设页面宽度
        }
        
        // 页面旋转
        function rotatePage(degrees) {
            currentRotation = (currentRotation + degrees) % 360;
            if (currentRotation < 0) currentRotation += 360;
            
            renderCurrentView();
        }
        
        // 视图模式
        function setViewMode(mode) {
            viewMode = mode;
            
            // 更新按钮状态
            document.getElementById('single-page').classList.toggle('active', mode === 'single');
            document.getElementById('continuous').classList.toggle('active', mode === 'continuous');
            
            renderCurrentView();
        }
        
        // 全屏
        function toggleFullscreen() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        }
        
        // 打印
        function printPDF() {
            window.print();
        }
        
        // 下载
        function downloadPDF() {
            if (!pdfDoc) return;
            
            // 这里需要保存原始 PDF 数据
            const link = document.createElement('a');
            link.download = 'document.pdf';
            // link.href = URL.createObjectURL(pdfBlob);
            // link.click();
            
            console.log('下载功能需要保存原始 PDF 数据');
        }
        
        // 侧边栏控制
        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            const icon = document.getElementById('sidebar-icon');
            
            sidebar.classList.toggle('collapsed');
            icon.textContent = sidebar.classList.contains('collapsed') ? '▶' : '◀';
        }
        
        // 标签页切换
        function switchTab(tabName) {
            // 更新按钮状态
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');
            
            // 显示对应内容
            document.querySelectorAll('.tab-content').forEach(content => {
                content.style.display = 'none';
            });
            document.getElementById(tabName + '-tab').style.display = 'block';
        }
        
        // 更新控件状态
        function updateControls() {
            if (!pdfDoc) return;
            
            document.getElementById('page-input').value = currentPage;
            document.getElementById('prev-page').disabled = (currentPage <= 1);
            document.getElementById('next-page').disabled = (currentPage >= pdfDoc.numPages);
        }
        
        function updateZoomInfo() {
            document.getElementById('zoom-info').textContent = Math.round(currentZoom * 100) + '%';
            document.getElementById('zoom-select').value = currentZoom;
        }
        
        function updateThumbnailSelection() {
            document.querySelectorAll('.thumbnail').forEach(thumb => {
                thumb.classList.remove('active');
            });
            
            const currentThumbnail = document.querySelector(`[data-page="${currentPage}"]`);
            if (currentThumbnail) {
                currentThumbnail.classList.add('active');
            }
        }
        
        // 辅助函数
        function showLoading(message) {
            loadingDiv.textContent = message;
            loadingDiv.style.display = 'flex';
            pdfContainer.style.display = 'none';
        }
        
        function hideLoading() {
            loadingDiv.style.display = 'none';
        }
        
        function showPDFContainer() {
            pdfContainer.style.display = 'block';
        }
        
        function showError(message) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
        
        function hideError() {
            errorDiv.style.display = 'none';
        }
        
        function showSearchLoading() {
            document.getElementById('search-results').innerHTML = '<div class="loading">正在搜索...</div>';
        }
        
        function showSearchError(message) {
            document.getElementById('search-results').innerHTML = `<div class="error">${message}</div>`;
        }
        
        function clearSearchResults() {
            document.getElementById('search-results').innerHTML = '<div class="loading">输入关键词开始搜索</div>';
            searchResults = [];
            currentSearchIndex = -1;
        }
        
        // 键盘快捷键
        document.addEventListener('keydown', function(event) {
            if (!pdfDoc) return;
            
            switch(event.key) {
                case 'ArrowLeft':
                case 'ArrowUp':
                    if (!event.target.matches('input, textarea')) {
                        event.preventDefault();
                        prevPage();
                    }
                    break;
                case 'ArrowRight':
                case 'ArrowDown':
                    if (!event.target.matches('input, textarea')) {
                        event.preventDefault();
                        nextPage();
                    }
                    break;
                case '+':
                case '=':
                    if (event.ctrlKey) {
                        event.preventDefault();
                        zoomIn();
                    }
                    break;
                case '-':
                    if (event.ctrlKey) {
                        event.preventDefault();
                        zoomOut();
                    }
                    break;
                case 'f':
                    if (event.ctrlKey) {
                        event.preventDefault();
                        searchInput.focus();
                    }
                    break;
                case 'F11':
                    event.preventDefault();
                    toggleFullscreen();
                    break;
            }
        });
        
        // 初始化
        updateZoomInfo();
    </script>
</body>
</html>
```

## 核心功能说明

### 1. 缩略图生成

```javascript
// 生成页面缩略图
function generateThumbnail(page, scale = 0.3) {
    const viewport = page.getViewport({ scale: scale });
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    const renderContext = {
        canvasContext: ctx,
        viewport: viewport
    };
    
    return page.render(renderContext).promise.then(() => {
        return canvas;
    });
}
```

### 2. 书签导航

```javascript
// 获取文档大纲
pdfDoc.getOutline().then(function(outline) {
    if (outline) {
        outline.forEach(function(item) {
            console.log({
                title: item.title,      // 书签标题
                dest: item.dest,        // 目标位置
                url: item.url,          // 外部链接
                items: item.items       // 子书签
            });
        });
    }
});

// 导航到书签位置
function navigateToBookmark(dest) {
    pdfDoc.getDestination(dest).then(function(destination) {
        if (destination) {
            pdfDoc.getPageIndex(destination[0]).then(function(pageIndex) {
                goToPage(pageIndex + 1);
            });
        }
    });
}
```

### 3. 文本搜索

```javascript
// 搜索文本内容
function searchText(query) {
    const results = [];
    
    for (let i = 1; i <= pdfDoc.numPages; i++) {
        pdfDoc.getPage(i).then(function(page) {
            return page.getTextContent();
        }).then(function(textContent) {
            const pageText = textContent.items.map(item => item.str).join(' ');
            
            // 查找匹配
            const regex = new RegExp(query, 'gi');
            let match;
            
            while ((match = regex.exec(pageText)) !== null) {
                results.push({
                    pageNum: i,
                    index: match.index,
                    text: match[0],
                    context: getContext(pageText, match.index)
                });
            }
        });
    }
    
    return results;
}
```

### 4. 页面旋转

```javascript
// 旋转页面
function rotatePage(degrees) {
    const viewport = page.getViewport({ 
        scale: currentZoom,
        rotation: currentRotation + degrees
    });
    
    // 重新渲染页面
    const renderContext = {
        canvasContext: ctx,
        viewport: viewport
    };
    
    page.render(renderContext);
}
```

### 5. 缩放控制

```javascript
// 智能缩放
function calculateOptimalZoom() {
    const viewerWidth = pdfViewer.clientWidth;
    const viewerHeight = pdfViewer.clientHeight;
    
    return pdfDoc.getPage(1).then(function(page) {
        const viewport = page.getViewport({ scale: 1 });
        
        const scaleX = (viewerWidth - 40) / viewport.width;
        const scaleY = (viewerHeight - 40) / viewport.height;
        
        return Math.min(scaleX, scaleY);
    });
}
```

## 高级功能

### 1. 多页面视图

```javascript
// 连续页面模式
function renderContinuousView() {
    const container = document.getElementById('pdf-container');
    container.innerHTML = '';
    
    const promises = [];
    for (let i = 1; i <= pdfDoc.numPages; i++) {
        promises.push(pdfDoc.getPage(i));
    }
    
    Promise.all(promises).then(function(pages) {
        pages.forEach(function(page, index) {
            const pageDiv = createPageElement(page, index + 1);
            container.appendChild(pageDiv);
        });
    });
}
```

### 2. 文本层渲染

```javascript
// 渲染可选择的文本层
function renderTextLayer(page, viewport, container) {
    return page.getTextContent().then(function(textContent) {
        const textLayerDiv = document.createElement('div');
        textLayerDiv.className = 'textLayer';
        
        return pdfjsLib.renderTextLayer({
            textContent: textContent,
            container: textLayerDiv,
            viewport: viewport,
            textDivs: []
        }).promise.then(function() {
            container.appendChild(textLayerDiv);
        });
    });
}
```

### 3. 性能优化

```javascript
// 虚拟滚动优化
class VirtualScroller {
    constructor(container, itemHeight) {
        this.container = container;
        this.itemHeight = itemHeight;
        this.visibleItems = Math.ceil(container.clientHeight / itemHeight) + 2;
        this.scrollTop = 0;
        
        this.setupScrollListener();
    }
    
    setupScrollListener() {
        this.container.addEventListener('scroll', () => {
            this.scrollTop = this.container.scrollTop;
            this.updateVisibleItems();
        });
    }
    
    updateVisibleItems() {
        const startIndex = Math.floor(this.scrollTop / this.itemHeight);
        const endIndex = Math.min(startIndex + this.visibleItems, this.totalItems);
        
        // 只渲染可见的页面
        this.renderVisiblePages(startIndex, endIndex);
    }
}
```

## 功能特性

- ✅ 缩略图导航和预览
- ✅ 书签大纲导航
- ✅ 全文搜索和高亮
- ✅ 页面旋转和缩放
- ✅ 多种视图模式（单页/连续）
- ✅ 全屏显示
- ✅ 打印功能
- ✅ 键盘快捷键
- ✅ 响应式设计
- ✅ 性能优化

## 注意事项

### 1. 内存管理

- 及时清理不需要的 Canvas 元素
- 使用虚拟滚动处理大文档
- 限制同时渲染的页面数量

### 2. 性能优化

- 缩略图使用较小的缩放比例
- 延迟加载非可见页面
- 缓存已渲染的页面

### 3. 浏览器兼容性

- 现代浏览器支持
- 移动端适配
- 触摸手势支持

## 相关示例

- [基础渲染](./basic-rendering.md) - PDF基础渲染功能
- [文本提取](./text-extraction.md) - 文本内容提取
- [注释处理](./annotations.md) - 注释和标记处理
- [表单处理](./forms.md) - PDF表单处理

## API 参考

- [PDFDocumentProxy](../api/pdf-document-proxy.md) - 文档代理对象
- [PDFPageProxy](../api/pdf-page-proxy.md) - 页面代理对象
- [文本层渲染](../api/text-layer.md) - 文本层API