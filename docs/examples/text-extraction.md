# PDF 文本提取

本示例展示如何使用 PDF.js 提取 PDF 文档中的文本内容，包括基础文本提取、格式化文本、文本搜索和高亮显示等功能。

## 基础文本提取

最简单的文本提取方法：

```javascript
/**
 * 提取PDF页面的文本内容
 * @param {PDFPageProxy} page - PDF页面对象
 * @returns {Promise<string>} 页面文本内容
 */
async function extractPageText(page) {
  try {
    // 获取文本内容
    const textContent = await page.getTextContent();
    
    // 提取文本字符串
    const textItems = textContent.items.map(item => item.str);
    
    // 合并文本
    return textItems.join(' ');
  } catch (error) {
    console.error('文本提取失败:', error);
    return '';
  }
}

// 使用示例
const loadingTask = pdfjsLib.getDocument('document.pdf');
const pdf = await loadingTask.promise;
const page = await pdf.getPage(1);
const text = await extractPageText(page);
console.log('页面文本:', text);
```

## 结构化文本提取

保留文本的位置和格式信息：

```javascript
/**
 * 提取结构化文本内容
 * @param {PDFPageProxy} page - PDF页面对象
 * @returns {Promise<Object>} 结构化文本数据
 */
async function extractStructuredText(page) {
  const textContent = await page.getTextContent();
  const viewport = page.getViewport({ scale: 1.0 });
  
  const textItems = textContent.items.map(item => ({
    text: item.str,
    x: item.transform[4],
    y: viewport.height - item.transform[5], // 转换坐标系
    width: item.width,
    height: item.height,
    fontName: item.fontName,
    fontSize: Math.round(item.transform[0]),
    direction: item.dir
  }));
  
  return {
    pageNumber: page.pageNumber,
    viewport: {
      width: viewport.width,
      height: viewport.height
    },
    items: textItems,
    rawText: textItems.map(item => item.text).join(' ')
  };
}
```

## 按行提取文本

将文本按行组织：

```javascript
/**
 * 按行提取文本内容
 * @param {PDFPageProxy} page - PDF页面对象
 * @param {number} lineThreshold - 行间距阈值
 * @returns {Promise<string[]>} 文本行数组
 */
async function extractTextByLines(page, lineThreshold = 5) {
  const textContent = await page.getTextContent();
  const viewport = page.getViewport({ scale: 1.0 });
  
  // 转换坐标并排序
  const items = textContent.items.map(item => ({
    text: item.str,
    x: item.transform[4],
    y: viewport.height - item.transform[5],
    height: item.height
  })).sort((a, b) => b.y - a.y || a.x - b.x);
  
  // 按行分组
  const lines = [];
  let currentLine = [];
  let lastY = null;
  
  for (const item of items) {
    if (lastY === null || Math.abs(item.y - lastY) <= lineThreshold) {
      currentLine.push(item);
    } else {
      if (currentLine.length > 0) {
        // 按x坐标排序当前行
        currentLine.sort((a, b) => a.x - b.x);
        lines.push(currentLine.map(i => i.text).join(' ').trim());
      }
      currentLine = [item];
    }
    lastY = item.y;
  }
  
  // 添加最后一行
  if (currentLine.length > 0) {
    currentLine.sort((a, b) => a.x - b.x);
    lines.push(currentLine.map(i => i.text).join(' ').trim());
  }
  
  return lines.filter(line => line.length > 0);
}
```

## 文本搜索和高亮

在PDF中搜索特定文本：

