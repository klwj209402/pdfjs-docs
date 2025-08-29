# PDF.js 核心 API 说明

本文档基于 PDF.js 源码中的 `src/display/api.js` 文件，详细说明了 PDF.js 的核心 API 接口和使用方法。

## 目录

- [getDocument 函数](#getdocument-函数)
- [DocumentInitParameters 参数](#documentinitparameters-参数)
- [PDFDocumentLoadingTask 类](#pdfdocumentloadingtask-类)
- [PDFDataRangeTransport 类](#pdfdatarangetransport-类)
- [PDFDocumentProxy 类](#pdfdocumentproxy-类)
- [PDFPageProxy 类](#pdfpageproxy-类)
- [PDFWorker 类](#pdfworker-类)
- [类型定义](#类型定义)

## getDocument 函数

这是加载 PDF 文档并与其交互的主要入口点。

### 语法

```javascript
function getDocument(src = {})
```

### 参数

- `src` - 可以是以下类型之一：
  - `string | URL` - PDF 文件的 URL
  - `TypedArray | ArrayBuffer` - 已填充数据的类型化数组
  - `DocumentInitParameters` - 参数对象

### 返回值

返回 `PDFDocumentLoadingTask` 实例。

### 示例

```javascript
// 从 URL 加载
const loadingTask = pdfjsLib.getDocument('path/to/document.pdf');

// 从数据加载
const data = new Uint8Array(pdfData);
const loadingTask = pdfjsLib.getDocument({ data });

// 使用完整参数
const loadingTask = pdfjsLib.getDocument({
  url: 'path/to/document.pdf',
  httpHeaders: {
    'Authorization': 'Bearer token'
  },
  withCredentials: true,
  password: 'document-password'
});
```

## DocumentInitParameters 参数

文档初始化和加载参数对象的详细配置选项。

### 基本参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `url` | `string \| URL` | - | PDF 文件的 URL |
| `data` | `TypedArray \| ArrayBuffer \| Array<number> \| string` | - | 二进制 PDF 数据 |
| `httpHeaders` | `Object` | `null` | 基本认证头信息 |
| `withCredentials` | `boolean` | `false` | 是否使用凭据进行跨站请求 |
| `password` | `string` | `null` | 解密受密码保护的 PDF |
| `length` | `number` | - | PDF 文件长度，用于进度报告 |

### 网络和传输参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `range` | `PDFDataRangeTransport` | `null` | 自定义范围传输实现 |
| `rangeChunkSize` | `number` | `65536` | 每个范围请求的最大字节数 |
| `disableRange` | `boolean` | `false` | 禁用 PDF 文件的范围请求加载 |
| `disableStream` | `boolean` | `false` | 禁用 PDF 文件数据流 |
| `disableAutoFetch` | `boolean` | `false` | 禁用 PDF 文件数据的预取 |

### 工作线程和资源参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `worker` | `PDFWorker` | `null` | 用于加载和解析 PDF 数据的工作线程 |
| `verbosity` | `number` | - | 控制日志级别 |
| `cMapUrl` | `string` | - | 预定义 Adobe CMap 的位置 |
| `cMapPacked` | `boolean` | `true` | Adobe CMap 是否为二进制打包 |
| `useWorkerFetch` | `boolean` | 根据环境 | 在工作线程中使用 Fetch API |

### 字体和渲染参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `useSystemFonts` | `boolean` | 根据环境 | 使用系统字体作为后备 |
| `standardFontDataUrl` | `string` | - | 标准字体文件的位置 |
| `disableFontFace` | `boolean` | 根据环境 | 禁用字体加载 API |
| `fontExtraProperties` | `boolean` | `false` | 包含额外的字体属性 |
| `enableXfa` | `boolean` | `false` | 渲染 XFA 表单 |

### 性能和优化参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `maxImageSize` | `number` | `-1` | 最大允许的图像大小（像素） |
| `isEvalSupported` | `boolean` | `true` | 是否支持 JavaScript 评估 |
| `isOffscreenCanvasSupported` | `boolean` | 根据环境 | 是否支持 OffscreenCanvas |
| `isImageDecoderSupported` | `boolean` | 根据环境 | 是否支持 ImageDecoder |
| `canvasMaxAreaInBytes` | `number` | `-1` | Canvas 最大区域字节数 |
| `useWasm` | `boolean` | `true` | 尝试使用 WebAssembly |
| `enableHWA` | `boolean` | `false` | 启用硬件加速渲染 |

## PDFDocumentLoadingTask 类

控制加载 PDF 文档所需操作的加载任务类。

### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `docId` | `string` | 文档加载任务的唯一标识符 |
| `destroyed` | `boolean` | 加载任务是否已销毁 |
| `promise` | `Promise<PDFDocumentProxy>` | 文档加载任务完成的 Promise |

### 回调函数

| 回调 | 类型 | 说明 |
|------|------|------|
| `onPassword` | `function` | 请求密码的回调函数 |
| `onProgress` | `function` | 监控加载进度的回调函数 |

### 方法

#### destroy()

中止所有网络请求并销毁工作线程。

```javascript
async destroy(): Promise<void>
```

#### getData()

尝试获取 PDF 文档的原始数据。

```javascript
async getData(): Promise<Uint8Array>
```

### 示例

```javascript
const loadingTask = pdfjsLib.getDocument('document.pdf');

// 设置进度回调
loadingTask.onProgress = function(progress) {
  console.log(`加载进度: ${progress.loaded}/${progress.total}`);
};

// 设置密码回调
loadingTask.onPassword = function(callback, reason) {
  const password = prompt('请输入PDF密码:');
  callback(password);
};

// 获取文档
loadingTask.promise.then(function(pdf) {
  console.log('PDF加载完成');
  console.log('页数:', pdf.numPages);
}).catch(function(error) {
  console.error('加载失败:', error);
});
```

## PDFDataRangeTransport 类

支持范围请求文件加载的抽象类。

### 构造函数

```javascript
constructor(length, initialData, progressiveDone = false, contentDispositionFilename = null)
```

### 参数

- `length` - 文件长度
- `initialData` - 初始数据
- `progressiveDone` - 是否渐进完成
- `contentDispositionFilename` - 内容处置文件名

### 方法

#### addRangeListener(listener)

添加范围监听器。

#### addProgressListener(listener)

添加进度监听器。

#### requestDataRange(begin, end)

请求数据范围（抽象方法，需要子类实现）。

## PDFDocumentProxy 类

工作线程中 `PDFDocument` 的代理类。

### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `numPages` | `number` | PDF 文件的总页数 |
| `fingerprints` | `Array<string \| null>` | 用于标识 PDF 文档的唯一 ID |
| `isPureXfa` | `boolean` | 是否仅为 XFA 表单 |
| `allXfaHtml` | `Object \| null` | 表示 XFA 的 HTML 树结构对象 |
| `annotationStorage` | `AnnotationStorage` | 表单中注释数据的存储 |
| `loadingParams` | `DocumentInitParameters` | 当前文档初始化参数的子集 |
| `loadingTask` | `PDFDocumentLoadingTask` | 当前文档的加载任务 |

### 页面相关方法

#### getPage(pageNumber)

获取指定页面。

```javascript
getPage(pageNumber: number): Promise<PDFPageProxy>
```

#### getPageIndex(ref)

根据页面引用获取页面索引。

```javascript
getPageIndex(ref: RefProxy): Promise<number>
```

### 导航和目标方法

#### getDestinations()

获取所有命名目标的映射。

```javascript
getDestinations(): Promise<Object<string, Array<any>>>
```

#### getDestination(id)

获取指定命名目标的信息。

```javascript
getDestination(id: string): Promise<Array<any> | null>
```

#### getOutline()

获取文档大纲（书签）。

```javascript
getOutline(): Promise<Array<OutlineNode>>
```

### 文档信息方法

#### getMetadata()

获取文档元数据。

```javascript
getMetadata(): Promise<{ info: Object, metadata: Metadata }>
```

#### getPermissions()

获取文档权限标志。

```javascript
getPermissions(): Promise<Array<number> | null>
```

#### getAttachments()

获取文档附件。

```javascript
getAttachments(): Promise<any>
```

### 表单和注释方法

#### getFieldObjects()

获取 AcroForm 字段数据。

```javascript
getFieldObjects(): Promise<Object<string, Array<Object>> | null>
```

#### getJSActions()

获取 JavaScript 操作。

```javascript
getJSActions(): Promise<Object | null>
```

#### hasJSActions()

检查是否有 JavaScript 操作。

```javascript
hasJSActions(): Promise<boolean>
```

### 数据和清理方法

#### getData()

获取 PDF 文档的原始数据。

```javascript
getData(): Promise<Uint8Array>
```

#### saveDocument()

获取保存文档的完整数据。

```javascript
saveDocument(): Promise<Uint8Array>
```

#### cleanup(keepLoadedFonts)

清理文档分配的资源。

```javascript
cleanup(keepLoadedFonts: boolean = false): Promise
```

#### destroy()

销毁当前文档实例并终止工作线程。

```javascript
destroy(): Promise
```

### 示例

```javascript
// 获取文档基本信息
pdf.getMetadata().then(function(metadata) {
  console.log('标题:', metadata.info.Title);
  console.log('作者:', metadata.info.Author);
  console.log('创建日期:', metadata.info.CreationDate);
});

// 获取页面
pdf.getPage(1).then(function(page) {
  console.log('第一页加载完成');
  console.log('页面旋转角度:', page.rotate);
  console.log('页面尺寸:', page.view);
});

// 获取大纲
pdf.getOutline().then(function(outline) {
  if (outline) {
    console.log('文档大纲:', outline);
  } else {
    console.log('文档没有大纲');
  }
});
```

## PDFPageProxy 类

工作线程中 `PDFPage` 的代理类。

### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `pageNumber` | `number` | 页面编号（从1开始） |
| `rotate` | `number` | 页面顺时针旋转的度数 |
| `ref` | `RefProxy \| null` | 指向此页面的引用 |
| `userUnit` | `number` | 用户单位的默认大小（1/72英寸） |
| `view` | `Array<number>` | 页面可见部分的用户空间单位 [x1, y1, x2, y2] |
| `isPureXfa` | `boolean` | 是否仅为 XFA 表单 |

### 视口方法

#### getViewport(params)

获取页面视口。

```javascript
getViewport({
  scale: number,
  rotation?: number,
  offsetX?: number,
  offsetY?: number,
  dontFlip?: boolean
}): PageViewport
```

### 渲染方法

#### render(params)

开始将页面渲染到所需的上下文。

```javascript
render({
  canvasContext?: CanvasRenderingContext2D,
  canvas?: HTMLCanvasElement,
  viewport: PageViewport,
  intent?: string,
  annotationMode?: number,
  transform?: Array<any>,
  background?: string,
  optionalContentConfigPromise?: Promise<OptionalContentConfig>,
  annotationCanvasMap?: Map<string, HTMLCanvasElement>,
  pageColors?: Object,
  printAnnotationStorage?: PrintAnnotationStorage,
  isEditing?: boolean
}): RenderTask
```

### 内容提取方法

#### getTextContent(params)

获取页面文本内容。

```javascript
getTextContent({
  includeMarkedContent?: boolean,
  disableNormalization?: boolean
}): Promise<TextContent>
```

#### streamTextContent(params)

以流的方式获取文本内容。

```javascript
streamTextContent({
  includeMarkedContent?: boolean,
  disableNormalization?: boolean
}): ReadableStream
```

#### getAnnotations(params)

获取页面注释。

```javascript
getAnnotations({
  intent?: string
}): Promise<Array<any>>
```

#### getStructTree()

获取页面结构树。

```javascript
getStructTree(): Promise<StructTreeNode>
```

### 操作列表方法

#### getOperatorList(params)

获取页面操作列表。

```javascript
getOperatorList({
  intent?: string,
  annotationMode?: number,
  printAnnotationStorage?: PrintAnnotationStorage,
  isEditing?: boolean
}): Promise<PDFOperatorList>
```

### 清理方法

#### cleanup(resetStats)

清理页面分配的资源。

```javascript
cleanup(resetStats: boolean = false): boolean
```

### 示例

```javascript
// 渲染页面
const viewport = page.getViewport({ scale: 1.5 });
const canvas = document.getElementById('pdf-canvas');
const context = canvas.getContext('2d');

canvas.height = viewport.height;
canvas.width = viewport.width;

const renderTask = page.render({
  canvasContext: context,
  viewport: viewport
});

renderTask.promise.then(function() {
  console.log('页面渲染完成');
});

// 获取文本内容
page.getTextContent().then(function(textContent) {
  const textItems = textContent.items;
  const text = textItems.map(item => item.str).join(' ');
  console.log('页面文本:', text);
});

// 获取注释
page.getAnnotations().then(function(annotations) {
  console.log('页面注释数量:', annotations.length);
  annotations.forEach(function(annotation) {
    console.log('注释类型:', annotation.subtype);
  });
});
```

## PDFWorker 类

PDF.js Web Worker 抽象类，控制 PDF 文档的实例化。

### 静态方法

#### create(params)

创建 PDFWorker 实例。

```javascript
static create(params: PDFWorkerParameters): PDFWorker
```

#### workerSrc

获取当前 workerSrc。

```javascript
static get workerSrc(): string
```

### 实例属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `name` | `string` | Worker 名称 |
| `destroyed` | `boolean` | 是否已销毁 |
| `promise` | `Promise<void>` | Worker 初始化完成的 Promise |
| `port` | `Worker` | 当前 workerPort |
| `messageHandler` | `MessageHandler` | 当前 MessageHandler 实例 |

### 方法

#### destroy()

销毁 Worker 实例。

```javascript
destroy(): void
```

### 示例

```javascript
// 创建自定义 Worker
const worker = pdfjsLib.PDFWorker.create({
  name: 'my-pdf-worker',
  verbosity: pdfjsLib.VerbosityLevel.INFOS
});

// 使用自定义 Worker 加载文档
const loadingTask = pdfjsLib.getDocument({
  url: 'document.pdf',
  worker: worker
});
```

## 类型定义

### TypedArray

```typescript
type TypedArray = Int8Array | Uint8Array | Uint8ClampedArray |
                  Int16Array | Uint16Array |
                  Int32Array | Uint32Array | Float32Array |
                  Float64Array;
```

### RefProxy

```typescript
interface RefProxy {
  num: number;
  gen: number;
}
```

### OnProgressParameters

```typescript
interface OnProgressParameters {
  loaded: number;  // 当前已加载的字节数
  total: number;   // PDF文件的总字节数
}
```

### TextContent

```typescript
interface TextContent {
  items: Array<TextItem | TextMarkedContent>;
  styles: Object<string, TextStyle>;
  lang: string | null;
}
```

### TextItem

```typescript
interface TextItem {
  str: string;           // 文本内容
  dir: string;           // 文本方向: 'ttb', 'ltr' 或 'rtl'
  transform: Array<any>; // 变换矩阵
  width: number;         // 设备空间中的宽度
  height: number;        // 设备空间中的高度
  fontName: string;      // PDF.js使用的字体名称
  hasEOL: boolean;       // 是否跟随换行符
}
```

### OutlineNode

```typescript
interface OutlineNode {
  title: string;
  bold: boolean;
  italic: boolean;
  color: Uint8ClampedArray;  // RGB格式的颜色
  dest: string | Array<any> | null;
  url: string | null;
  unsafeUrl?: string;
  newWindow?: boolean;
  count?: number;
  items: Array<OutlineNode>;
}
```

## 注意事项

1. **内存管理**: 使用完毕后应调用 `cleanup()` 或 `destroy()` 方法释放资源。

2. **异步操作**: 大部分 API 都返回 Promise，需要正确处理异步操作。

3. **错误处理**: 应该为所有 Promise 添加错误处理。

4. **跨域请求**: 从 URL 加载 PDF 时需要遵循同源策略或配置 CORS。

5. **Worker 线程**: 建议使用 Worker 线程来提高性能，特别是处理大型 PDF 文件时。

6. **类型化数组**: 使用 TypedArray（如 Uint8Array）可以提高内存使用效率。

## 相关链接

- [PDF.js 官方文档](https://mozilla.github.io/pdf.js/)
- [API 示例](../examples/)
- [快速开始指南](../guide/getting-started.md)