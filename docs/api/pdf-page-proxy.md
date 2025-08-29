# PDFPageProxy

`PDFPageProxy` 是 PDF 页面的代理对象，提供了访问页面内容、渲染页面和获取页面信息的接口。通过 `PDFDocumentProxy.getPage()` 方法获得。

## 属性

### pageNumber

- **类型**: `number`
- **只读**: 是
- **描述**: 页面编号（从 1 开始）

```javascript
console.log('当前页面编号:', page.pageNumber);
```

### rotate

- **类型**: `number`
- **只读**: 是
- **描述**: 页面顺时针旋转角度（0, 90, 180, 270）

```javascript
console.log('页面旋转角度:', page.rotate);
```

### ref

- **类型**: `RefProxy | null`
- **只读**: 是
- **描述**: 指向此页面的引用对象

```javascript
if (page.ref) {
  console.log('页面引用:', page.ref);
}
```

### userUnit

- **类型**: `number`
- **只读**: 是
- **描述**: 用户单位的默认大小（1/72 英寸）

```javascript
console.log('用户单位:', page.userUnit);
```

### view

- **类型**: `Array<number>`
- **只读**: 是
- **描述**: 页面可见区域的边界框 [x1, y1, x2, y2]

```javascript
const [x1, y1, x2, y2] = page.view;
console.log('页面边界:', { x1, y1, x2, y2 });
console.log('页面宽度:', x2 - x1);
console.log('页面高度:', y2 - y1);
```

### commonObjs

- **类型**: `PDFObjects`
- **只读**: 是
- **描述**: 共享对象存储

### objs

- **类型**: `PDFObjects`
- **只读**: 是
- **描述**: 页面特定对象存储

### filterFactory

- **类型**: `Object`
- **只读**: 是
- **描述**: 过滤器工厂实例

### isPureXfa

- **类型**: `boolean`
- **只读**: 是
- **描述**: 是否为纯 XFA 表单

## 方法

### getViewport(parameters)

获取页面视口信息，用于计算渲染尺寸和变换。

**参数**:
- `parameters` (`GetViewportParameters`) - 视口参数对象
  - `scale` (`number`) - 缩放比例
  - `rotation` (`number`, 可选) - 旋转角度，默认为页面的旋转角度
  - `offsetX` (`number`, 可选) - X 轴偏移，默认为 0
  - `offsetY` (`number`, 可选) - Y 轴偏移，默认为 0
  - `dontFlip` (`boolean`, 可选) - 是否不翻转 Y 轴，默认为 false

**返回值**: `PageViewport`

```javascript
// 基本用法
const viewport = page.getViewport({ scale: 1.5 });
console.log('视口宽度:', viewport.width);
console.log('视口高度:', viewport.height);

// 带旋转的视口
const rotatedViewport = page.getViewport({ 
  scale: 1.0, 
  rotation: 90 
});

// 带偏移的视口
const offsetViewport = page.getViewport({ 
  scale: 1.0, 
  offsetX: 100, 
  offsetY: 50 
});
```

### render(renderParameters)

渲染页面到 Canvas 上。

**参数**:
- `renderParameters` (`RenderParameters`) - 渲染参数对象
  - `canvasContext` (`CanvasRenderingContext2D`) - Canvas 2D 渲染上下文
  - `viewport` (`PageViewport`) - 页面视口
  - `intent` (`string`, 可选) - 渲染意图，默认为 'display'
  - `annotationMode` (`number`, 可选) - 注释模式
  - `transform` (`Array<number>`, 可选) - 变换矩阵
  - `background` (`string`, 可选) - 背景颜色
  - `optionalContentConfigPromise` (`Promise`, 可选) - 可选内容配置
  - `annotationCanvasMap` (`Map`, 可选) - 注释 Canvas 映射
  - `pageColors` (`Object`, 可选) - 页面颜色配置
  - `printAnnotationStorage` (`Object`, 可选) - 打印注释存储
  - `isEditing` (`boolean`, 可选) - 是否处于编辑模式

**返回值**: `RenderTask`

