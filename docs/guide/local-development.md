# 本地运行 PDF.js 开源代码

本指南将详细介绍如何在本地环境中运行 PDF.js 开源代码，包括开发环境搭建、项目构建、调试技巧和贡献代码的流程。

## 环境要求

在开始之前，请确保您的系统满足以下要求：

- **Node.js**: 版本 18.0 或更高
- **npm**: 版本 8.0 或更高（通常随 Node.js 一起安装）
- **Git**: 用于克隆代码仓库
- **现代浏览器**: Chrome、Firefox、Safari 或 Edge 的最新版本

### 检查环境

```bash
# 检查 Node.js 版本
node --version

# 检查 npm 版本
npm --version

# 检查 Git 版本
git --version
```

## 克隆和构建项目

### 1. 克隆代码仓库

```bash
# 克隆官方仓库
git clone https://github.com/mozilla/pdf.js.git
cd pdf.js

# 或者克隆您的 fork
git clone https://github.com/YOUR_USERNAME/pdf.js.git
cd pdf.js
```

### 2. 安装依赖

```bash
# 安装项目依赖
npm install
```

### 3. 构建项目

```bash
# 构建开发版本
npm run build

# 或者构建生产版本
npm run dist
```

## 项目结构

了解项目结构有助于更好地进行开发：

```
pdf.js/
├── build/                 # 构建输出目录
│   ├── pdf.js            # 主要的 PDF.js 库
│   ├── pdf.worker.js     # Web Worker 文件
│   └── viewer/           # PDF 查看器
├── src/                  # 源代码目录
│   ├── core/            # 核心 PDF 解析逻辑
│   ├── display/         # 显示层 API
│   ├── shared/          # 共享工具和常量
│   └── worker/          # Worker 相关代码
├── web/                 # 查看器相关代码
│   ├── viewer.html      # 查看器 HTML
│   ├── viewer.js        # 查看器 JavaScript
│   └── viewer.css       # 查看器样式
├── test/                # 测试文件
├── examples/            # 示例代码
├── docs/                # 文档
├── gulpfile.js          # 构建配置
└── package.json         # 项目配置
```

## 开发环境配置

### 1. 开发模式构建

开发模式会启用源码映射和调试信息：

```bash
# 开发模式构建
npm run build -- --dev

# 监听文件变化并自动重新构建
npm run watch
```

### 2. 启动本地服务器

```bash
# 启动开发服务器（默认端口 8888）
npm start

# 或者使用 gulp 任务
npx gulp server
```

### 3. 自定义端口

```bash
# 使用自定义端口
npx gulp server --port=3000
```

### 4. 访问示例

启动服务器后，您可以访问以下地址：

- **PDF 查看器**: http://localhost:8888/web/viewer.html
- **API 示例**: http://localhost:8888/examples/
- **测试页面**: http://localhost:8888/test/

## 自定义构建

### 1. 修改构建配置

编辑 `gulpfile.js` 来自定义构建过程：

```javascript
// gulpfile.js
const gulp = require('gulp')
const { buildLib, buildViewer } = require('./build/build')

/**
 * 自定义构建任务
 */
gulp.task('custom-build', async () => {
  // 构建核心库
  await buildLib({
    name: 'pdf-custom',
    output: './build/custom/',
    defines: {
      GENERIC: true,
      SKIP_BABEL: false
    }
  })
  
  console.log('自定义构建完成')
})

/**
 * 构建特定功能
 */
gulp.task('build-core-only', async () => {
  await buildLib({
    name: 'pdf-core',
    output: './build/core/',
    defines: {
      GENERIC: true,
      PDF_VIEWER: false // 不包含查看器
    }
  })
})
```

### 2. 运行自定义构建

```bash
# 运行自定义构建任务
npx gulp custom-build

# 构建仅核心功能
npx gulp build-core-only
```

### 3. 创建自定义查看器

创建一个简单的 HTML 示例来测试您的修改：

