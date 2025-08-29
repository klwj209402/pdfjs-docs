# PDF.js 内置组件

PDF.js 提供了一系列内置组件，可以快速构建功能完整的PDF查看器。

## 简单查看器 (SimpleViewer)

使用PDF.js内置的查看器组件创建一个功能完整的PDF查看器：

```html
<!DOCTYPE html>
<html dir="ltr" mozdisallowselectionprint>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <meta name="google" content="notranslate">
  <title>PDF.js viewer using built components</title>

  <style>
    body {
      background-color: #808080;
      margin: 0;
      padding: 0;
    }
    #viewerContainer {
      overflow: auto;
      position: absolute;
      width: 100%;
      height: 100%;
    }
  </style>

  <link rel="stylesheet" href="path/to/pdf_viewer.css">
  <script src="path/to/pdf.mjs" type="module"></script>
  <script src="path/to/pdf_viewer.mjs" type="module"></script>
</head>

<body tabindex="1">
  <div id="viewerContainer">
    <div id="viewer" class="pdfViewer"></div>
  </div>

  <script type="module">
    // 配置Worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'path/to/pdf.worker.mjs';

    // 创建事件总线
    const eventBus = new pdfjsViewer.EventBus();

    // 创建PDF链接服务
    const pdfLinkService = new pdfjsViewer.PDFLinkService({
      eventBus,
    });

    // 创建PDF查找控制器
    const pdfFindController = new pdfjsViewer.PDFFindController({
      eventBus,
      linkService: pdfLinkService,
    });

    // 创建PDF查看器
    const pdfViewer = new pdfjsViewer.PDFViewer({
      container: document.getElementById('viewerContainer'),
      eventBus,
      linkService: pdfLinkService,
      findController: pdfFindController,
    });
    pdfLinkService.setViewer(pdfViewer);

    // 监听页面渲染事件
    eventBus.on('pagesinit', function () {
      // 可以设置初始缩放和页面
      pdfViewer.currentScaleValue = 'page-width';
    });

    // 加载PDF文档
    const loadingTask = pdfjsLib.getDocument('path/to/document.pdf');
    loadingTask.promise.then(function (pdfDocument) {
      // 设置文档到查看器
      pdfViewer.setDocument(pdfDocument);
      pdfLinkService.setDocument(pdfDocument, null);
    });
  </script>
</body>
</html>
```

## 页面查看器 (PageViewer)

单页面查看器组件，适用于只需要显示特定页面的场景：

```javascript
// 创建页面查看器
const pageViewer = new pdfjsViewer.PDFPageView({
  container: document.getElementById('pageContainer'),
  id: 1,
  scale: 1.5,
  defaultViewport: viewport,
  eventBus: eventBus,
  renderingQueue: new pdfjsViewer.PDFRenderingQueue(),
});

// 设置页面
pageViewer.setPdfPage(pdfPage);

// 绘制页面
pageViewer.draw();
```

## 单页查看器 (SinglePageViewer)

专门用于单页显示的查看器：

```javascript
class SinglePageViewer {
  constructor(container) {
    this.container = container;
    this.eventBus = new pdfjsViewer.EventBus();
    this.linkService = new pdfjsViewer.PDFLinkService({
      eventBus: this.eventBus,
    });
    
    this.viewer = new pdfjsViewer.PDFSinglePageViewer({
      container: container,
      eventBus: this.eventBus,
      linkService: this.linkService,
    });
    
    this.linkService.setViewer(this.viewer);
  }
  
  async loadDocument(url) {
    const loadingTask = pdfjsLib.getDocument(url);
    const pdfDocument = await loadingTask.promise;
    
    this.viewer.setDocument(pdfDocument);
    this.linkService.setDocument(pdfDocument);
    
    return pdfDocument;
  }
}

// 使用示例
const viewer = new SinglePageViewer(document.getElementById('viewerContainer'));
viewer.loadDocument('path/to/document.pdf');
```

## 组件特性

### 1. 事件系统
```javascript
// 监听页面变化
eventBus.on('pagechanging', function(evt) {
  console.log('当前页面:', evt.pageNumber);
});

// 监听缩放变化
eventBus.on('scalechanging', function(evt) {
  console.log('当前缩放:', evt.scale);
});
```

### 2. 链接服务
```javascript
// 处理内部链接跳转
const pdfLinkService = new pdfjsViewer.PDFLinkService({
  eventBus: eventBus,
  externalLinkTarget: pdfjsLib.LinkTarget.BLANK,
});
```

### 3. 查找功能
```javascript
// 创建查找控制器
const pdfFindController = new pdfjsViewer.PDFFindController({
  eventBus: eventBus,
  linkService: pdfLinkService,
});

// 执行搜索
pdfFindController.executeCommand('find', {
  query: '搜索文本',
  highlightAll: true,
});
```

## 自定义配置

### 查看器选项
```javascript
const pdfViewer = new pdfjsViewer.PDFViewer({
  container: viewerContainer,
  eventBus: eventBus,
  linkService: pdfLinkService,
  findController: pdfFindController,
  
  // 自定义选项
  enhanceTextSelection: true,  // 增强文本选择
  removePageBorders: false,    // 移除页面边框
  textLayerMode: 2,           // 文本层模式
  annotationMode: 2,          // 注释模式
});
```

### 渲染选项
```javascript
// 设置渲染队列
const renderingQueue = new pdfjsViewer.PDFRenderingQueue();
renderingQueue.setViewer(pdfViewer);

// 自定义渲染参数
pdfViewer.setDocument(pdfDocument, {
  rotation: 0,        // 旋转角度
  fitToViewer: true,  // 适应查看器
  spreadMode: 0,      // 展开模式
});
```

## 移动端适配

针对移动设备的特殊配置：

```javascript
// 检测移动设备
const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

if (isMobile) {
  // 移动端特殊配置
  const pdfViewer = new pdfjsViewer.PDFViewer({
    container: viewerContainer,
    eventBus: eventBus,
    linkService: pdfLinkService,
    
    // 移动端优化
    enhanceTextSelection: false,
    removePageBorders: true,
    useOnlyCssZoom: true,
  });
}
```

## 注意事项

1. **CSS依赖**：必须引入`pdf_viewer.css`样式文件
2. **模块加载**：使用ES6模块方式加载组件
3. **事件处理**：正确设置事件总线和监听器
4. **内存管理**：及时清理不需要的组件实例
5. **响应式设计**：考虑不同屏幕尺寸的适配