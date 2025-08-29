# Webpack集成

本示例展示如何在Webpack项目中集成PDF.js，包括基础配置、优化设置和生产环境部署。

## 基础Webpack配置

### 1. 安装依赖

```bash
npm install pdfjs-dist
npm install --save-dev webpack webpack-cli webpack-dev-server
npm install --save-dev html-webpack-plugin copy-webpack-plugin
npm install --save-dev css-loader style-loader file-loader
```

### 2. Webpack配置文件

创建 `webpack.config.js`：

```javascript
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[contenthash].js',
    clean: true,
    publicPath: '/'
  },
  
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource'
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource'
      },
      {
        test: /\.pdf$/i,
        type: 'asset/resource'
      }
    ]
  },
  
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      title: 'PDF.js Webpack Demo'
    }),
    
    // 复制PDF.js Worker文件
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'node_modules/pdfjs-dist/build/pdf.worker.min.js'),
          to: 'pdf.worker.min.js'
        },
        {
          from: path.resolve(__dirname, 'node_modules/pdfjs-dist/cmaps'),
          to: 'cmaps'
        }
      ]
    })
  ],
  
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist')
    },
    compress: true,
    port: 8080,
    hot: true,
    open: true
  },
  
  resolve: {
    alias: {
      // 解决PDF.js的模块解析问题
      'pdfjs-dist/build/pdf': 'pdfjs-dist/build/pdf.min.js'
    }
  },
  
  // 优化配置
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        pdfjs: {
          test: /[\\/]node_modules[\\/]pdfjs-dist[\\/]/,
          name: 'pdfjs',
          chunks: 'all'
        }
      }
    }
  }
};
```

### 3. 项目结构

```
project/
├── src/
│   ├── index.html
│   ├── index.js
│   ├── styles.css
│   └── components/
│       └── PDFViewer.js
├── assets/
│   └── sample.pdf
├── webpack.config.js
└── package.json
```

## 主要文件实现

### 1. HTML模板 (`src/index.html`)

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><%= htmlWebpackPlugin.options.title %></title>
</head>
<body>
  <div id="app">
    <header class="header">
      <h1>PDF.js Webpack Demo</h1>
      <div class="controls">
        <input type="file" id="fileInput" accept=".pdf" />
        <button id="prevBtn">上一页</button>
        <span id="pageInfo">1 / 1</span>
        <button id="nextBtn">下一页</button>
        <button id="zoomOutBtn">缩小</button>
        <span id="scaleInfo">100%</span>
        <button id="zoomInBtn">放大</button>
      </div>
    </header>
    
    <main class="main">
      <div id="pdfContainer" class="pdf-container">
        <canvas id="pdfCanvas"></canvas>
      </div>
      
      <div id="loading" class="loading" style="display: none;">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>
    </main>
  </div>
</body>
</html>
```

### 2. 样式文件 (`src/styles.css`)

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f5f5;
  color: #333;
}

.header {
  background: white;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.header h1 {
  color: #2c3e50;
  font-size: 1.5rem;
}

.controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.controls button {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.controls button:hover {
  background: #f8f9fa;
  border-color: #007bff;
}

.controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.controls input[type="file"] {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
}

.controls span {
  padding: 0.5rem;
  font-weight: 500;
  min-width: 60px;
  text-align: center;
}

.main {
  padding: 1rem;
  display: flex;
  justify-content: center;
  min-height: calc(100vh - 80px);
}

.pdf-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  padding: 1rem;
  max-width: 100%;
  overflow: auto;
}

#pdfCanvas {
  display: block;
  margin: 0 auto;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  border-radius: 4px;
}

.loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading p {
  color: white;
  margin-top: 1rem;
  font-size: 1.1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255,255,255,0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .controls {
    justify-content: center;
  }
  
  .main {
    padding: 0.5rem;
  }
  
  .pdf-container {
    padding: 0.5rem;
  }
}
```

### 3. PDF查看器组件 (`src/components/PDFViewer.js`)