```html
<!-- examples/custom-viewer.html -->
<!DOCTYPE html>
<html>
<head>
    <title>自定义 PDF 查看器</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
        }
        #pdfContainer {
            border: 1px solid #ccc;
            margin-top: 20px;
        }
        canvas {
            display: block;
            margin: 10px auto;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .controls {
            text-align: center;
            margin: 10px 0;
        }
        button {
            margin: 0 5px;
            padding: 8px 16px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <h1>自定义 PDF 查看器</h1>
    
    <div class="controls">
        <input type="file" id="fileInput" accept=".pdf" />
        <button id="prevBtn">上一页</button>
        <span id="pageInfo">页面: 0 / 0</span>
        <button id="nextBtn">下一页</button>
        <select id="scaleSelect">
            <option value="0.5">50%</option>
            <option value="0.75">75%</option>
            <option value="1" selected>100%</option>
            <option value="1.25">125%</option>
            <option value="1.5">150%</option>
            <option value="2">200%</option>
        </select>
    </div>
    
    <div id="pdfContainer">
        <canvas id="pdfCanvas"></canvas>
    </div>

    <script src="../build/pdf.js"></script>
    <script>
        // 配置 PDF.js
        pdfjsLib.GlobalWorkerOptions.workerSrc = '../build/pdf.worker.js'
        
        let pdfDoc = null
        let currentPage = 1
        let scale = 1
        
        const canvas = document.getElementById('pdfCanvas')
        const ctx = canvas.getContext('2d')
        const fileInput = document.getElementById('fileInput')
        const prevBtn = document.getElementById('prevBtn')
        const nextBtn = document.getElementById('nextBtn')
        const pageInfo = document.getElementById('pageInfo')
        const scaleSelect = document.getElementById('scaleSelect')
        
        /**
         * 渲染页面
         */
        async function renderPage(pageNum) {
            if (!pdfDoc) return
            
            try {
                const page = await pdfDoc.getPage(pageNum)
                const viewport = page.getViewport({ scale })
                
                canvas.height = viewport.height
                canvas.width = viewport.width
                
                const renderContext = {
                    canvasContext: ctx,
                    viewport: viewport
                }
                
                await page.render(renderContext).promise
                
                // 更新页面信息
                pageInfo.textContent = `页面: ${pageNum} / ${pdfDoc.numPages}`
                
                // 更新按钮状态
                prevBtn.disabled = pageNum <= 1
                nextBtn.disabled = pageNum >= pdfDoc.numPages
                
                console.log(`页面 ${pageNum} 渲染完成`)
            } catch (error) {
                console.error('渲染页面失败:', error)
            }
        }
        
        /**
         * 加载 PDF 文件
         */
        async function loadPDF(file) {
            try {
                const arrayBuffer = await file.arrayBuffer()
                const loadingTask = pdfjsLib.getDocument(arrayBuffer)
                
                // 监听加载进度
                loadingTask.onProgress = (progress) => {
                    const percent = Math.round((progress.loaded / progress.total) * 100)
                    console.log(`加载进度: ${percent}%`)
                }
                
                pdfDoc = await loadingTask.promise
                currentPage = 1
                
                console.log(`PDF 加载成功，共 ${pdfDoc.numPages} 页`)
                await renderPage(currentPage)
            } catch (error) {
                console.error('加载 PDF 失败:', error)
                alert('加载 PDF 失败: ' + error.message)
            }
        }
        
        // 事件监听器
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0]
            if (file && file.type === 'application/pdf') {
                loadPDF(file)
            }
        })
        
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--
                renderPage(currentPage)
            }
        })
        
        nextBtn.addEventListener('click', () => {
            if (pdfDoc && currentPage < pdfDoc.numPages) {
                currentPage++
                renderPage(currentPage)
            }
        })
        
        scaleSelect.addEventListener('change', (e) => {
            scale = parseFloat(e.target.value)
            if (pdfDoc) {
                renderPage(currentPage)
            }
        })
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (!pdfDoc) return
            
            switch (e.key) {
                case 'ArrowLeft':
                case 'ArrowUp':
                    if (currentPage > 1) {
                        currentPage--
                        renderPage(currentPage)
                    }
                    break
                case 'ArrowRight':
                case 'ArrowDown':
                    if (currentPage < pdfDoc.numPages) {
                        currentPage++
                        renderPage(currentPage)
                    }
                    break
            }
        })
        
        console.log('自定义 PDF 查看器已初始化')
    </script>
</body>
</html>
```

