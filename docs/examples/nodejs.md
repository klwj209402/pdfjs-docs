# Node.js 服务端示例

PDF.js 可以在 Node.js 环境中运行，用于服务端PDF处理和信息提取。

## 基础信息提取

获取PDF文档的基本信息和文本内容：

```javascript
// getinfo.mjs
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

/**
 * 提取PDF文档信息和文本内容
 * @param {string} pdfPath - PDF文件路径
 */
async function extractPDFInfo(pdfPath) {
  try {
    // 加载PDF文档
    const loadingTask = getDocument(pdfPath);
    const doc = await loadingTask.promise;
    
    const numPages = doc.numPages;
    console.log("# Document Loaded");
    console.log("Number of Pages: " + numPages);
    console.log();

    // 获取文档元数据
    const metadata = await doc.getMetadata();
    console.log("# Metadata Is Loaded");
    console.log("## Info");
    console.log(JSON.stringify(metadata.info, null, 2));
    console.log();
    
    if (metadata.metadata) {
      console.log("## Metadata");
      console.log(JSON.stringify(metadata.metadata.getAll(), null, 2));
      console.log();
    }

    // 处理每一页
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      await processPage(doc, pageNum);
    }
    
    console.log("# End of Document");
  } catch (error) {
    console.error("Error: " + error);
  }
}

/**
 * 处理单个页面
 * @param {PDFDocumentProxy} doc - PDF文档对象
 * @param {number} pageNum - 页面编号
 */
async function processPage(doc, pageNum) {
  const page = await doc.getPage(pageNum);
  console.log("# Page " + pageNum);
  
  // 获取页面尺寸
  const viewport = page.getViewport({ scale: 1.0 });
  console.log("Size: " + viewport.width + "x" + viewport.height);
  console.log();
  
  // 提取文本内容
  const textContent = await page.getTextContent();
  const strings = textContent.items.map(item => item.str);
  console.log("## Text Content");
  console.log(strings.join(" "));
  
  // 释放页面资源
  page.cleanup();
  console.log();
}

// 使用示例
const pdfPath = process.argv[2] || "./sample.pdf";
extractPDFInfo(pdfPath);
```

## PDF转PNG工具

将PDF页面转换为PNG图片：

```javascript
// pdf2png.mjs
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { createCanvas } from "canvas";
import fs from "fs";
import path from "path";

/**
 * PDF转PNG工具类
 */
class PDF2PNG {
  constructor(options = {}) {
    this.scale = options.scale || 2.0;
    this.outputDir = options.outputDir || './output';
    this.format = options.format || 'png';
  }

  /**
   * 转换PDF文件
   * @param {string} pdfPath - PDF文件路径
   * @param {Object} options - 转换选项
   */
  async convert(pdfPath, options = {}) {
    try {
      // 确保输出目录存在
      if (!fs.existsSync(this.outputDir)) {
        fs.mkdirSync(this.outputDir, { recursive: true });
      }

      // 加载PDF文档
      const loadingTask = getDocument(pdfPath);
      const pdfDocument = await loadingTask.promise;
      
      const numPages = pdfDocument.numPages;
      console.log(`开始转换 ${numPages} 页PDF文档...`);

      // 转换每一页
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        await this.convertPage(pdfDocument, pageNum, pdfPath);
        console.log(`页面 ${pageNum}/${numPages} 转换完成`);
      }
      
      console.log('PDF转换完成!');
    } catch (error) {
      console.error('转换失败:', error);
    }
  }

  /**
   * 转换单个页面
   * @param {PDFDocumentProxy} pdfDocument - PDF文档对象
   * @param {number} pageNum - 页面编号
   * @param {string} pdfPath - PDF文件路径
   */
  async convertPage(pdfDocument, pageNum, pdfPath) {
    const page = await pdfDocument.getPage(pageNum);
    const viewport = page.getViewport({ scale: this.scale });
    
    // 创建Canvas
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');
    
    // 渲染页面
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };
    
    await page.render(renderContext).promise;
    
    // 保存图片
    const fileName = `${path.basename(pdfPath, '.pdf')}_page_${pageNum}.${this.format}`;
    const outputPath = path.join(this.outputDir, fileName);
    
    const buffer = canvas.toBuffer(`image/${this.format}`);
    fs.writeFileSync(outputPath, buffer);
    
    // 清理资源
    page.cleanup();
  }
}

// 使用示例
const converter = new PDF2PNG({
  scale: 2.0,
  outputDir: './images',
  format: 'png'
});

const pdfPath = process.argv[2];
if (pdfPath) {
  converter.convert(pdfPath);
} else {
  console.log('使用方法: node pdf2png.mjs <pdf文件路径>');
}
```