```javascript
import * as pdfjsLib from 'pdfjs-dist';

/**
 * PDF查看器类
 */
export class PDFViewer {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    this.context = this.canvas.getContext('2d');
    
    this.pdf = null;
    this.currentPage = 1;
    this.totalPages = 0;
    this.scale = 1.0;
    this.rotation = 0;
    
    // 配置PDF.js Worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    
    // 配置选项
    this.options = {
      cMapUrl: '/cmaps/',
      cMapPacked: true,
      enableXfa: true,
      ...options
    };
    
    this.initializeEventListeners();
  }
  
  /**
   * 初始化事件监听器
   */
  initializeEventListeners() {
    // 文件输入
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    }
    
    // 导航按钮
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    if (prevBtn) prevBtn.addEventListener('click', () => this.previousPage());
    if (nextBtn) nextBtn.addEventListener('click', () => this.nextPage());
    
    // 缩放按钮
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    if (zoomInBtn) zoomInBtn.addEventListener('click', () => this.zoomIn());
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => this.zoomOut());
    
    // 键盘快捷键
    document.addEventListener('keydown', (e) => this.handleKeydown(e));
  }
  
  /**
   * 处理文件选择
   * @param {Event} event - 文件选择事件
   */
  async handleFileSelect(event) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      const arrayBuffer = await file.arrayBuffer();
      await this.loadDocument(arrayBuffer);
    }
  }
  
  /**
   * 加载PDF文档
   * @param {string|ArrayBuffer} source - PDF源
   */
  async loadDocument(source) {
    try {
      this.showLoading(true);
      
      const loadingTask = pdfjsLib.getDocument({
        data: source,
        ...this.options
      });
      
      this.pdf = await loadingTask.promise;
      this.totalPages = this.pdf.numPages;
      this.currentPage = 1;
      
      await this.renderPage();
      this.updateUI();
      
      console.log('PDF加载成功:', {
        pages: this.totalPages,
        title: this.pdf.title || '未知标题'
      });
      
    } catch (error) {
      console.error('PDF加载失败:', error);
      alert('PDF加载失败，请检查文件格式');
    } finally {
      this.showLoading(false);
    }
  }
  
  /**
   * 渲染当前页面
   */
  async renderPage() {
    if (!this.pdf) return;
    
    try {
      const page = await this.pdf.getPage(this.currentPage);
      const viewport = page.getViewport({ 
        scale: this.scale, 
        rotation: this.rotation 
      });
      
      // 设置Canvas尺寸
      const outputScale = window.devicePixelRatio || 1;
      this.canvas.width = Math.floor(viewport.width * outputScale);
      this.canvas.height = Math.floor(viewport.height * outputScale);
      this.canvas.style.width = Math.floor(viewport.width) + 'px';
      this.canvas.style.height = Math.floor(viewport.height) + 'px';
      
      const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;
      
      // 渲染页面
      const renderContext = {
        canvasContext: this.context,
        viewport: viewport,
        transform: transform
      };
      
      await page.render(renderContext).promise;
      
      console.log(`页面 ${this.currentPage} 渲染完成`);
      
    } catch (error) {
      console.error('页面渲染失败:', error);
    }
  }
  
  /**
   * 上一页
   */
  async previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      await this.renderPage();
      this.updateUI();
    }
  }
  
  /**
   * 下一页
   */
  async nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      await this.renderPage();
      this.updateUI();
    }
  }
  
  /**
   * 放大
   */
  async zoomIn() {
    this.scale = Math.min(3.0, this.scale * 1.2);
    await this.renderPage();
    this.updateUI();
  }
  
  /**
   * 缩小
   */
  async zoomOut() {
    this.scale = Math.max(0.5, this.scale / 1.2);
    await this.renderPage();
    this.updateUI();
  }
  
  /**
   * 设置缩放比例
   * @param {number} scale - 缩放比例
   */
  async setScale(scale) {
    this.scale = Math.max(0.5, Math.min(3.0, scale));
    await this.renderPage();
    this.updateUI();
  }
  
  /**
   * 旋转页面
   * @param {number} degrees - 旋转角度
   */
  async rotate(degrees) {
    this.rotation = (this.rotation + degrees) % 360;
    await this.renderPage();
  }
  
  /**
   * 跳转到指定页面
   * @param {number} pageNum - 页面编号
   */
  async goToPage(pageNum) {
    if (pageNum >= 1 && pageNum <= this.totalPages) {
      this.currentPage = pageNum;
      await this.renderPage();
      this.updateUI();
    }
  }
  
  /**
   * 处理键盘事件
   * @param {KeyboardEvent} event - 键盘事件
   */
  handleKeydown(event) {
    switch (event.key) {
      case 'ArrowLeft':
      case 'PageUp':
        event.preventDefault();
        this.previousPage();
        break;
      case 'ArrowRight':
      case 'PageDown':
        event.preventDefault();
        this.nextPage();
        break;
      case '+':
      case '=':
        event.preventDefault();
        this.zoomIn();
        break;
      case '-':
        event.preventDefault();
        this.zoomOut();
        break;
      case 'r':
        if (event.ctrlKey) {
          event.preventDefault();
          this.rotate(90);
        }
        break;
    }
  }
  
  /**
   * 更新UI状态
   */
  updateUI() {
    // 更新页面信息
    const pageInfo = document.getElementById('pageInfo');
    if (pageInfo) {
      pageInfo.textContent = `${this.currentPage} / ${this.totalPages}`;
    }
    
    // 更新缩放信息
    const scaleInfo = document.getElementById('scaleInfo');
    if (scaleInfo) {
      scaleInfo.textContent = `${Math.round(this.scale * 100)}%`;
    }
    
    // 更新按钮状态
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (prevBtn) {
      prevBtn.disabled = this.currentPage <= 1;
    }
    
    if (nextBtn) {
      nextBtn.disabled = this.currentPage >= this.totalPages;
    }
  }
  
  /**
   * 显示/隐藏加载状态
   * @param {boolean} show - 是否显示
   */
  showLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = show ? 'flex' : 'none';
    }
  }
  
  /**
   * 获取文档信息
   * @returns {Promise<Object>} 文档信息
   */
  async getDocumentInfo() {
    if (!this.pdf) return null;
    
    try {
      const metadata = await this.pdf.getMetadata();
      return {
        numPages: this.totalPages,
        info: metadata.info,
        metadata: metadata.metadata ? metadata.metadata.getAll() : null,
        fingerprint: this.pdf.fingerprint
      };
    } catch (error) {
      console.error('获取文档信息失败:', error);
      return null;
    }
  }
  
  /**
   * 销毁查看器
   */
  destroy() {
    if (this.pdf) {
      this.pdf.destroy();
      this.pdf = null;
    }
    
    // 清理Canvas
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
```

