# PDF 注释处理

本示例展示如何使用 PDF.js 处理 PDF 文档中的注释，包括注释显示、交互处理、注释编辑和自定义注释层等功能。

## 完整示例

### HTML 结构

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PDF.js 注释处理示例</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: 1fr 350px;
            gap: 20px;
        }
        
        .pdf-viewer {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .annotation-panel {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-height: 800px;
            overflow-y: auto;
        }
        
        .controls {
            margin-bottom: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 5px;
        }
        
        .controls button {
            margin-right: 10px;
            margin-bottom: 5px;
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            background: #007bff;
            color: white;
            cursor: pointer;
        }
        
        .controls button:hover {
            background: #0056b3;
        }
        
        .controls button:disabled {
            background: #6c757d;
            cursor: not-allowed;
        }
        
        .controls button.active {
            background: #28a745;
        }
        
        .page-info {
            margin: 0 15px;
            font-weight: bold;
        }
        
        .annotation-mode {
            margin-top: 10px;
            display: flex;
            gap: 10px;
            align-items: center;
        }
        
        .annotation-mode label {
            font-weight: bold;
        }
        
        .annotation-mode select {
            padding: 5px;
            border-radius: 3px;
            border: 1px solid #ddd;
        }
        
        #pdf-container {
            position: relative;
            display: inline-block;
            margin: 20px auto;
        }
        
        #pdf-canvas {
            display: block;
            border: 1px solid #ddd;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .annotation-layer {
            position: absolute;
            left: 0;
            top: 0;
            right: 0;
            bottom: 0;
            overflow: hidden;
            pointer-events: none;
        }
        
        .annotation-layer > section {
            position: absolute;
            pointer-events: auto;
        }
        
        /* 注释样式 */
        .linkAnnotation {
            border: 2px solid transparent;
            cursor: pointer;
        }
        
        .linkAnnotation:hover {
            border-color: #007bff;
            background-color: rgba(0, 123, 255, 0.1);
        }
        
        .textAnnotation {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 3px;
            padding: 2px;
            cursor: pointer;
        }
        
        .highlightAnnotation {
            background-color: rgba(255, 255, 0, 0.3);
            border-radius: 2px;
        }
        
        .underlineAnnotation {
            border-bottom: 2px solid #ff6b6b;
        }
        
        .strikeoutAnnotation {
            position: relative;
        }
        
        .strikeoutAnnotation::after {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            right: 0;
            height: 2px;
            background-color: #ff6b6b;
        }
        
        .squigglyAnnotation {
            border-bottom: 2px wavy #ff6b6b;
        }
        
        .freeTextAnnotation {
            background-color: #e3f2fd;
            border: 1px solid #2196f3;
            border-radius: 3px;
            padding: 4px;
            font-size: 12px;
        }
        
        .annotation-popup {
            position: absolute;
            background: white;
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-width: 300px;
            z-index: 1000;
            display: none;
        }
        
        .annotation-popup.show {
            display: block;
        }
        
        .annotation-popup .title {
            font-weight: bold;
            margin-bottom: 5px;
            color: #333;
        }
        
        .annotation-popup .content {
            color: #666;
            font-size: 14px;
            line-height: 1.4;
        }
        
        .annotation-popup .close {
            position: absolute;
            top: 5px;
            right: 8px;
            cursor: pointer;
            color: #999;
            font-size: 16px;
        }
        
        .annotation-list {
            margin-top: 15px;
        }
        
        .annotation-item {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            padding: 10px;
            margin-bottom: 10px;
            cursor: pointer;
        }
        
        .annotation-item:hover {
            background: #e9ecef;
        }
        
        .annotation-item.active {
            border-color: #007bff;
            background: #e3f2fd;
        }
        
        .annotation-item .type {
            font-weight: bold;
            color: #007bff;
            font-size: 12px;
            text-transform: uppercase;
        }
        
        .annotation-item .content {
            margin-top: 5px;
            font-size: 14px;
            color: #333;
        }
        
        .annotation-item .position {
            margin-top: 5px;
            font-size: 12px;
            color: #666;
        }
        
        .annotation-stats {
            background: #e9ecef;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 15px;
            font-size: 14px;
        }
        
        .annotation-stats span {
            display: inline-block;
            margin-right: 15px;
        }
        
        .loading {
            text-align: center;
            padding: 40px;
            color: #666;
        }
        
        .error {
            color: #dc3545;
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        
        @media (max-width: 1200px) {
            .container {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- PDF 查看器 -->
        <div class="pdf-viewer">
            <h1>PDF 注释处理示例</h1>
            
            <!-- 文件选择 -->
            <div class="controls">
                <input type="file" id="file-input" accept=".pdf" />
                <button onclick="loadSamplePDF()">加载示例PDF</button>
                
                <!-- 页面控制 -->
                <div style="margin-top: 10px;">
                    <button id="prev-page" onclick="prevPage()">上一页</button>
                    <span class="page-info">
                        第 <span id="current-page">1</span> 页，共 <span id="total-pages">0</span> 页
                    </span>
                    <button id="next-page" onclick="nextPage()">下一页</button>
                </div>
                
                <!-- 注释模式 -->
                <div class="annotation-mode">
                    <label for="annotation-mode-select">注释模式:</label>
                    <select id="annotation-mode-select" onchange="changeAnnotationMode()">
                        <option value="0">禁用注释</option>
                        <option value="1">启用注释</option>
                        <option value="2" selected>启用表单</option>
                        <option value="3">启用存储</option>
                    </select>
                    
                    <button id="toggle-annotations" onclick="toggleAnnotations()" class="active">显示注释</button>
                    <button onclick="exportAnnotations()">导出注释</button>
                </div>
            </div>
            
            <!-- 错误信息 -->
            <div id="error-message" class="error" style="display: none;"></div>
            
            <!-- PDF 渲染区域 -->
            <div id="loading" class="loading">请选择或加载 PDF 文件</div>
            <div id="pdf-container" style="display: none;">
                <canvas id="pdf-canvas"></canvas>
                <div id="annotation-layer" class="annotation-layer"></div>
            </div>
            
            <!-- 注释弹窗 -->
            <div id="annotation-popup" class="annotation-popup">
                <span class="close" onclick="hideAnnotationPopup()">&times;</span>
                <div class="title"></div>
                <div class="content"></div>
            </div>
        </div>
        
        <!-- 注释面板 -->
        <div class="annotation-panel">
            <h2>注释信息</h2>
            
            <!-- 注释统计 -->
            <div id="annotation-stats" class="annotation-stats" style="display: none;">
                <span>总数: <strong id="total-annotations">0</strong></span>
                <span>链接: <strong id="link-count">0</strong></span>
                <span>文本: <strong id="text-count">0</strong></span>
                <span>高亮: <strong id="highlight-count">0</strong></span>
            </div>
            
            <!-- 控制按钮 -->
            <div class="controls">
                <button onclick="loadCurrentPageAnnotations()">加载当前页注释</button>
                <button onclick="loadAllAnnotations()">加载全部注释</button>
                <button onclick="clearAnnotationList()">清空列表</button>
            </div>
            
            <!-- 注释列表 -->
            <div id="annotation-list" class="annotation-list">
                <div class="loading">暂无注释数据</div>
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
        let currentPageProxy = null;
        let annotationMode = pdfjsLib.AnnotationMode.ENABLE_FORMS;
        let showAnnotations = true;
        let allAnnotations = [];
        let currentAnnotations = [];
        
        // DOM 元素
        const canvas = document.getElementById('pdf-canvas');
        const ctx = canvas.getContext('2d');
        const annotationLayer = document.getElementById('annotation-layer');
        const fileInput = document.getElementById('file-input');
        const loadingDiv = document.getElementById('loading');
        const errorDiv = document.getElementById('error-message');
        const pdfContainer = document.getElementById('pdf-container');
        const annotationPopup = document.getElementById('annotation-popup');
        
        // 文件输入处理
        fileInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file && file.type === 'application/pdf') {
                loadPDFFromFile(file);
            } else {
                showError('请选择有效的 PDF 文件');
            }
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
            const samplePdfUrl = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';
            loadPDF(samplePdfUrl);
        }
        
        // 加载 PDF 文档
        function loadPDF(source) {
            showLoading('正在加载 PDF...');
            hideError();
            
            const loadingTask = pdfjsLib.getDocument(source);
            
            loadingTask.promise.then(function(pdf) {
                pdfDoc = pdf;
                currentPage = 1;
                allAnnotations = [];
                
                hideLoading();
                showPDFContainer();
                
                document.getElementById('total-pages').textContent = pdf.numPages;
                
                renderPage(currentPage);
                updatePageControls();
                
            }).catch(function(error) {
                hideLoading();
                showError('加载 PDF 时发生错误: ' + error.message);
            });
        }
        
        // 渲染指定页面
        function renderPage(pageNum) {
            if (!pdfDoc) return;
            
            showLoading('正在渲染页面...');
            
            pdfDoc.getPage(pageNum).then(function(page) {
                currentPageProxy = page;
                
                const scale = 1.5;
                const viewport = page.getViewport({ scale: scale });
                
                // 设置 Canvas 尺寸
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                // 设置注释层尺寸
                annotationLayer.style.width = viewport.width + 'px';
                annotationLayer.style.height = viewport.height + 'px';
                
                // 渲染页面
                const renderContext = {
                    canvasContext: ctx,
                    viewport: viewport
                };
                
                const renderTask = page.render(renderContext);
                
                // 同时渲染注释层
                if (showAnnotations) {
                    renderAnnotationLayer(page, viewport);
                }
                
                return renderTask.promise;
                
            }).then(function() {
                hideLoading();
                
            }).catch(function(error) {
                hideLoading();
                showError('渲染页面时发生错误: ' + error.message);
            });
        }
        
        // 渲染注释层
        function renderAnnotationLayer(page, viewport) {
            page.getAnnotations({ intent: 'display' }).then(function(annotations) {
                currentAnnotations = annotations;
                
                // 清空注释层
                annotationLayer.innerHTML = '';
                
                if (!showAnnotations || annotations.length === 0) {
                    return;
                }
                
                // 创建注释元素
                annotations.forEach(function(annotation, index) {
                    const annotationElement = createAnnotationElement(annotation, viewport, index);
                    if (annotationElement) {
                        annotationLayer.appendChild(annotationElement);
                    }
                });
                
                updateAnnotationStats();
            }).catch(function(error) {
                console.error('渲染注释层时发生错误:', error);
            });
        }
        
        // 创建注释元素
        function createAnnotationElement(annotation, viewport, index) {
            if (!annotation.rect || annotation.rect.length < 4) {
                return null;
            }
            
            const rect = annotation.rect;
            const element = document.createElement('section');
            
            // 计算位置和尺寸
            const left = Math.min(rect[0], rect[2]);
            const top = viewport.height - Math.max(rect[1], rect[3]);
            const width = Math.abs(rect[2] - rect[0]);
            const height = Math.abs(rect[3] - rect[1]);
            
            element.style.left = left + 'px';
            element.style.top = top + 'px';
            element.style.width = width + 'px';
            element.style.height = height + 'px';
            
            // 设置注释类型样式
            const annotationType = annotation.subtype || 'unknown';
            element.className = annotationType + 'Annotation';
            element.setAttribute('data-annotation-id', annotation.id || index);
            element.setAttribute('data-annotation-type', annotationType);
            
            // 添加内容
            if (annotation.contents) {
                element.title = annotation.contents;
            }
            
            // 处理不同类型的注释
            switch (annotationType) {
                case 'Link':
                    handleLinkAnnotation(element, annotation);
                    break;
                case 'Text':
                    handleTextAnnotation(element, annotation);
                    break;
                case 'Highlight':
                    handleHighlightAnnotation(element, annotation);
                    break;
                case 'Underline':
                    handleUnderlineAnnotation(element, annotation);
                    break;
                case 'StrikeOut':
                    handleStrikeOutAnnotation(element, annotation);
                    break;
                case 'Squiggly':
                    handleSquigglyAnnotation(element, annotation);
                    break;
                case 'FreeText':
                    handleFreeTextAnnotation(element, annotation);
                    break;
                default:
                    handleGenericAnnotation(element, annotation);
            }
            
            // 添加点击事件
            element.addEventListener('click', function(event) {
                event.preventDefault();
                showAnnotationPopup(annotation, event.pageX, event.pageY);
                highlightAnnotationInList(index);
            });
            
            return element;
        }
        
        // 处理链接注释
        function handleLinkAnnotation(element, annotation) {
            if (annotation.url) {
                element.addEventListener('click', function(event) {
                    event.stopPropagation();
                    if (confirm('是否要打开链接: ' + annotation.url)) {
                        window.open(annotation.url, '_blank');
                    }
                });
            } else if (annotation.dest) {
                element.addEventListener('click', function(event) {
                    event.stopPropagation();
                    // 处理内部链接
                    console.log('内部链接目标:', annotation.dest);
                });
            }
        }
        
        // 处理文本注释
        function handleTextAnnotation(element, annotation) {
            if (annotation.contents) {
                element.textContent = '📝';
            }
        }
        
        // 处理高亮注释
        function handleHighlightAnnotation(element, annotation) {
            // 高亮注释通常是透明的，只需要背景色
        }
        
        // 处理下划线注释
        function handleUnderlineAnnotation(element, annotation) {
            // 下划线样式已在 CSS 中定义
        }
        
        // 处理删除线注释
        function handleStrikeOutAnnotation(element, annotation) {
            // 删除线样式已在 CSS 中定义
        }
        
        // 处理波浪线注释
        function handleSquigglyAnnotation(element, annotation) {
            // 波浪线样式已在 CSS 中定义
        }
        
        // 处理自由文本注释
        function handleFreeTextAnnotation(element, annotation) {
            if (annotation.contents) {
                element.textContent = annotation.contents;
            }
        }
        
        // 处理通用注释
        function handleGenericAnnotation(element, annotation) {
            if (annotation.contents) {
                element.textContent = annotation.contents.substring(0, 20) + '...';
            }
        }
        
        // 显示注释弹窗
        function showAnnotationPopup(annotation, x, y) {
            const popup = annotationPopup;
            const title = popup.querySelector('.title');
            const content = popup.querySelector('.content');
            
            title.textContent = getAnnotationTypeDisplayName(annotation.subtype || 'Unknown');
            
            let contentText = '';
            if (annotation.contents) {
                contentText += annotation.contents;
            }
            if (annotation.url) {
                contentText += '\n链接: ' + annotation.url;
            }
            if (annotation.dest) {
                contentText += '\n目标: ' + JSON.stringify(annotation.dest);
            }
            
            content.textContent = contentText || '无内容';
            
            // 设置位置
            popup.style.left = Math.min(x, window.innerWidth - 320) + 'px';
            popup.style.top = Math.min(y, window.innerHeight - 200) + 'px';
            
            popup.classList.add('show');
        }
        
        // 隐藏注释弹窗
        function hideAnnotationPopup() {
            annotationPopup.classList.remove('show');
        }
        
        // 获取注释类型显示名称
        function getAnnotationTypeDisplayName(type) {
            const typeNames = {
                'Link': '链接',
                'Text': '文本注释',
                'Highlight': '高亮',
                'Underline': '下划线',
                'StrikeOut': '删除线',
                'Squiggly': '波浪线',
                'FreeText': '自由文本',
                'Note': '便签',
                'Stamp': '印章',
                'Ink': '手绘',
                'Square': '矩形',
                'Circle': '圆形',
                'Polygon': '多边形',
                'Line': '直线'
            };
            
            return typeNames[type] || type;
        }
        
        // 加载当前页注释
        function loadCurrentPageAnnotations() {
            if (!currentPageProxy) {
                showError('请先加载 PDF 文档');
                return;
            }
            
            currentPageProxy.getAnnotations({ intent: 'display' }).then(function(annotations) {
                displayAnnotationList(annotations, currentPage);
            }).catch(function(error) {
                showError('加载注释时发生错误: ' + error.message);
            });
        }
        
        // 加载全部注释
        function loadAllAnnotations() {
            if (!pdfDoc) {
                showError('请先加载 PDF 文档');
                return;
            }
            
            showLoading('正在加载全部注释...');
            
            const promises = [];
            
            for (let i = 1; i <= pdfDoc.numPages; i++) {
                promises.push(
                    pdfDoc.getPage(i).then(function(page) {
                        return page.getAnnotations({ intent: 'display' }).then(function(annotations) {
                            return {
                                pageNum: i,
                                annotations: annotations
                            };
                        });
                    })
                );
            }
            
            Promise.all(promises).then(function(pages) {
                allAnnotations = [];
                pages.forEach(function(page) {
                    page.annotations.forEach(function(annotation) {
                        annotation.pageNum = page.pageNum;
                        allAnnotations.push(annotation);
                    });
                });
                
                displayAnnotationList(allAnnotations);
                hideLoading();
            }).catch(function(error) {
                hideLoading();
                showError('加载全部注释时发生错误: ' + error.message);
            });
        }
        
        // 显示注释列表
        function displayAnnotationList(annotations, pageNum = null) {
            const listContainer = document.getElementById('annotation-list');
            listContainer.innerHTML = '';
            
            if (annotations.length === 0) {
                listContainer.innerHTML = '<div class="loading">暂无注释数据</div>';
                return;
            }
            
            annotations.forEach(function(annotation, index) {
                const item = document.createElement('div');
                item.className = 'annotation-item';
                item.setAttribute('data-annotation-index', index);
                
                const type = document.createElement('div');
                type.className = 'type';
                type.textContent = getAnnotationTypeDisplayName(annotation.subtype || 'Unknown');
                
                const content = document.createElement('div');
                content.className = 'content';
                content.textContent = annotation.contents || annotation.url || '无内容';
                
                const position = document.createElement('div');
                position.className = 'position';
                const pageText = pageNum ? `第 ${pageNum} 页` : `第 ${annotation.pageNum || '?'} 页`;
                position.textContent = `${pageText} - 位置: (${Math.round(annotation.rect[0])}, ${Math.round(annotation.rect[1])})`;
                
                item.appendChild(type);
                item.appendChild(content);
                item.appendChild(position);
                
                // 添加点击事件
                item.addEventListener('click', function() {
                    if (annotation.pageNum && annotation.pageNum !== currentPage) {
                        currentPage = annotation.pageNum;
                        renderPage(currentPage);
                        updatePageControls();
                    }
                    
                    highlightAnnotationInList(index);
                    
                    // 显示注释详情
                    setTimeout(function() {
                        const annotationElements = annotationLayer.querySelectorAll('[data-annotation-id]');
                        if (annotationElements[index]) {
                            annotationElements[index].click();
                        }
                    }, 500);
                });
                
                listContainer.appendChild(item);
            });
        }
        
        // 高亮注释列表项
        function highlightAnnotationInList(index) {
            const items = document.querySelectorAll('.annotation-item');
            items.forEach(function(item) {
                item.classList.remove('active');
            });
            
            const targetItem = document.querySelector(`[data-annotation-index="${index}"]`);
            if (targetItem) {
                targetItem.classList.add('active');
                targetItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
        
        // 更新注释统计
        function updateAnnotationStats() {
            const stats = {
                total: currentAnnotations.length,
                link: 0,
                text: 0,
                highlight: 0
            };
            
            currentAnnotations.forEach(function(annotation) {
                const type = annotation.subtype;
                if (type === 'Link') stats.link++;
                else if (type === 'Text') stats.text++;
                else if (type === 'Highlight') stats.highlight++;
            });
            
            document.getElementById('total-annotations').textContent = stats.total;
            document.getElementById('link-count').textContent = stats.link;
            document.getElementById('text-count').textContent = stats.text;
            document.getElementById('highlight-count').textContent = stats.highlight;
            
            document.getElementById('annotation-stats').style.display = stats.total > 0 ? 'block' : 'none';
        }
        
        // 切换注释显示
        function toggleAnnotations() {
            showAnnotations = !showAnnotations;
            const button = document.getElementById('toggle-annotations');
            
            if (showAnnotations) {
                button.textContent = '显示注释';
                button.classList.add('active');
            } else {
                button.textContent = '隐藏注释';
                button.classList.remove('active');
                annotationLayer.innerHTML = '';
            }
            
            if (currentPageProxy) {
                const scale = 1.5;
                const viewport = currentPageProxy.getViewport({ scale: scale });
                renderAnnotationLayer(currentPageProxy, viewport);
            }
        }
        
        // 改变注释模式
        function changeAnnotationMode() {
            const select = document.getElementById('annotation-mode-select');
            annotationMode = parseInt(select.value);
            
            if (currentPageProxy) {
                renderPage(currentPage);
            }
        }
        
        // 导出注释
        function exportAnnotations() {
            if (allAnnotations.length === 0) {
                loadAllAnnotations().then(function() {
                    doExportAnnotations();
                });
            } else {
                doExportAnnotations();
            }
        }
        
        function doExportAnnotations() {
            const exportData = {
                totalPages: pdfDoc ? pdfDoc.numPages : 0,
                totalAnnotations: allAnnotations.length,
                annotations: allAnnotations.map(function(annotation) {
                    return {
                        page: annotation.pageNum,
                        type: annotation.subtype,
                        contents: annotation.contents,
                        rect: annotation.rect,
                        url: annotation.url,
                        dest: annotation.dest
                    };
                })
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'pdf-annotations.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
        }
        
        // 清空注释列表
        function clearAnnotationList() {
            document.getElementById('annotation-list').innerHTML = '<div class="loading">暂无注释数据</div>';
            document.getElementById('annotation-stats').style.display = 'none';
        }
        
        // 上一页
        function prevPage() {
            if (currentPage <= 1) return;
            currentPage--;
            renderPage(currentPage);
            updatePageControls();
            hideAnnotationPopup();
        }
        
        // 下一页
        function nextPage() {
            if (!pdfDoc || currentPage >= pdfDoc.numPages) return;
            currentPage++;
            renderPage(currentPage);
            updatePageControls();
            hideAnnotationPopup();
        }
        
        // 更新页面控制按钮状态
        function updatePageControls() {
            document.getElementById('current-page').textContent = currentPage;
            document.getElementById('prev-page').disabled = (currentPage <= 1);
            document.getElementById('next-page').disabled = (!pdfDoc || currentPage >= pdfDoc.numPages);
        }
        
        // 显示/隐藏元素的辅助函数
        function showLoading(message) {
            loadingDiv.textContent = message;
            loadingDiv.style.display = 'block';
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
        
        // 点击空白区域隐藏弹窗
        document.addEventListener('click', function(event) {
            if (!annotationPopup.contains(event.target) && !event.target.closest('.annotation-layer')) {
                hideAnnotationPopup();
            }
        });
        
        // 键盘快捷键
        document.addEventListener('keydown', function(event) {
            if (!pdfDoc) return;
            
            switch(event.key) {
                case 'ArrowLeft':
                case 'ArrowUp':
                    event.preventDefault();
                    prevPage();
                    break;
                case 'ArrowRight':
                case 'ArrowDown':
                    event.preventDefault();
                    nextPage();
                    break;
                case 'Escape':
                    hideAnnotationPopup();
                    break;
            }
        });
    </script>
</body>
</html>
```

## 核心功能说明

### 1. 注释获取

```javascript
// 获取页面注释
page.getAnnotations({ intent: 'display' }).then(function(annotations) {
    annotations.forEach(function(annotation) {
        console.log({
            type: annotation.subtype,      // 注释类型
            contents: annotation.contents, // 注释内容
            rect: annotation.rect,         // 位置矩形
            url: annotation.url,           // 链接URL（如果是链接注释）
            dest: annotation.dest          // 内部链接目标
        });
    });
});
```

### 2. 注释渲染

```javascript
function createAnnotationElement(annotation, viewport) {
    const element = document.createElement('section');
    const rect = annotation.rect;
    
    // 计算位置（PDF坐标系转换为屏幕坐标系）
    const left = Math.min(rect[0], rect[2]);
    const top = viewport.height - Math.max(rect[1], rect[3]);
    const width = Math.abs(rect[2] - rect[0]);
    const height = Math.abs(rect[3] - rect[1]);
    
    element.style.left = left + 'px';
    element.style.top = top + 'px';
    element.style.width = width + 'px';
    element.style.height = height + 'px';
    
    return element;
}
```

### 3. 注释交互

```javascript
// 添加点击事件
element.addEventListener('click', function(event) {
    event.preventDefault();
    
    // 显示注释详情
    showAnnotationPopup(annotation, event.pageX, event.pageY);
    
    // 处理特定类型的注释
    if (annotation.subtype === 'Link' && annotation.url) {
        if (confirm('是否要打开链接: ' + annotation.url)) {
            window.open(annotation.url, '_blank');
        }
    }
});
```

### 4. 注释模式

```javascript
// 设置注释模式
const annotationModes = {
    DISABLE: 0,           // 禁用注释
    ENABLE: 1,            // 启用注释
    ENABLE_FORMS: 2,      // 启用表单
    ENABLE_STORAGE: 3     // 启用存储
};

// 在渲染时应用注释模式
page.getAnnotations({
    intent: 'display',
    annotationMode: annotationMode
}).then(function(annotations) {
    // 处理注释
});
```

### 5. 注释类型处理

```javascript
// 不同注释类型的处理
function handleAnnotationByType(annotation, element) {
    switch (annotation.subtype) {
        case 'Link':
            element.style.cursor = 'pointer';
            element.style.border = '2px solid blue';
            break;
            
        case 'Highlight':
            element.style.backgroundColor = 'rgba(255, 255, 0, 0.3)';
            break;
            
        case 'Text':
            element.textContent = '📝';
            element.style.backgroundColor = '#fff3cd';
            break;
            
        case 'FreeText':
            element.textContent = annotation.contents;
            element.style.backgroundColor = '#e3f2fd';
            element.style.padding = '4px';
            break;
    }
}
```

## 高级功能

### 1. 注释搜索

```javascript
function searchAnnotations(searchTerm) {
    const results = [];
    
    allAnnotations.forEach(function(annotation, index) {
        const searchText = (
            (annotation.contents || '') + ' ' +
            (annotation.url || '') + ' ' +
            (annotation.subtype || '')
        ).toLowerCase();
        
        if (searchText.includes(searchTerm.toLowerCase())) {
            results.push({
                index: index,
                annotation: annotation,
                relevance: calculateRelevance(searchText, searchTerm)
            });
        }
    });
    
    return results.sort((a, b) => b.relevance - a.relevance);
}
```

### 2. 注释过滤

```javascript
function filterAnnotationsByType(annotations, types) {
    return annotations.filter(function(annotation) {
        return types.includes(annotation.subtype);
    });
}

function filterAnnotationsByPage(annotations, pageNum) {
    return annotations.filter(function(annotation) {
        return annotation.pageNum === pageNum;
    });
}
```

### 3. 注释统计

```javascript
function analyzeAnnotations(annotations) {
    const analysis = {
        total: annotations.length,
        byType: {},
        byPage: {},
        withContent: 0,
        withLinks: 0
    };
    
    annotations.forEach(function(annotation) {
        // 按类型统计
        const type = annotation.subtype || 'Unknown';
        analysis.byType[type] = (analysis.byType[type] || 0) + 1;
        
        // 按页面统计
        const page = annotation.pageNum || 0;
        analysis.byPage[page] = (analysis.byPage[page] || 0) + 1;
        
        // 内容统计
        if (annotation.contents) analysis.withContent++;
        if (annotation.url) analysis.withLinks++;
    });
    
    return analysis;
}
```

### 4. 注释导出

```javascript
function exportAnnotationsToJSON(annotations) {
    const exportData = {
        metadata: {
            exportDate: new Date().toISOString(),
            totalAnnotations: annotations.length,
            version: '1.0'
        },
        annotations: annotations.map(function(annotation) {
            return {
                id: annotation.id,
                page: annotation.pageNum,
                type: annotation.subtype,
                contents: annotation.contents,
                position: {
                    x: annotation.rect[0],
                    y: annotation.rect[1],
                    width: annotation.rect[2] - annotation.rect[0],
                    height: annotation.rect[3] - annotation.rect[1]
                },
                url: annotation.url,
                destination: annotation.dest,
                author: annotation.title,
                modificationDate: annotation.modificationDate
            };
        })
    };
    
    return JSON.stringify(exportData, null, 2);
}
```

## 功能特性

- ✅ 多种注释类型支持（链接、文本、高亮、下划线等）
- ✅ 注释可视化显示
- ✅ 注释交互处理
- ✅ 注释详情弹窗
- ✅ 注释列表管理
- ✅ 注释统计分析
- ✅ 注释导出功能
- ✅ 多页面注释处理
- ✅ 注释模式切换
- ✅ 键盘快捷键支持

## 注意事项

1. **坐标转换**：PDF 坐标系原点在左下角，需要转换为屏幕坐标系
2. **注释模式**：不同模式影响注释的显示和交互行为
3. **性能优化**：大量注释时考虑虚拟化或分页加载
4. **浏览器兼容**：某些注释类型可能在不同浏览器中表现不同
5. **安全考虑**：处理链接注释时需要验证 URL 安全性

## 相关示例

- [基础渲染](/examples/basic-rendering) - PDF 基础渲染功能
- [文本提取](/examples/text-extraction) - 提取 PDF 文本内容
- [表单处理](/examples/forms) - 处理 PDF 表单字段