## 文本提取服务

创建一个HTTP服务来提取PDF文本：

```javascript
// text-extractor-server.mjs
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * PDF文本提取服务
 */
class PDFTextExtractorServer {
  constructor(port = 3000) {
    this.port = port;
    this.server = http.createServer(this.handleRequest.bind(this));
  }

  /**
   * 处理HTTP请求
   * @param {http.IncomingMessage} req - 请求对象
   * @param {http.ServerResponse} res - 响应对象
   */
  async handleRequest(req, res) {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.method === 'POST' && req.url === '/extract') {
      await this.handleExtractRequest(req, res);
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not Found' }));
    }
  }

  /**
   * 处理文本提取请求
   * @param {http.IncomingMessage} req - 请求对象
   * @param {http.ServerResponse} res - 响应对象
   */
  async handleExtractRequest(req, res) {
    try {
      // 读取请求体
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);
      
      // 提取文本
      const result = await this.extractTextFromBuffer(buffer);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (error) {
      console.error('提取失败:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  }

  /**
   * 从Buffer中提取PDF文本
   * @param {Buffer} buffer - PDF文件Buffer
   * @returns {Object} 提取结果
   */
  async extractTextFromBuffer(buffer) {
    const loadingTask = getDocument({ data: buffer });
    const pdfDocument = await loadingTask.promise;
    
    const numPages = pdfDocument.numPages;
    const pages = [];
    
    // 提取每页文本
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map(item => item.str)
        .join(' ')
        .trim();
      
      pages.push({
        pageNumber: pageNum,
        text: pageText,
        wordCount: pageText.split(/\s+/).length
      });
      
      page.cleanup();
    }
    
    // 获取文档信息
    const metadata = await pdfDocument.getMetadata();
    
    return {
      success: true,
      document: {
        numPages,
        info: metadata.info,
        metadata: metadata.metadata ? metadata.metadata.getAll() : null
      },
      pages,
      totalText: pages.map(p => p.text).join('\n'),
      totalWords: pages.reduce((sum, p) => sum + p.wordCount, 0)
    };
  }

  /**
   * 启动服务器
   */
  start() {
    this.server.listen(this.port, () => {
      console.log(`PDF文本提取服务已启动: http://localhost:${this.port}`);
      console.log('使用方法: POST /extract (发送PDF文件作为请求体)');
    });
  }
}

// 启动服务
const server = new PDFTextExtractorServer(3000);
server.start();
```

## 批量处理工具

批量处理多个PDF文件：

```javascript
// batch-processor.mjs
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import fs from 'fs';
import path from 'path';

/**
 * PDF批量处理工具
 */
class PDFBatchProcessor {
  constructor(options = {}) {
    this.inputDir = options.inputDir || './input';
    this.outputDir = options.outputDir || './output';
    this.concurrency = options.concurrency || 3;
  }

  /**
   * 批量处理PDF文件
   */
  async processBatch() {
    try {
      // 获取所有PDF文件
      const pdfFiles = this.getPDFFiles();
      console.log(`找到 ${pdfFiles.length} 个PDF文件`);
      
      // 确保输出目录存在
      if (!fs.existsSync(this.outputDir)) {
        fs.mkdirSync(this.outputDir, { recursive: true });
      }
      
      // 分批处理
      const results = [];
      for (let i = 0; i < pdfFiles.length; i += this.concurrency) {
        const batch = pdfFiles.slice(i, i + this.concurrency);
        const batchResults = await Promise.all(
          batch.map(file => this.processFile(file))
        );
        results.push(...batchResults);
        
        console.log(`已处理 ${Math.min(i + this.concurrency, pdfFiles.length)}/${pdfFiles.length} 个文件`);
      }
      
      // 生成汇总报告
      this.generateReport(results);
      console.log('批量处理完成!');
      
    } catch (error) {
      console.error('批量处理失败:', error);
    }
  }

