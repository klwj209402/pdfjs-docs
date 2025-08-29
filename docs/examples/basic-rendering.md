# 简单PDF渲染

本示例展示如何使用 PDF.js 渲染 PDF 文档的基本方法。

## Hello World 示例

最简单的PDF渲染示例，展示如何加载和显示PDF文档的第一页：

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>'Hello, world!' example</title>
</head>
<body>
  <h1>'Hello, world!' example</h1>
  <canvas id="the-canvas" style="border: 1px solid black; direction: ltr;"></canvas>
  
  <script src="path/to/pdf.mjs" type="module"></script>
  <script type="module">
    // PDF文件路径
    const url = './helloworld.pdf';
    
    // 配置Worker路径
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'path/to/pdf.worker.mjs';
    
    // 异步加载PDF文档
    const loadingTask = pdfjsLib.getDocument(url);
    const pdf = await loadingTask.promise;
    
    // 获取第一页
    const page = await pdf.getPage(1);
    const scale = 1.5;
    const viewport = page.getViewport({ scale });
    
    // 支持高DPI屏幕
    const outputScale = window.devicePixelRatio || 1;
    
    // 准备Canvas
    const canvas = document.getElementById("the-canvas");
    const context = canvas.getContext("2d");
    
    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = Math.floor(viewport.width) + "px";
    canvas.style.height = Math.floor(viewport.height) + "px";
    
    const transform = outputScale !== 1
      ? [outputScale, 0, 0, outputScale, 0, 0]
      : null;
    
    // 渲染PDF页面到Canvas
    const renderContext = {
      canvasContext: context,
      transform,
      viewport,
    };
    page.render(renderContext);
  </script>
</body>
</html>
```

## 核心概念

### 1. Worker配置
```javascript
// 必须配置Worker路径
pdfjsLib.GlobalWorkerOptions.workerSrc = 'path/to/pdf.worker.mjs';
```

### 2. 文档加载
```javascript
// 创建加载任务
const loadingTask = pdfjsLib.getDocument(url);
// 等待加载完成
const pdf = await loadingTask.promise;
```

### 3. 页面渲染
```javascript
// 获取页面
const page = await pdf.getPage(pageNumber);
// 设置视口
const viewport = page.getViewport({ scale: 1.5 });
// 渲染到Canvas
page.render(renderContext);
```

## 高DPI支持

为了在高分辨率屏幕上获得清晰的显示效果：

```javascript
// 获取设备像素比
const outputScale = window.devicePixelRatio || 1;

// 设置Canvas实际尺寸
canvas.width = Math.floor(viewport.width * outputScale);
canvas.height = Math.floor(viewport.height * outputScale);

// 设置Canvas显示尺寸
canvas.style.width = Math.floor(viewport.width) + "px";
canvas.style.height = Math.floor(viewport.height) + "px";

// 设置变换矩阵
const transform = outputScale !== 1
  ? [outputScale, 0, 0, outputScale, 0, 0]
  : null;