```javascript
/**
 * 在PDF页面中搜索文本
 * @param {PDFPageProxy} page - PDF页面对象
 * @param {string} searchText - 搜索文本
 * @param {boolean} caseSensitive - 是否区分大小写
 * @returns {Promise<Object[]>} 搜索结果
 */
async function searchTextInPage(page, searchText, caseSensitive = false) {
  const textContent = await page.getTextContent();
  const viewport = page.getViewport({ scale: 1.0 });
  
  const results = [];
  const searchPattern = caseSensitive ? searchText : searchText.toLowerCase();
  
  // 构建完整文本和位置映射
  let fullText = '';
  const charPositions = [];
  
  for (const item of textContent.items) {
    const itemText = caseSensitive ? item.str : item.str.toLowerCase();
    const startIndex = fullText.length;
    
    for (let i = 0; i < itemText.length; i++) {
      charPositions.push({
        char: itemText[i],
        x: item.transform[4] + (i * item.width / item.str.length),
        y: viewport.height - item.transform[5],
        width: item.width / item.str.length,
        height: item.height,
        itemIndex: textContent.items.indexOf(item)
      });
    }
    
    fullText += itemText;
    if (item.hasEOL) fullText += '\n';
  }
  
  // 搜索匹配项
  let index = 0;
  while ((index = fullText.indexOf(searchPattern, index)) !== -1) {
    const matchPositions = charPositions.slice(index, index + searchPattern.length);
    
    if (matchPositions.length > 0) {
      const firstChar = matchPositions[0];
      const lastChar = matchPositions[matchPositions.length - 1];
      
      results.push({
        text: searchText,
        index: index,
        pageNumber: page.pageNumber,
        bounds: {
          x: firstChar.x,
          y: firstChar.y,
          width: lastChar.x + lastChar.width - firstChar.x,
          height: firstChar.height
        },
        context: fullText.substring(
          Math.max(0, index - 50),
          Math.min(fullText.length, index + searchPattern.length + 50)
        )
      });
    }
    
    index += searchPattern.length;
  }
  
  return results;
}
```

## 多页文本提取

提取整个文档的文本：

```javascript
/**
 * 提取整个PDF文档的文本
 * @param {string} pdfUrl - PDF文件URL
 * @param {Object} options - 提取选项
 * @returns {Promise<Object>} 文档文本数据
 */
async function extractDocumentText(pdfUrl, options = {}) {
  const {
    preserveLines = false,
    includeMetadata = true,
    pageRange = null // { start: 1, end: 10 }
  } = options;
  
  try {
    // 加载文档
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;
    
    const numPages = pdf.numPages;
    const startPage = pageRange?.start || 1;
    const endPage = pageRange?.end || numPages;
    
    const documentData = {
      numPages,
      extractedPages: endPage - startPage + 1,
      pages: [],
      fullText: '',
      metadata: null
    };
    
    // 提取元数据
    if (includeMetadata) {
      const metadata = await pdf.getMetadata();
      documentData.metadata = {
        info: metadata.info,
        metadata: metadata.metadata ? metadata.metadata.getAll() : null
      };
    }
    
    // 提取每页文本
    for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
      const page = await pdf.getPage(pageNum);
      
      let pageText;
      if (preserveLines) {
        const lines = await extractTextByLines(page);
        pageText = lines.join('\n');
      } else {
        pageText = await extractPageText(page);
      }
      
      documentData.pages.push({
        pageNumber: pageNum,
        text: pageText,
        wordCount: pageText.split(/\s+/).filter(word => word.length > 0).length,
        charCount: pageText.length
      });
      
      documentData.fullText += pageText + '\n\n';
      
      // 清理页面资源
      page.cleanup();
    }
    
    // 计算统计信息
    documentData.statistics = {
      totalWords: documentData.pages.reduce((sum, page) => sum + page.wordCount, 0),
      totalChars: documentData.pages.reduce((sum, page) => sum + page.charCount, 0),
      averageWordsPerPage: Math.round(
        documentData.pages.reduce((sum, page) => sum + page.wordCount, 0) / documentData.pages.length
      )
    };
    
    return documentData;
    
  } catch (error) {
    console.error('文档文本提取失败:', error);
    throw error;
  }
}

// 使用示例
const documentText = await extractDocumentText('document.pdf', {
  preserveLines: true,
  includeMetadata: true,
  pageRange: { start: 1, end: 5 }
});

console.log('文档统计:', documentText.statistics);
console.log('总页数:', documentText.numPages);
console.log('提取页数:', documentText.extractedPages);
```

## 文本清理和处理

清理和标准化提取的文本：