```javascript
// 基本渲染
const canvas = document.getElementById('pdf-canvas');
const context = canvas.getContext('2d');
const viewport = page.getViewport({ scale: 1.5 });

// 设置 Canvas 尺寸
canvas.height = viewport.height;
canvas.width = viewport.width;

// 渲染页面
const renderTask = page.render({
  canvasContext: context,
  viewport: viewport
});

renderTask.promise.then(function() {
  console.log('页面渲染完成');
}).catch(function(error) {
  console.error('渲染失败:', error);
});
```

### getTextContent(parameters)

获取页面的文本内容。

**参数**:
- `parameters` (`getTextContentParameters`, 可选) - 文本提取参数
  - `includeMarkedContent` (`boolean`, 可选) - 是否包含标记内容，默认为 false
  - `disableNormalization` (`boolean`, 可选) - 是否禁用文本规范化，默认为 false

**返回值**: `Promise<TextContent>`

```javascript
page.getTextContent().then(function(textContent) {
  console.log('文本项数量:', textContent.items.length);
  
  // 提取所有文本
  const text = textContent.items.map(function(item) {
    return item.str;
  }).join(' ');
  
  console.log('页面文本:', text);
  
  // 遍历文本项
  textContent.items.forEach(function(item) {
    console.log('文本:', item.str);
    console.log('位置:', item.transform);
    console.log('字体:', item.fontName);
    console.log('高度:', item.height);
    console.log('宽度:', item.width);
  });
});
```

### streamTextContent(parameters)

以流的方式获取页面文本内容。

**参数**:
- `parameters` (`getTextContentParameters`, 可选) - 同 `getTextContent`

**返回值**: `ReadableStream`

```javascript
const textStream = page.streamTextContent();
const reader = textStream.getReader();

function readText() {
  reader.read().then(function({ value, done }) {
    if (done) {
      console.log('文本流读取完成');
      return;
    }
    
    // 处理文本块
    value.items.forEach(function(item) {
      console.log('文本块:', item.str);
    });
    
    readText(); // 继续读取
  });
}

readText();
```

### getAnnotations(parameters)

获取页面注释。

**参数**:
- `parameters` (`GetAnnotationsParameters`, 可选) - 注释参数
  - `intent` (`string`, 可选) - 意图，默认为 'display'

**返回值**: `Promise<Array<any>>`

```javascript
page.getAnnotations().then(function(annotations) {
  console.log('注释数量:', annotations.length);
  
  annotations.forEach(function(annotation) {
    console.log('注释类型:', annotation.subtype);
    console.log('注释内容:', annotation.contents);
    console.log('注释位置:', annotation.rect);
  });
});
```

### getJSActions()

获取页面的 JavaScript 操作。

**返回值**: `Promise<Object>`

```javascript
page.getJSActions().then(function(actions) {
  if (actions) {
    console.log('JavaScript 操作:', actions);
  }
});
```

### getOperatorList(parameters)

获取页面的操作符列表（用于调试和分析）。

**参数**:
- `parameters` (`GetOperatorListParameters`, 可选) - 操作符列表参数
  - `intent` (`string`, 可选) - 意图，默认为 'display'
  - `annotationMode` (`number`, 可选) - 注释模式
  - `printAnnotationStorage` (`Object`, 可选) - 打印注释存储
  - `isEditing` (`boolean`, 可选) - 是否处于编辑模式

**返回值**: `Promise<PDFOperatorList>`

```javascript
page.getOperatorList().then(function(operatorList) {
  console.log('操作符数量:', operatorList.fnArray.length);
  console.log('操作符列表:', operatorList.fnArray);
  console.log('参数列表:', operatorList.argsArray);
});
```

### getStructTree()

获取页面的结构树（用于可访问性）。

**返回值**: `Promise<StructTreeNode | null>`

```javascript
page.getStructTree().then(function(structTree) {
  if (structTree) {
    console.log('结构树:', structTree);
  }
});
```

### getXfa()

获取 XFA 表单数据。

**返回值**: `Promise<Object | null>`

```javascript
page.getXfa().then(function(xfa) {
  if (xfa) {
    console.log('XFA 数据:', xfa);
  }
});
```

### cleanup(resetStats)

清理页面资源。

**参数**:
- `resetStats` (`boolean`, 可选) - 是否重置统计信息，默认为 false

**返回值**: `boolean` - 是否成功清理