```

## 错误处理

```javascript
try {
  const loadingTask = pdfjsLib.getDocument(url);
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);
  // 渲染逻辑...
} catch (error) {
  console.error('PDF加载或渲染失败:', error);
}
```

## 注意事项

1. **Worker路径**：必须正确配置Worker文件路径
2. **跨域问题**：确保PDF文件可以被正常访问
3. **Canvas尺寸**：根据视口尺寸正确设置Canvas大小
4. **内存管理**：及时清理不需要的页面资源
5. **异步处理**：所有PDF操作都是异步的，需要使用Promise或async/await

## 完整功能示例

### HTML 结构

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PDF.js 基础渲染示例</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .controls {
            margin-bottom: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 5px;
        }
        
        .controls button {
            margin-right: 10px;
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
        
        .page-info {
            margin: 0 15px;
            font-weight: bold;
        }
        
        .scale-controls {
            margin-top: 10px;
        }
        
        .scale-controls label {
            margin-right: 10px;
        }
        
        .scale-controls select {
            padding: 5px;
            border-radius: 3px;
            border: 1px solid #ddd;
        }
        
        #pdf-canvas {
            display: block;
            margin: 20px auto;
            border: 1px solid #ddd;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
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
        
        .progress-container {
            margin: 20px 0;
            background: #e9ecef;
            border-radius: 5px;
            overflow: hidden;
        }
        
        .progress-bar {
            height: 20px;
            background: #28a745;
            width: 0%;
            transition: width 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>PDF.js 基础渲染示例</h1>
        
        <!-- 文件选择 -->
        <div class="controls">
            <input type="file" id="file-input" accept=".pdf" />
            <button onclick="loadSamplePDF()">加载示例PDF</button>
        </div>
        
        <!-- 进度条 -->
        <div id="progress-container" class="progress-container" style="display: none;">
            <div id="progress-bar" class="progress-bar">0%</div>
        </div>
        
        <!-- 错误信息 -->
        <div id="error-message" class="error" style="display: none;"></div>
        
        <!-- 控制按钮 -->
        <div id="pdf-controls" class="controls" style="display: none;">
            <button id="prev-page" onclick="prevPage()">上一页</button>
            <span class="page-info">
                第 <span id="current-page">1</span> 页，共 <span id="total-pages">0</span> 页
            </span>
            <button id="next-page" onclick="nextPage()">下一页</button>
            
            <div class="scale-controls">
                <label for="scale-select">缩放:</label>
                <select id="scale-select" onchange="changeScale()">
                    <option value="0.5">50%</option>
                    <option value="0.75">75%</option>
                    <option value="1.0" selected>100%</option>
                    <option value="1.25">125%</option>
                    <option value="1.5">150%</option>
                    <option value="2.0">200%</option>
                    <option value="auto">适应宽度</option>
                </select>
            </div>
        </div>
        
        <!-- PDF 渲染区域 -->
        <div id="loading" class="loading">请选择或加载 PDF 文件</div>
        <canvas id="pdf-canvas" style="display: none;"></canvas>
    </div>
    
    <!-- 引入 PDF.js -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
    <script>
        // 配置 PDF.js Worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        // 全局变量
        let pdfDoc = null;
        let currentPage = 1;
        let currentScale = 1.0;
        
        // DOM 元素
        const canvas = document.getElementById('pdf-canvas');
        const ctx = canvas.getContext('2d');
        const fileInput = document.getElementById('file-input');
        const loadingDiv = document.getElementById('loading');
        const errorDiv = document.getElementById('error-message');
        const controlsDiv = document.getElementById('pdf-controls');
        const progressContainer = document.getElementById('progress-container');
        const progressBar = document.getElementById('progress-bar');
        
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
            // 这里应该是您的示例 PDF 文件路径
            const samplePdfUrl = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';
            loadPDF(samplePdfUrl);
        }
        
        // 加载 PDF 文档
        function loadPDF(source) {
            showLoading('正在加载 PDF...');
            hideError();
            
            const loadingTask = pdfjsLib.getDocument(source);
            
            // 显示加载进度
            loadingTask.onProgress = function(progress) {
                if (progress.total > 0) {
                    const percent = Math.round((progress.loaded / progress.total) * 100);
                    updateProgress(percent);
                }
            };
            
            // 处理密码保护的 PDF
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
                    callback(null);
                }
            };
            
            loadingTask.promise.then(function(pdf) {
                pdfDoc = pdf;
                currentPage = 1;
                
                hideLoading();
                hideProgress();
                showControls();
                
                document.getElementById('total-pages').textContent = pdf.numPages;
                
                renderPage(currentPage);
                updatePageControls();
                
            }).catch(function(error) {
                hideLoading();
                hideProgress();
                handleLoadError(error);
            });
        }
        
        // 渲染指定页面
        function renderPage(pageNum) {
            if (!pdfDoc) return;
            
            showLoading('正在渲染页面...');
            
            pdfDoc.getPage(pageNum).then(function(page) {
                let scale = currentScale;
                
                // 自动适应宽度
                if (currentScale === 'auto') {
                    const containerWidth = document.querySelector('.container').clientWidth - 80;
                    const viewport = page.getViewport({ scale: 1.0 });
                    scale = containerWidth / viewport.width;
                }
                
                const viewport = page.getViewport({ scale: scale });
                
                // 设置 Canvas 尺寸
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                // 处理高 DPI 屏幕
                const outputScale = window.devicePixelRatio || 1;
                if (outputScale !== 1) {
                    canvas.width *= outputScale;
                    canvas.height *= outputScale;
                    canvas.style.width = viewport.width + 'px';
                    canvas.style.height = viewport.height + 'px';
                    ctx.scale(outputScale, outputScale);
                }
                
                // 渲染页面
                const renderContext = {
                    canvasContext: ctx,
                    viewport: viewport
                };
                
                const renderTask = page.render(renderContext);
                
                return renderTask.promise;
                
            }).then(function() {
                hideLoading();
                showCanvas();
                
            }).catch(function(error) {
                hideLoading();
                showError('渲染页面时发生错误: ' + error.message);
            });
        }
        
        // 上一页
        function prevPage() {
            if (currentPage <= 1) return;
            currentPage--;
            renderPage(currentPage);
            updatePageControls();
        }
        
        // 下一页
        function nextPage() {
            if (!pdfDoc || currentPage >= pdfDoc.numPages) return;
            currentPage++;
            renderPage(currentPage);
            updatePageControls();
        }
        
        // 改变缩放比例
        function changeScale() {
            const scaleSelect = document.getElementById('scale-select');
            const newScale = scaleSelect.value;
            
            if (newScale === 'auto') {
                currentScale = 'auto';
            } else {
                currentScale = parseFloat(newScale);
            }
            
            renderPage(currentPage);
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
        }
        
        function hideLoading() {
            loadingDiv.style.display = 'none';
        }
        
        function showCanvas() {
            canvas.style.display = 'block';
        }
        
        function hideCanvas() {
            canvas.style.display = 'none';
        }
        
        function showControls() {
            controlsDiv.style.display = 'block';
        }
        
        function hideControls() {
            controlsDiv.style.display = 'none';
        }
        
        function showError(message) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
        
        function hideError() {
            errorDiv.style.display = 'none';
        }
        
        function updateProgress(percent) {
            progressContainer.style.display = 'block';
            progressBar.style.width = percent + '%';
            progressBar.textContent = percent + '%';
        }
        
        function hideProgress() {
            progressContainer.style.display = 'none';
        }
        
        // 处理加载错误
        function handleLoadError(error) {
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
            
            showError(errorMessage);
        }
        
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
                case 'Home':
                    event.preventDefault();
                    currentPage = 1;
                    renderPage(currentPage);
                    updatePageControls();
                    break;
                case 'End':
                    event.preventDefault();
                    currentPage = pdfDoc.numPages;
                    renderPage(currentPage);
                    updatePageControls();
                    break;
            }
        });
        
        // 窗口大小改变时重新渲染（仅在自动缩放模式下）
        window.addEventListener('resize', function() {
            if (currentScale === 'auto' && pdfDoc) {
                clearTimeout(window.resizeTimer);
                window.resizeTimer = setTimeout(function() {
                    renderPage(currentPage);
                }, 250);
            }
        });
        
        // 页面卸载时清理资源
        window.addEventListener('beforeunload', function() {
            if (pdfDoc) {
                pdfDoc.destroy();
            }
        });
    </script>
</body>
</html>
```