```javascript
/**
 * 文本清理工具类
 */
class TextCleaner {
  /**
   * 清理PDF提取的文本
   * @param {string} text - 原始文本
   * @param {Object} options - 清理选项
   * @returns {string} 清理后的文本
   */
  static clean(text, options = {}) {
    const {
      removeExtraSpaces = true,
      removeExtraNewlines = true,
      fixHyphenation = true,
      normalizeUnicode = true,
      removePageNumbers = false
    } = options;
    
    let cleanedText = text;
    
    // Unicode标准化
    if (normalizeUnicode) {
      cleanedText = cleanedText.normalize('NFKC');
    }
    
    // 修复连字符换行
    if (fixHyphenation) {
      cleanedText = cleanedText.replace(/-\s*\n\s*/g, '');
    }
    
    // 移除多余空格
    if (removeExtraSpaces) {
      cleanedText = cleanedText.replace(/[ \t]+/g, ' ');
    }
    
    // 移除多余换行
    if (removeExtraNewlines) {
      cleanedText = cleanedText.replace(/\n\s*\n\s*\n/g, '\n\n');
    }
    
    // 移除页码（简单模式）
    if (removePageNumbers) {
      cleanedText = cleanedText.replace(/^\s*\d+\s*$/gm, '');
    }
    
    return cleanedText.trim();
  }
  
  /**
   * 提取关键词
   * @param {string} text - 文本内容
   * @param {number} minLength - 最小词长
   * @returns {Object} 关键词统计
   */
  static extractKeywords(text, minLength = 3) {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length >= minLength);
    
    const wordCount = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    const sortedWords = Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 50);
    
    return {
      totalWords: words.length,
      uniqueWords: Object.keys(wordCount).length,
      topKeywords: sortedWords
    };
  }
}

// 使用示例
const rawText = await extractPageText(page);
const cleanedText = TextCleaner.clean(rawText, {
  removeExtraSpaces: true,
  fixHyphenation: true,
  normalizeUnicode: true
});

const keywords = TextCleaner.extractKeywords(cleanedText);
console.log('关键词:', keywords.topKeywords.slice(0, 10));
```

## 实用工具函数

```javascript
/**
 * PDF文本提取工具集
 */
const PDFTextUtils = {
  /**
   * 检测文本语言
   * @param {string} text - 文本内容
   * @returns {string} 语言代码
   */
  detectLanguage(text) {
    const sample = text.substring(0, 1000);
    
    // 简单的语言检测
    if (/[\u4e00-\u9fff]/.test(sample)) return 'zh';
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(sample)) return 'ja';
    if (/[\uac00-\ud7af]/.test(sample)) return 'ko';
    if (/[\u0400-\u04ff]/.test(sample)) return 'ru';
    if (/[\u0590-\u05ff]/.test(sample)) return 'he';
    if (/[\u0600-\u06ff]/.test(sample)) return 'ar';
    
    return 'en'; // 默认英语
  },
  
  /**
   * 计算文本相似度
   * @param {string} text1 - 文本1
   * @param {string} text2 - 文本2
   * @returns {number} 相似度 (0-1)
   */
  calculateSimilarity(text1, text2) {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  },
  
  /**
   * 提取文本摘要
   * @param {string} text - 文本内容
   * @param {number} maxSentences - 最大句子数
   * @returns {string} 文本摘要
   */
  extractSummary(text, maxSentences = 3) {
    const sentences = text.split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20);
    
    if (sentences.length <= maxSentences) {
      return sentences.join('. ') + '.';
    }
    
    // 简单的摘要算法：选择最长的句子
    const sortedSentences = sentences
      .sort((a, b) => b.length - a.length)
      .slice(0, maxSentences)
      .sort((a, b) => text.indexOf(a) - text.indexOf(b));
    
    return sortedSentences.join('. ') + '.';
  }
};
```

## 完整示例