  /**
   * 获取目录中的所有PDF文件
   * @returns {string[]} PDF文件路径数组
   */
  getPDFFiles() {
    const files = fs.readdirSync(this.inputDir);
    return files
      .filter(file => path.extname(file).toLowerCase() === '.pdf')
      .map(file => path.join(this.inputDir, file));
  }

  /**
   * 处理单个PDF文件
   * @param {string} filePath - PDF文件路径
   * @returns {Object} 处理结果
   */
  async processFile(filePath) {
    const fileName = path.basename(filePath);
    console.log(`正在处理: ${fileName}`);
    
    try {
      const loadingTask = getDocument(filePath);
      const pdfDocument = await loadingTask.promise;
      
      // 提取基本信息
      const numPages = pdfDocument.numPages;
      const metadata = await pdfDocument.getMetadata();
      
      // 提取文本
      let totalText = '';
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        totalText += pageText + '\n';
        page.cleanup();
      }
      
      // 保存结果
      const outputFile = path.join(
        this.outputDir,
        `${path.basename(fileName, '.pdf')}.txt`
      );
      fs.writeFileSync(outputFile, totalText, 'utf8');
      
      return {
        fileName,
        success: true,
        numPages,
        textLength: totalText.length,
        wordCount: totalText.split(/\s+/).length,
        info: metadata.info,
        outputFile
      };
      
    } catch (error) {
      console.error(`处理 ${fileName} 失败:`, error.message);
      return {
        fileName,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 生成处理报告
   * @param {Object[]} results - 处理结果数组
   */
  generateReport(results) {
    const report = {
      timestamp: new Date().toISOString(),
      totalFiles: results.length,
      successCount: results.filter(r => r.success).length,
      failureCount: results.filter(r => !r.success).length,
      totalPages: results.reduce((sum, r) => sum + (r.numPages || 0), 0),
      totalWords: results.reduce((sum, r) => sum + (r.wordCount || 0), 0),
      files: results
    };
    
    const reportFile = path.join(this.outputDir, 'batch-report.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    console.log('\n=== 处理报告 ===');
    console.log(`总文件数: ${report.totalFiles}`);
    console.log(`成功: ${report.successCount}`);
    console.log(`失败: ${report.failureCount}`);
    console.log(`总页数: ${report.totalPages}`);
    console.log(`总字数: ${report.totalWords}`);
    console.log(`报告已保存: ${reportFile}`);
  }
}

// 使用示例
const processor = new PDFBatchProcessor({
  inputDir: './pdfs',
  outputDir: './extracted',
  concurrency: 3
});

processor.processBatch();
```

## 安装依赖

```json
{
  "name": "pdf-nodejs-examples",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "pdfjs-dist": "^3.11.174",
    "canvas": "^2.11.2"
  },
  "scripts": {
    "extract-info": "node getinfo.mjs",
    "convert-png": "node pdf2png.mjs",
    "start-server": "node text-extractor-server.mjs",
    "batch-process": "node batch-processor.mjs"
  }
}
```

## 使用方法

```bash
# 安装依赖
npm install

# 提取PDF信息
node getinfo.mjs document.pdf

# 转换PDF为PNG
node pdf2png.mjs document.pdf

# 启动文本提取服务
node text-extractor-server.mjs

# 批量处理PDF文件
node batch-processor.mjs
```

## 注意事项

1. **模块导入**：使用`pdfjs-dist/legacy/build/pdf.mjs`进行导入
2. **Canvas依赖**：图片转换需要安装`canvas`包
3. **内存管理**：处理大文件时注意内存使用
4. **错误处理**：添加适当的错误处理和重试机制
5. **性能优化**：合理设置并发数量避免资源耗尽