## 核心功能说明

### 1. PDF 加载

```javascript
// 从 URL 加载
const loadingTask = pdfjsLib.getDocument('path/to/document.pdf');

// 从文件加载
const fileReader = new FileReader();
fileReader.onload = function() {
    const typedArray = new Uint8Array(this.result);
    const loadingTask = pdfjsLib.getDocument(typedArray);
};
fileReader.readAsArrayBuffer(file);
```

### 2. 页面渲染

```javascript
function renderPage(pageNum) {
    pdfDoc.getPage(pageNum).then(function(page) {
        const viewport = page.getViewport({ scale: scale });
        
        // 设置 Canvas 尺寸
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // 渲染页面
        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        
        return page.render(renderContext).promise;
    });
}
```

### 3. 高 DPI 支持

```javascript
// 处理高 DPI 屏幕
const outputScale = window.devicePixelRatio || 1;
if (outputScale !== 1) {
    canvas.width *= outputScale;
    canvas.height *= outputScale;
    canvas.style.width = viewport.width + 'px';
    canvas.style.height = viewport.height + 'px';
    ctx.scale(outputScale, outputScale);
}
```

### 4. 响应式缩放

```javascript
// 自动适应容器宽度
if (currentScale === 'auto') {
    const containerWidth = document.querySelector('.container').clientWidth - 80;
    const viewport = page.getViewport({ scale: 1.0 });
    scale = containerWidth / viewport.width;
}
```

## 功能特性

- ✅ 文件选择和拖拽上传
- ✅ 加载进度显示
- ✅ 密码保护 PDF 支持
- ✅ 页面导航（上一页/下一页）
- ✅ 多种缩放选项
- ✅ 响应式设计
- ✅ 键盘快捷键支持
- ✅ 高 DPI 屏幕支持
- ✅ 错误处理和用户反馈

## 扩展建议

1. **添加缩略图导航**
2. **实现文本搜索功能**
3. **支持页面旋转**
4. **添加全屏模式**
5. **实现打印功能**
6. **支持注释显示**

## 相关示例

- [多页面处理](/examples/multi-page) - 处理多页面 PDF
- [文本提取](/examples/text-extraction) - 提取 PDF 文本内容
- [注释处理](/examples/annotations) - 处理 PDF 注释