### HTML 结构

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PDF.js 文本提取示例</title>
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
            grid-template-columns: 1fr 400px;
            gap: 20px;
        }
        
        .pdf-viewer {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .text-panel {
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
        
        .search-box {
            margin-top: 10px;
            display: flex;
            gap: 10px;
            align-items: center;
        }
        
        .search-box input {
            flex: 1;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        
        .search-results {
            margin-top: 10px;
            font-size: 14px;
            color: #666;
        }
        
        .page-info {
            margin: 0 15px;
            font-weight: bold;
        }
        
        #pdf-canvas {
            display: block;
            margin: 20px auto;
            border: 1px solid #ddd;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            position: relative;
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
            background-color: yellow;
            color: transparent;
        }
        
        .extracted-text {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 15px;
            margin-top: 15px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            line-height: 1.4;
            white-space: pre-wrap;
            max-height: 300px;
            overflow-y: auto;
        }
        
        .text-stats {
            background: #e9ecef;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 15px;
            font-size: 14px;
        }
        
        .text-stats span {
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
        
        .tab-buttons {
            display: flex;
            margin-bottom: 15px;
            border-bottom: 1px solid #dee2e6;
        }
        
        .tab-button {
            padding: 10px 20px;
            border: none;
            background: none;
            cursor: pointer;
            border-bottom: 2px solid transparent;
        }
        
        .tab-button.active {
            border-bottom-color: #007bff;
            color: #007bff;
        }
        
        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
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
            <h1>PDF 文本提取示例</h1>
            
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
                
                <!-- 搜索框 -->
                <div class="search-box">
                    <input type="text" id="search-input" placeholder="输入要搜索的文本..." />
                    <button onclick="searchText()">搜索</button>
                    <button onclick="clearHighlights()">清除高亮</button>
                </div>
                
                <div id="search-results" class="search-results"></div>
            </div>
            
            <!-- 错误信息 -->
            <div id="error-message" class="error" style="display: none;"></div>
            
            <!-- PDF 渲染区域 -->
            <div id="loading" class="loading">请选择或加载 PDF 文件</div>
            <div id="canvas-container" style="position: relative; display: none;">
                <canvas id="pdf-canvas"></canvas>
                <div id="text-layer" class="text-layer"></div>
            </div>
        </div>
        
        <!-- 文本面板 -->
        <div class="text-panel">
            <h2>文本内容</h2>
            
            <!-- 选项卡 -->
            <div class="tab-buttons">
                <button class="tab-button active" onclick="switchTab('raw')">原始文本</button>
                <button class="tab-button" onclick="switchTab('formatted')">格式化文本</button>
                <button class="tab-button" onclick="switchTab('items')">文本项目</button>
            </div>
            
            <!-- 文本统计 -->
            <div id="text-stats" class="text-stats" style="display: none;">
                <span>字符数: <strong id="char-count">0</strong></span>
                <span>单词数: <strong id="word-count">0</strong></span>
                <span>行数: <strong id="line-count">0</strong></span>
            </div>
            
            <!-- 原始文本 -->
            <div id="tab-raw" class="tab-content active">
                <div class="controls">
                    <button onclick="extractCurrentPageText()">提取当前页文本</button>
                    <button onclick="extractAllText()">提取全部文本</button>
                    <button onclick="copyText()">复制文本</button>
                </div>
                <div id="extracted-text" class="extracted-text">暂无文本内容</div>
            </div>
            
            <!-- 格式化文本 -->
            <div id="tab-formatted" class="tab-content">
                <div class="controls">
                    <button onclick="extractFormattedText()">提取格式化文本</button>
                    <button onclick="exportText()">导出文本</button>
                </div>
                <div id="formatted-text" class="extracted-text">暂无格式化文本</div>
            </div>
            
            <!-- 文本项目 -->
            <div id="tab-items" class="tab-content">
                <div class="controls">
                    <button onclick="showTextItems()">显示文本项目</button>
                    <button onclick="analyzeTextStructure()">分析文本结构</button>
                </div>
                <div id="text-items" class="extracted-text">暂无文本项目数据</div>
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
        let allTextContent = [];
        let searchMatches = [];
        let currentSearchIndex = -1;
        
        // DOM 元素
        const canvas = document.getElementById('pdf-canvas');
        const ctx = canvas.getContext('2d');
        const textLayer = document.getElementById('text-layer');
        const fileInput = document.getElementById('file-input');
        const loadingDiv = document.getElementById('loading');
        const errorDiv = document.getElementById('error-message');
        const canvasContainer = document.getElementById('canvas-container');
        
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
                allTextContent = [];
                
                hideLoading();
                showCanvas();
                
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
                
                // 设置文本层尺寸
                textLayer.style.width = viewport.width + 'px';
                textLayer.style.height = viewport.height + 'px';
                
                // 渲染页面
                const renderContext = {
                    canvasContext: ctx,
                    viewport: viewport
                };
                
                const renderTask = page.render(renderContext);
                
                // 同时渲染文本层
                renderTextLayer(page, viewport);
                
                return renderTask.promise;
                
            }).then(function() {
                hideLoading();
                
            }).catch(function(error) {
                hideLoading();
                showError('渲染页面时发生错误: ' + error.message);
            });
        }
        
        // 渲染文本层
        function renderTextLayer(page, viewport) {
            page.getTextContent().then(function(textContent) {
                // 清空文本层
                textLayer.innerHTML = '';
                
                // 创建文本层元素
                textContent.items.forEach(function(textItem) {
                    const textDiv = document.createElement('span');
                    textDiv.textContent = textItem.str;
                    textDiv.style.left = textItem.transform[4] + 'px';
                    textDiv.style.top = (viewport.height - textItem.transform[5]) + 'px';
                    textDiv.style.fontSize = Math.abs(textItem.transform[0]) + 'px';
                    textDiv.style.fontFamily = textItem.fontName;
                    
                    textLayer.appendChild(textDiv);
                });
            });
        }
        
        // 提取当前页文本
        function extractCurrentPageText() {
            if (!currentPageProxy) {
                showError('请先加载 PDF 文档');
                return;
            }
            
            currentPageProxy.getTextContent().then(function(textContent) {
                const text = textContent.items.map(item => item.str).join(' ');
                displayText(text);
                updateTextStats(text);
            }).catch(function(error) {
                showError('提取文本时发生错误: ' + error.message);
            });
        }
        
        // 提取全部文本
        function extractAllText() {
            if (!pdfDoc) {
                showError('请先加载 PDF 文档');
                return;
            }
            
            showLoading('正在提取全部文本...');
            
            const promises = [];
            
            for (let i = 1; i <= pdfDoc.numPages; i++) {
                promises.push(
                    pdfDoc.getPage(i).then(function(page) {
                        return page.getTextContent().then(function(textContent) {
                            return {
                                pageNum: i,
                                text: textContent.items.map(item => item.str).join(' ')
                            };
                        });
                    })
                );
            }
            
            Promise.all(promises).then(function(pages) {
                allTextContent = pages;
                const allText = pages.map(page => `=== 第 ${page.pageNum} 页 ===\n${page.text}`).join('\n\n');
                displayText(allText);
                updateTextStats(allText);
                hideLoading();
            }).catch(function(error) {
                hideLoading();
                showError('提取全部文本时发生错误: ' + error.message);
            });
        }
        
        // 提取格式化文本
        function extractFormattedText() {
            if (!currentPageProxy) {
                showError('请先加载 PDF 文档');
                return;
            }
            
            currentPageProxy.getTextContent().then(function(textContent) {
                let formattedText = '';
                let currentY = null;
                let line = '';
                
                textContent.items.forEach(function(item) {
                    const y = Math.round(item.transform[5]);
                    
                    if (currentY === null) {
                        currentY = y;
                    }
                    
                    // 检测换行
                    if (Math.abs(y - currentY) > 5) {
                        if (line.trim()) {
                            formattedText += line.trim() + '\n';
                        }
                        line = '';
                        currentY = y;
                    }
                    
                    line += item.str;
                });
                
                // 添加最后一行
                if (line.trim()) {
                    formattedText += line.trim();
                }
                
                document.getElementById('formatted-text').textContent = formattedText;
            }).catch(function(error) {
                showError('提取格式化文本时发生错误: ' + error.message);
            });
        }
        
        // 显示文本项目
        function showTextItems() {
            if (!currentPageProxy) {
                showError('请先加载 PDF 文档');
                return;
            }
            
            currentPageProxy.getTextContent().then(function(textContent) {
                let itemsText = '';
                
                textContent.items.forEach(function(item, index) {
                    itemsText += `项目 ${index + 1}:\n`;
                    itemsText += `  文本: "${item.str}"\n`;
                    itemsText += `  位置: (${item.transform[4].toFixed(2)}, ${item.transform[5].toFixed(2)})\n`;
                    itemsText += `  字体大小: ${Math.abs(item.transform[0]).toFixed(2)}\n`;
                    itemsText += `  字体名称: ${item.fontName || 'Unknown'}\n`;
                    itemsText += `  宽度: ${item.width.toFixed(2)}\n`;
                    itemsText += `  高度: ${item.height.toFixed(2)}\n\n`;
                });
                
                document.getElementById('text-items').textContent = itemsText;
            }).catch(function(error) {
                showError('显示文本项目时发生错误: ' + error.message);
            });
        }
        
        // 分析文本结构
        function analyzeTextStructure() {
            if (!currentPageProxy) {
                showError('请先加载 PDF 文档');
                return;
            }
            
            currentPageProxy.getTextContent().then(function(textContent) {
                const analysis = {
                    totalItems: textContent.items.length,
                    fonts: {},
                    sizes: {},
                    positions: []
                };
                
                textContent.items.forEach(function(item) {
                    // 统计字体
                    const fontName = item.fontName || 'Unknown';
                    analysis.fonts[fontName] = (analysis.fonts[fontName] || 0) + 1;
                    
                    // 统计字体大小
                    const fontSize = Math.abs(item.transform[0]).toFixed(1);
                    analysis.sizes[fontSize] = (analysis.sizes[fontSize] || 0) + 1;
                    
                    // 记录位置
                    analysis.positions.push({
                        x: item.transform[4],
                        y: item.transform[5],
                        text: item.str
                    });
                });
                
                let analysisText = `文本结构分析:\n\n`;
                analysisText += `总文本项目数: ${analysis.totalItems}\n\n`;
                
                analysisText += `字体分布:\n`;
                Object.entries(analysis.fonts).forEach(([font, count]) => {
                    analysisText += `  ${font}: ${count} 项\n`;
                });
                
                analysisText += `\n字体大小分布:\n`;
                Object.entries(analysis.sizes).forEach(([size, count]) => {
                    analysisText += `  ${size}px: ${count} 项\n`;
                });
                
                document.getElementById('text-items').textContent = analysisText;
            }).catch(function(error) {
                showError('分析文本结构时发生错误: ' + error.message);
            });
        }
        
        // 搜索文本
        function searchText() {
            const searchTerm = document.getElementById('search-input').value.trim();
            if (!searchTerm) {
                alert('请输入搜索内容');
                return;
            }
            
            if (!currentPageProxy) {
                showError('请先加载 PDF 文档');
                return;
            }
            
            currentPageProxy.getTextContent().then(function(textContent) {
                searchMatches = [];
                currentSearchIndex = -1;
                
                // 清除之前的高亮
                clearHighlights();
                
                // 搜索文本
                const searchRegex = new RegExp(searchTerm, 'gi');
                let fullText = '';
                let charIndex = 0;
                
                textContent.items.forEach(function(item, itemIndex) {
                    const itemText = item.str;
                    let match;
                    
                    while ((match = searchRegex.exec(itemText)) !== null) {
                        searchMatches.push({
                            itemIndex: itemIndex,
                            startIndex: match.index,
                            endIndex: match.index + match[0].length,
                            text: match[0],
                            item: item
                        });
                    }
                    
                    fullText += itemText;
                    charIndex += itemText.length;
                });
                
                // 显示搜索结果
                const resultsDiv = document.getElementById('search-results');
                if (searchMatches.length > 0) {
                    resultsDiv.textContent = `找到 ${searchMatches.length} 个匹配项`;
                    highlightMatches();
                } else {
                    resultsDiv.textContent = '未找到匹配项';
                }
            }).catch(function(error) {
                showError('搜索文本时发生错误: ' + error.message);
            });
        }
        
        // 高亮匹配项
        function highlightMatches() {
            searchMatches.forEach(function(match) {
                const textSpans = textLayer.children;
                if (textSpans[match.itemIndex]) {
                    textSpans[match.itemIndex].classList.add('highlight');
                }
            });
        }
        
        // 清除高亮
        function clearHighlights() {
            const highlightedSpans = textLayer.querySelectorAll('.highlight');
            highlightedSpans.forEach(function(span) {
                span.classList.remove('highlight');
            });
            
            document.getElementById('search-results').textContent = '';
        }
        
        // 复制文本
        function copyText() {
            const textContent = document.getElementById('extracted-text').textContent;
            if (textContent && textContent !== '暂无文本内容') {
                navigator.clipboard.writeText(textContent).then(function() {
                    alert('文本已复制到剪贴板');
                }).catch(function() {
                    // 降级方案
                    const textArea = document.createElement('textarea');
                    textArea.value = textContent;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    alert('文本已复制到剪贴板');
                });
            } else {
                alert('没有可复制的文本内容');
            }
        }
        
        // 导出文本
        function exportText() {
            const textContent = document.getElementById('formatted-text').textContent;
            if (textContent && textContent !== '暂无格式化文本') {
                const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'extracted-text.txt';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } else {
                alert('没有可导出的文本内容');
            }
        }
        
        // 显示文本
        function displayText(text) {
            document.getElementById('extracted-text').textContent = text || '暂无文本内容';
        }
        
        // 更新文本统计
        function updateTextStats(text) {
            if (!text) return;
            
            const charCount = text.length;
            const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
            const lineCount = text.split('\n').length;
            
            document.getElementById('char-count').textContent = charCount;
            document.getElementById('word-count').textContent = wordCount;
            document.getElementById('line-count').textContent = lineCount;
            document.getElementById('text-stats').style.display = 'block';
        }
        
        // 切换选项卡
        function switchTab(tabName) {
            // 隐藏所有选项卡内容
            const tabContents = document.querySelectorAll('.tab-content');
            tabContents.forEach(function(content) {
                content.classList.remove('active');
            });
            
            // 移除所有按钮的活动状态
            const tabButtons = document.querySelectorAll('.tab-button');
            tabButtons.forEach(function(button) {
                button.classList.remove('active');
            });
            
            // 显示选中的选项卡
            document.getElementById('tab-' + tabName).classList.add('active');
            event.target.classList.add('active');
        }
        
        // 上一页
        function prevPage() {
            if (currentPage <= 1) return;
            currentPage--;
            renderPage(currentPage);
            updatePageControls();
            clearHighlights();
        }
        
        // 下一页
        function nextPage() {
            if (!pdfDoc || currentPage >= pdfDoc.numPages) return;
            currentPage++;
            renderPage(currentPage);
            updatePageControls();
            clearHighlights();
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
            canvasContainer.style.display = 'none';
        }
        
        function hideLoading() {
            loadingDiv.style.display = 'none';
        }
        
        function showCanvas() {
            canvasContainer.style.display = 'block';
        }
        
        function showError(message) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
        
        function hideError() {
            errorDiv.style.display = 'none';
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
                case 'f':
                case 'F':
                    if (event.ctrlKey) {
                        event.preventDefault();
                        document.getElementById('search-input').focus();
                    }
                    break;
            }
        });
        
        // 搜索框回车键
        document.getElementById('search-input').addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                searchText();
            }
        });
    </script>