## 运行测试

### 1. 单元测试

```bash
# 运行所有测试
npm test

# 运行特定测试套件
npm test -- --grep="PDF parsing"

# 运行测试并生成覆盖率报告
npm run test:coverage
```

### 2. 集成测试

```bash
# 运行浏览器测试
npm run test:browser

# 运行特定浏览器的测试
npm run test:chrome
npm run test:firefox
```

### 3. 性能测试

```bash
# 运行性能基准测试
npm run benchmark

# 测试特定 PDF 文件的性能
node test/benchmark.js path/to/test.pdf
```

## 调试技巧

### 1. 启用调试模式

在构建时启用调试信息：

```bash
# 构建调试版本
npm run build -- --dev --debug
```

或者在代码中设置调试标志：

```javascript
// 在 HTML 中设置全局调试标志
<script>
  window.pdfjsDebug = true
</script>

// 或者在 JavaScript 中设置
pdfjsLib.GlobalWorkerOptions.verbosity = pdfjsLib.VerbosityLevel.INFOS
```

### 2. 使用开发者工具

在浏览器开发者工具中调试：

```javascript
// 在控制台中访问 PDF.js 内部对象
console.log(window.PDFViewerApplication)
console.log(window.pdfjsLib)

// 监听 PDF.js 事件
window.addEventListener('pagesinit', () => {
  console.log('PDF 页面初始化完成')
})

window.addEventListener('pagerendered', (e) => {
  console.log(`页面 ${e.detail.pageNumber} 渲染完成`)
})
```

### 3. 性能分析

使用浏览器的性能分析工具：

```javascript
// 测量渲染性能
const startTime = performance.now()

await page.render(renderContext).promise

const endTime = performance.now()
console.log(`页面渲染耗时: ${endTime - startTime} 毫秒`)

// 内存使用情况
if (performance.memory) {
  console.log('内存使用情况:', {
    used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + ' MB',
    total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + ' MB',
    limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + ' MB'
  })
}
```

### 4. 日志记录

添加详细的日志记录：

```javascript
// 创建自定义日志记录器
class PDFLogger {
  static log(level, message, data = null) {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [${level}] ${message}`
    
    console.log(logMessage, data || '')
    
    // 可选：发送到远程日志服务
    if (level === 'ERROR') {
      this.sendToLogService(logMessage, data)
    }
  }
  
  static info(message, data) {
    this.log('INFO', message, data)
  }
  
  static warn(message, data) {
    this.log('WARN', message, data)
  }
  
  static error(message, data) {
    this.log('ERROR', message, data)
  }
  
  static sendToLogService(message, data) {
    // 实现远程日志记录
    fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, data, timestamp: Date.now() })
    }).catch(err => console.error('发送日志失败:', err))
  }
}

// 使用日志记录器
PDFLogger.info('开始加载 PDF', { url: pdfUrl })
PDFLogger.error('PDF 加载失败', { error: error.message, stack: error.stack })
```

## 贡献代码

### 1. 设置开发环境

```bash
# Fork 项目到您的 GitHub 账户
# 然后克隆您的 fork
git clone https://github.com/YOUR_USERNAME/pdf.js.git
cd pdf.js

# 添加上游仓库
git remote add upstream https://github.com/mozilla/pdf.js.git