```javascript
const success = page.cleanup();
if (success) {
  console.log('页面资源已清理');
}
```

## 使用示例

### 完整的页面渲染示例

```javascript
function renderPage(pdf, pageNumber, canvas) {
  return pdf.getPage(pageNumber).then(function(page) {
    const viewport = page.getViewport({ scale: 1.5 });
    const context = canvas.getContext('2d');
    
    // 设置 Canvas 尺寸
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    // 渲染页面
    const renderTask = page.render({
      canvasContext: context,
      viewport: viewport
    });
    
    return renderTask.promise;
  }).then(function() {
    console.log(`第 ${pageNumber} 页渲染完成`);
  });
}

// 使用示例
pdfjsLib.getDocument('document.pdf').promise.then(function(pdf) {
  const canvas = document.getElementById('pdf-canvas');
  return renderPage(pdf, 1, canvas);
});
```

### 响应式页面渲染

```javascript
function renderPageResponsive(page, container) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  // 计算适合容器的缩放比例
  const containerWidth = container.clientWidth;
  const viewport = page.getViewport({ scale: 1.0 });
  const scale = containerWidth / viewport.width;
  const scaledViewport = page.getViewport({ scale: scale });
  
  // 设置 Canvas 尺寸
  canvas.height = scaledViewport.height;
  canvas.width = scaledViewport.width;
  
  // 处理高 DPI 屏幕
  const outputScale = window.devicePixelRatio || 1;
  if (outputScale !== 1) {
    canvas.width *= outputScale;
    canvas.height *= outputScale;
    canvas.style.width = scaledViewport.width + 'px';
    canvas.style.height = scaledViewport.height + 'px';
    context.scale(outputScale, outputScale);
  }
  
  container.appendChild(canvas);
  
  // 渲染页面
  return page.render({
    canvasContext: context,
    viewport: scaledViewport
  }).promise;
}
```

### 文本搜索示例

```javascript
function searchTextInPage(page, searchText) {
  return page.getTextContent().then(function(textContent) {
    const matches = [];
    
    textContent.items.forEach(function(item, index) {
      if (item.str.toLowerCase().includes(searchText.toLowerCase())) {
        matches.push({
          text: item.str,
          position: item.transform,
          index: index
        });
      }
    });
    
    return matches;
  });
}

// 使用示例
page.then(function(page) {
  return searchTextInPage(page, '搜索关键词');
}).then(function(matches) {
  console.log('找到匹配项:', matches.length);
  matches.forEach(function(match) {
    console.log('匹配文本:', match.text);
    console.log('位置:', match.position);
  });
});
```

### 注释处理示例

```javascript
function processAnnotations(page) {
  return page.getAnnotations().then(function(annotations) {
    const processedAnnotations = [];
    
    annotations.forEach(function(annotation) {
      const processed = {
        type: annotation.subtype,
        content: annotation.contents || '',
        rect: annotation.rect,
        page: page.pageNumber
      };
      
      // 处理不同类型的注释
      switch (annotation.subtype) {
        case 'Link':
          processed.url = annotation.url;
          processed.dest = annotation.dest;
          break;
        case 'Text':
        case 'Note':
          processed.title = annotation.title;
          break;
        case 'Highlight':
        case 'Underline':
        case 'Squiggly':
        case 'StrikeOut':
          processed.quadPoints = annotation.quadPoints;
          break;
      }
      
      processedAnnotations.push(processed);
    });
    
    return processedAnnotations;
  });
}
```

## 注意事项

1. **内存管理**: 渲染完成后应调用 `cleanup()` 方法释放资源
2. **Canvas 尺寸**: 渲染前必须正确设置 Canvas 的宽度和高度
3. **高 DPI 支持**: 在高 DPI 屏幕上需要考虑 `devicePixelRatio`
4. **异步操作**: 所有方法都是异步的，需要正确处理 Promise
5. **坐标系统**: PDF 坐标系统的原点在左下角，而 Canvas 在左上角

## 相关 API

- [PDFDocumentProxy](/api/pdf-document-proxy) - PDF 文档代理对象
- [TextLayer](/api/text-layer) - 文本层组件
- [AnnotationLayer](/api/annotation-layer) - 注释层组件
- [常量和枚举](/api/constants) - 相关常量定义