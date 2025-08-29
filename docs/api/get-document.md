# getDocument

`getDocument` 是 PDF.js 的主要入口点，用于加载和解析 PDF 文档。

## 语法

```javascript
pdfjsLib.getDocument(src)
```

## 参数

### src

- **类型**: `string | URL | TypedArray | PDFDataRangeTransport | DocumentInitParameters`
- **描述**: PDF 文档的源数据

#### 支持的源类型

1. **字符串 URL**
   ```javascript
   pdfjsLib.getDocument('path/to/document.pdf')
   ```

2. **URL 对象**
   ```javascript
   pdfjsLib.getDocument(new URL('https://example.com/document.pdf'))
   ```

3. **TypedArray (Uint8Array)**
   ```javascript
   pdfjsLib.getDocument(uint8Array)
   ```

4. **DocumentInitParameters 对象**
   ```javascript
   pdfjsLib.getDocument({
     url: 'document.pdf',
     httpHeaders: {
       'Authorization': 'Bearer token'
     },
     withCredentials: true
   })
   ```

## DocumentInitParameters

当使用对象形式的参数时，支持以下配置选项：

### 基本选项

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `url` | `string` | - | PDF 文档的 URL |
| `data` | `TypedArray` | - | PDF 文档的二进制数据 |
| `httpHeaders` | `Object` | `{}` | HTTP 请求头 |
| `withCredentials` | `boolean` | `false` | 是否发送凭据 |
| `password` | `string` | - | PDF 文档密码 |

### 高级选项

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `length` | `number` | - | 文档长度（字节） |
| `range` | `PDFDataRangeTransport` | - | 自定义数据传输 |
| `rangeChunkSize` | `number` | `65536` | 分块大小 |
| `worker` | `PDFWorker` | - | 自定义 Worker 实例 |
| `verbosity` | `number` | `1` | 日志详细程度 |
| `docBaseUrl` | `string` | - | 文档基础 URL |
| `cMapUrl` | `string` | - | CMap 文件 URL |
| `cMapPacked` | `boolean` | `false` | CMap 是否压缩 |
| `CMapReaderFactory` | `Function` | - | CMap 读取器工厂 |
| `useSystemFonts` | `boolean` | `true` | 是否使用系统字体 |
| `standardFontDataUrl` | `string` | - | 标准字体数据 URL |
| `useWorkerFetch` | `boolean` | `false` | 是否在 Worker 中使用 fetch |
| `isEvalSupported` | `boolean` | `true` | 是否支持 eval |
| `isOffscreenCanvasSupported` | `boolean` | `true` | 是否支持离屏 Canvas |
| `maxImageSize` | `number` | `-1` | 最大图像尺寸 |
| `disableFontFace` | `boolean` | `false` | 是否禁用字体 |
| `disableRange` | `boolean` | `false` | 是否禁用范围请求 |
| `disableStream` | `boolean` | `false` | 是否禁用流式加载 |
| `disableAutoFetch` | `boolean` | `false` | 是否禁用自动获取 |
| `pdfBug` | `boolean` | `false` | 是否启用调试模式 |

## 返回值

返回一个 `PDFDocumentLoadingTask` 对象，该对象包含：

- **`promise`**: `Promise<PDFDocumentProxy>` - 解析为 PDF 文档代理的 Promise
- **`onProgress`**: `Function` - 设置进度回调函数
- **`onPassword`**: `Function` - 设置密码回调函数
- **`destroy()`**: `Function` - 销毁加载任务

## 使用示例

### 基本用法

```javascript
// 从 URL 加载 PDF
const loadingTask = pdfjsLib.getDocument('document.pdf');
loadingTask.promise.then(function(pdf) {
  console.log('PDF 加载成功');
  console.log('页面数量:', pdf.numPages);
}).catch(function(error) {
  console.error('PDF 加载失败:', error);
});
```

### 带进度监听

```javascript
const loadingTask = pdfjsLib.getDocument('large-document.pdf');

// 监听加载进度
loadingTask.onProgress = function(progress) {
  const percent = (progress.loaded / progress.total * 100).toFixed(2);
  console.log(`加载进度: ${percent}%`);
};

loadingTask.promise.then(function(pdf) {
  console.log('PDF 加载完成');
});
```

### 处理密码保护的 PDF

```javascript
const loadingTask = pdfjsLib.getDocument('protected.pdf');

// 处理密码请求
loadingTask.onPassword = function(callback, reason) {
  if (reason === pdfjsLib.PasswordResponses.NEED_PASSWORD) {
    const password = prompt('请输入PDF密码:');
    callback(password);
  } else if (reason === pdfjsLib.PasswordResponses.INCORRECT_PASSWORD) {
    const password = prompt('密码错误，请重新输入:');
    callback(password);
  }
};

loadingTask.promise.then(function(pdf) {
  console.log('PDF 解锁成功');
});
```

### 使用自定义配置

```javascript
const loadingTask = pdfjsLib.getDocument({
  url: 'document.pdf',
  httpHeaders: {
    'Authorization': 'Bearer your-token',
    'Custom-Header': 'value'
  },
  withCredentials: true,
  cMapUrl: '/cmaps/',
  cMapPacked: true,
  verbosity: 0 // 禁用日志
});

loadingTask.promise.then(function(pdf) {
  console.log('PDF 加载成功');
});
```

### 从二进制数据加载

```javascript
// 从文件输入获取数据
const fileInput = document.getElementById('file-input');
fileInput.addEventListener('change', function(event) {
  const file = event.target.files[0];
  const fileReader = new FileReader();
  
  fileReader.onload = function() {
    const typedArray = new Uint8Array(this.result);
    const loadingTask = pdfjsLib.getDocument(typedArray);
    
    loadingTask.promise.then(function(pdf) {
      console.log('从文件加载PDF成功');
    });
  };
  
  fileReader.readAsArrayBuffer(file);
});
```

## 错误处理

常见的错误类型：

```javascript
loadingTask.promise.catch(function(error) {
  if (error instanceof pdfjsLib.InvalidPDFException) {
    console.error('无效的PDF文件');
  } else if (error instanceof pdfjsLib.MissingPDFException) {
    console.error('PDF文件不存在');
  } else if (error instanceof pdfjsLib.UnexpectedResponseException) {
    console.error('网络请求异常');
  } else {
    console.error('其他错误:', error);
  }
});
```

## 注意事项

1. **Worker 配置**: 在使用前需要配置 Worker 路径
   ```javascript
   pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';
   ```

2. **内存管理**: 使用完毕后应该销毁文档以释放内存
   ```javascript
   pdf.destroy();
   ```

3. **跨域问题**: 加载跨域 PDF 时需要正确配置 CORS

4. **大文件处理**: 对于大文件，建议启用流式加载和范围请求

## 相关 API

- [PDFDocumentProxy](/api/pdf-document-proxy) - PDF 文档代理对象
- [GlobalWorkerOptions](/api/global-worker-options) - 全局配置选项
- [PDFWorker](/api/pdf-worker) - Worker 管理