</body>
</html>
```

## 核心功能说明

### 1. 基础文本提取

```javascript
// 获取页面文本内容
page.getTextContent().then(function(textContent) {
    // textContent.items 包含所有文本项目
    const text = textContent.items.map(item => item.str).join(' ');
    console.log(text);
});
```

### 2. 文本项目详细信息

```javascript
// 每个文本项目包含以下信息
textContent.items.forEach(function(item) {
    console.log({
        text: item.str,           // 文本内容
        x: item.transform[4],     // X 坐标
        y: item.transform[5],     // Y 坐标
        width: item.width,        // 宽度
        height: item.height,      // 高度
        fontSize: Math.abs(item.transform[0]), // 字体大小
        fontName: item.fontName   // 字体名称
    });
});
```

### 3. 格式化文本提取

```javascript
function extractFormattedText(textContent) {
    let formattedText = '';
    let currentY = null;
    let line = '';
    
    textContent.items.forEach(function(item) {
        const y = Math.round(item.transform[5]);
        
        // 检测换行（Y坐标变化）
        if (currentY !== null && Math.abs(y - currentY) > 5) {
            if (line.trim()) {
                formattedText += line.trim() + '\n';
            }
            line = '';
        }
        
        line += item.str;
        currentY = y;
    });
    
    return formattedText;
}
```

### 4. 文本搜索和高亮

```javascript
function searchAndHighlight(textContent, searchTerm) {
    const matches = [];
    const searchRegex = new RegExp(searchTerm, 'gi');
    
    textContent.items.forEach(function(item, index) {
        let match;
        while ((match = searchRegex.exec(item.str)) !== null) {
            matches.push({
                itemIndex: index,
                startIndex: match.index,
                endIndex: match.index + match[0].length,
                text: match[0]
            });
        }
    });
    
    return matches;
}
```

### 5. 文本层渲染

```javascript
function renderTextLayer(textContent, viewport) {
    const textLayerDiv = document.getElementById('text-layer');
    textLayerDiv.innerHTML = '';
    
    textContent.items.forEach(function(item) {
        const textDiv = document.createElement('span');
        textDiv.textContent = item.str;
        
        // 设置位置和样式
        textDiv.style.left = item.transform[4] + 'px';
        textDiv.style.top = (viewport.height - item.transform[5]) + 'px';
        textDiv.style.fontSize = Math.abs(item.transform[0]) + 'px';
        textDiv.style.fontFamily = item.fontName;
        
        textLayerDiv.appendChild(textDiv);
    });
}
```

## 高级功能

### 1. 文本结构分析

```javascript
function analyzeTextStructure(textContent) {
    const analysis = {
        fonts: {},
        sizes: {},
        lines: [],
        paragraphs: []
    };
    
    // 按 Y 坐标分组（行）
    const lineGroups = {};
    
    textContent.items.forEach(function(item) {
        const y = Math.round(item.transform[5]);
        if (!lineGroups[y]) {
            lineGroups[y] = [];
        }
        lineGroups[y].push(item);
        
        // 统计字体和大小
        analysis.fonts[item.fontName] = (analysis.fonts[item.fontName] || 0) + 1;
        const fontSize = Math.abs(item.transform[0]);
        analysis.sizes[fontSize] = (analysis.sizes[fontSize] || 0) + 1;
    });
    
    // 按 Y 坐标排序并组合成行
    const sortedYs = Object.keys(lineGroups).map(Number).sort((a, b) => b - a);
    
    sortedYs.forEach(function(y) {
        const lineItems = lineGroups[y].sort((a, b) => a.transform[4] - b.transform[4]);
        const lineText = lineItems.map(item => item.str).join('');
        analysis.lines.push({
            y: y,
            text: lineText,
            items: lineItems
        });
    });
    
    return analysis;
}
```

### 2. 多页面文本提取

```javascript
function extractAllPagesText(pdfDoc) {
    const promises = [];
    
    for (let i = 1; i <= pdfDoc.numPages; i++) {
        promises.push(
            pdfDoc.getPage(i).then(function(page) {
                return page.getTextContent().then(function(textContent) {
                    return {
                        pageNum: i,
                        textContent: textContent,
                        text: textContent.items.map(item => item.str).join(' ')
                    };
                });
            })
        );
    }
    
    return Promise.all(promises);
}
```

### 3. 文本导出功能

```javascript
function exportTextAsFile(text, filename = 'extracted-text.txt') {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
}
```

## 功能特性

- ✅ 单页和多页文本提取
- ✅ 格式化文本处理
- ✅ 文本搜索和高亮
- ✅ 文本层可视化
- ✅ 文本结构分析
- ✅ 字体和样式信息
- ✅ 文本统计功能
- ✅ 文本导出功能
- ✅ 复制到剪贴板
- ✅ 键盘快捷键支持

## 注意事项

1. **文本提取限制**：某些 PDF 可能包含图像文本，需要 OCR 处理
2. **坐标系统**：PDF.js 使用底部为原点的坐标系统
3. **字体信息**：字体名称可能不完整或为内部名称
4. **性能考虑**：大文档的全文提取可能较慢
5. **编码问题**：某些特殊字符可能显示异常

## 相关示例

- [基础渲染](/examples/basic-rendering) - PDF 基础渲染功能
- [注释处理](/examples/annotations) - 处理 PDF 注释
- [表单处理](/examples/forms) - 处理 PDF 表单字段