### 4. 主入口文件 (`src/index.js`)

```javascript
import './styles.css';
import { PDFViewer } from './components/PDFViewer';

/**
 * 应用程序初始化
 */
class App {
  constructor() {
    this.viewer = null;
    this.init();
  }
  
  /**
   * 初始化应用
   */
  init() {
    // 等待DOM加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }
  
  /**
   * 设置应用
   */
  setup() {
    // 创建PDF查看器
    this.viewer = new PDFViewer('pdfCanvas', {
      cMapUrl: '/cmaps/',
      cMapPacked: true,
      enableXfa: true
    });
    
    // 加载示例PDF（如果存在）
    this.loadSamplePDF();
    
    // 设置错误处理
    this.setupErrorHandling();
    
    console.log('PDF.js Webpack Demo 初始化完成');
  }
  
  /**
   * 加载示例PDF
   */
  async loadSamplePDF() {
    try {
      // 尝试加载示例PDF
      const response = await fetch('/sample.pdf');
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        await this.viewer.loadDocument(arrayBuffer);
      }
    } catch (error) {
      console.log('示例PDF不存在，请选择文件加载');
    }
  }
  
  /**
   * 设置错误处理
   */
  setupErrorHandling() {
    window.addEventListener('error', (event) => {
      console.error('全局错误:', event.error);
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      console.error('未处理的Promise拒绝:', event.reason);
    });
  }
}

// 启动应用
new App();
```

## 高级配置

### 1. 生产环境配置

创建 `webpack.prod.js`：

```javascript
const { merge } = require('webpack-merge');
const common = require('./webpack.config.js');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = merge(common, {
  mode: 'production',
  
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true
          }
        }
      }),
      new CssMinimizerPlugin()
    ],
    
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        },
        pdfjs: {
          test: /[\\/]node_modules[\\/]pdfjs-dist[\\/]/,
          name: 'pdfjs',
          chunks: 'all',
          priority: 10
        }
      }
    }
  },
  
  performance: {
    hints: 'warning',
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
  }
});
```

### 2. 开发环境配置

创建 `webpack.dev.js`：

```javascript
const { merge } = require('webpack-merge');
const common = require('./webpack.config.js');

module.exports = merge(common, {
  mode: 'development',
  
  devtool: 'eval-source-map',
  
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist')
    },
    compress: true,
    port: 8080,
    hot: true,
    open: true,
    historyApiFallback: true,
    client: {
      overlay: {
        errors: true,
        warnings: false
      }
    }
  },
  
  cache: {
    type: 'filesystem'
  }
});
```

### 3. Package.json脚本

```json
{
  "name": "pdfjs-webpack-demo",
  "version": "1.0.0",
  "scripts": {
    "start": "webpack serve --config webpack.dev.js",
    "build": "webpack --config webpack.prod.js",
    "build:dev": "webpack --config webpack.dev.js",
    "clean": "rimraf dist",
    "analyze": "webpack-bundle-analyzer dist/bundle.*.js"
  },
  "dependencies": {
    "pdfjs-dist": "^3.11.174"
  },
  "devDependencies": {
    "webpack": "^5.88.0",
    "webpack-cli": "^5.1.0",
    "webpack-dev-server": "^4.15.0",
    "webpack-merge": "^5.9.0",
    "html-webpack-plugin": "^5.5.0",
    "copy-webpack-plugin": "^11.0.0",
    "css-loader": "^6.8.0",
    "style-loader": "^3.3.0",
    "file-loader": "^6.2.0",
    "terser-webpack-plugin": "^5.3.0",
    "css-minimizer-webpack-plugin": "^5.0.0",
    "webpack-bundle-analyzer": "^4.9.0",
    "rimraf": "^5.0.0"
  }
}
```

## 优化建议

### 1. 代码分割
- 将PDF.js单独打包为vendor chunk
- 使用动态导入延迟加载PDF.js
- 分离CSS文件

### 2. 性能优化
- 启用Webpack缓存
- 使用Tree Shaking移除未使用代码
- 压缩和混淆生产代码

### 3. 资源优化
- 复制必要的PDF.js资源文件
- 配置正确的publicPath
- 使用内容哈希进行缓存控制

### 4. 开发体验
- 配置热模块替换
- 启用源码映射
- 设置错误覆盖层

这个Webpack配置提供了完整的PDF.js集成方案，适合现代Web应用开发。