# 安装依赖
npm install
```

### 2. 创建功能分支

```bash
# 从最新的 master 分支创建新分支
git checkout master
git pull upstream master
git checkout -b feature/your-feature-name
```

### 3. 开发和测试

```bash
# 进行您的修改
# ...

# 运行代码检查
npm run lint

# 修复代码风格问题
npm run lint:fix

# 运行测试
npm test

# 构建项目
npm run build
```

### 4. 提交代码

```bash
# 添加修改的文件
git add .

# 提交代码（使用清晰的提交信息）
git commit -m "feat: 添加新的 PDF 渲染功能

- 实现了新的渲染算法
- 提高了渲染性能
- 添加了相关测试

修复 #123"
```

### 5. 推送和创建 Pull Request

```bash
# 推送到您的 fork
git push origin feature/your-feature-name

# 然后在 GitHub 上创建 Pull Request
```

### 6. 代码审查和合并

- 等待维护者审查您的代码
- 根据反馈进行修改
- 一旦通过审查，您的代码将被合并

## 常见开发任务

### 1. 添加新的 PDF 功能

```javascript
// src/core/my-new-feature.js

/**
 * 新功能实现
 */
class MyNewFeature {
  constructor(options = {}) {
    this.options = {
      enabled: true,
      ...options
    }
  }
  
  /**
   * 处理 PDF 数据
   */
  process(pdfData) {
    if (!this.options.enabled) {
      return pdfData
    }
    
    // 实现您的功能逻辑
    console.log('处理 PDF 数据:', pdfData)
    
    return pdfData
  }
}

export { MyNewFeature }
```

### 2. 修改查看器界面

```css
/* web/viewer.css */

/* 添加新的样式 */
.my-custom-toolbar {
  background: #f0f0f0;
  padding: 10px;
  border-bottom: 1px solid #ccc;
}

.my-custom-button {
  background: #007acc;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.my-custom-button:hover {
  background: #005a9e;
}
```

```javascript
// web/viewer.js

// 添加新的功能到查看器
class CustomViewerFeature {
  constructor(viewer) {
    this.viewer = viewer
    this.init()
  }
  
  init() {
    // 创建自定义工具栏
    const toolbar = document.createElement('div')
    toolbar.className = 'my-custom-toolbar'
    
    const button = document.createElement('button')
    button.className = 'my-custom-button'
    button.textContent = '自定义功能'
    button.addEventListener('click', () => this.handleClick())
    
    toolbar.appendChild(button)
    
    // 添加到查看器
    const viewerContainer = document.getElementById('viewerContainer')
    viewerContainer.insertBefore(toolbar, viewerContainer.firstChild)
  }
  
  handleClick() {
    console.log('自定义功能被点击')
    // 实现您的功能
  }
}

// 在查看器初始化后添加功能
document.addEventListener('webviewerloaded', () => {
  new CustomViewerFeature(PDFViewerApplication)
})
```

### 3. 创建插件系统

```javascript
// src/plugins/plugin-manager.js

/**
 * 插件管理器
 */
class PluginManager {
  constructor() {
    this.plugins = new Map()
    this.hooks = new Map()
  }
  
  /**
   * 注册插件
   */
  register(name, plugin) {
    if (this.plugins.has(name)) {
      throw new Error(`插件 ${name} 已存在`)
    }
    
    this.plugins.set(name, plugin)
    
    // 初始化插件
    if (typeof plugin.init === 'function') {
      plugin.init(this)
    }
    
    console.log(`插件 ${name} 注册成功`)
  }
  
  /**
   * 注册钩子
   */
  addHook(event, callback) {
    if (!this.hooks.has(event)) {
      this.hooks.set(event, [])
    }
    
    this.hooks.get(event).push(callback)
  }
  
  /**
   * 触发钩子
   */
  async triggerHook(event, data) {
    const callbacks = this.hooks.get(event) || []
    
    for (const callback of callbacks) {
      try {
        await callback(data)
      } catch (error) {
        console.error(`钩子 ${event} 执行失败:`, error)
      }
    }
  }
  
  /**
   * 获取插件
   */
  getPlugin(name) {
    return this.plugins.get(name)
  }
}

// 创建全局插件管理器
const pluginManager = new PluginManager()

export { PluginManager, pluginManager }
```

## 性能优化建议

### 1. 内存管理

```javascript
// 及时清理不需要的资源
class ResourceManager {
  constructor() {
    this.resources = new Set()
  }
  
  addResource(resource) {
    this.resources.add(resource)
  }
  
  cleanup() {
    for (const resource of this.resources) {
      if (resource.destroy) {
        resource.destroy()
      }
    }
    this.resources.clear()
  }
}

// 使用 WeakMap 避免内存泄漏
const pageCache = new WeakMap()

function cachePage(page, data) {
  pageCache.set(page, data)
}
```

### 2. 异步处理

```javascript
// 使用 Web Workers 进行重计算
class WorkerPool {
  constructor(workerScript, poolSize = 4) {
    this.workers = []
    this.queue = []
    this.busy = new Set()
    
    for (let i = 0; i < poolSize; i++) {
      const worker = new Worker(workerScript)
      worker.onmessage = (e) => this.handleWorkerMessage(worker, e)
      this.workers.push(worker)
    }
  }
  
  async execute(data) {
    return new Promise((resolve, reject) => {
      const task = { data, resolve, reject }
      
      const availableWorker = this.workers.find(w => !this.busy.has(w))
      if (availableWorker) {
        this.runTask(availableWorker, task)
      } else {
        this.queue.push(task)
      }
    })
  }
  
  runTask(worker, task) {
    this.busy.add(worker)
    worker.postMessage(task.data)
    worker._currentTask = task
  }
  
  handleWorkerMessage(worker, event) {
    const task = worker._currentTask
    if (task) {
      if (event.data.error) {
        task.reject(new Error(event.data.error))
      } else {
        task.resolve(event.data.result)
      }
    }
    
    this.busy.delete(worker)
    worker._currentTask = null
    
    // 处理队列中的下一个任务
    if (this.queue.length > 0) {
      const nextTask = this.queue.shift()
      this.runTask(worker, nextTask)
    }
  }
}
```

### 3. 缓存策略

```javascript
// 实现 LRU 缓存
class LRUCache {
  constructor(maxSize = 100) {
    this.maxSize = maxSize
    this.cache = new Map()
  }
  
  get(key) {
    if (this.cache.has(key)) {
      // 移动到最前面
      const value = this.cache.get(key)
      this.cache.delete(key)
      this.cache.set(key, value)
      return value
    }
    return null
  }
  
  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key)
    } else if (this.cache.size >= this.maxSize) {
      // 删除最旧的项
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    
    this.cache.set(key, value)
  }
  
  clear() {
    this.cache.clear()
  }
}

// 页面渲染缓存
const renderCache = new LRUCache(50)

function getCachedRender(pageNum, scale) {
  const key = `${pageNum}-${scale}`
  return renderCache.get(key)
}

function setCachedRender(pageNum, scale, imageData) {
  const key = `${pageNum}-${scale}`
  renderCache.set(key, imageData)
}
```

## 下一步

- [Vue 集成指南](/guide/vue-integration) - 学习在 Vue 中使用 PDF.js
- [React 集成指南](/guide/react-integration) - 学习在 React 中使用 PDF.js
- [API 文档](/api/) - 查看完整的 API 参考
- [贡献指南](https://github.com/mozilla/pdf.js/blob/master/CONTRIBUTING.md) - 了解如何为项目做贡献

## 相关资源

- [PDF.js GitHub 仓库](https://github.com/mozilla/pdf.js)
- [PDF.js 官方文档](https://mozilla.github.io/pdf.js/)
- [PDF 规范文档](https://www.adobe.com/content/dam/acom/en/devnet/pdf/pdfs/PDF32000_2008.pdf)
- [Mozilla 开发者网络](https://developer.mozilla.org/)