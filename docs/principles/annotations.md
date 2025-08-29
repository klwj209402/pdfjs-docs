# 注释系统（Annotation System）

PDF注释系统提供了丰富的交互功能，允许用户在文档中添加文本注释、链接、表单字段、多媒体内容等。注释是独立于页面内容的对象，可以动态显示、隐藏和修改。

## 注释基础结构

### 注释对象格式

```pdf
5 0 obj
<<
/Type /Annot
/Subtype /Text
/Rect [100 100 120 120]
/Contents (这是一个文本注释)
/P 1 0 R
/M (D:20240101120000+08'00')
/F 4
/C [1 1 0]
/T (作者)
/Subj (主题)
/CreationDate (D:20240101120000+08'00')
/ModDate (D:20240101120000+08'00')
>>
endobj
```

### 通用注释属性

| 属性 | 类型 | 描述 |
|------|------|------|
| Type | name | 必须为 /Annot |
| Subtype | name | 注释子类型 |
| Rect | rectangle | 注释矩形区域 |
| Contents | text string | 注释内容文本 |
| P | dictionary | 所属页面引用 |
| NM | text string | 注释名称（唯一标识） |
| M | date | 修改日期 |
| F | integer | 注释标志 |
| AP | dictionary | 外观字典 |
| AS | name | 外观状态 |
| Border | array | 边框样式 |
| C | array | 颜色 |
| StructParent | integer | 结构父元素 |
| OC | dictionary | 可选内容组 |

## 注释类型

### 文本注释（Text）

```pdf
<<
/Type /Annot
/Subtype /Text
/Rect [100 100 120 120]
/Contents (这是一个便签注释)
/Open true
/Name /Note
/C [1 1 0]
/CA 0.8
/T (张三)
/M (D:20240101120000+08'00')
/CreationDate (D:20240101120000+08'00')
/IRT 6 0 R  % 回复目标注释
/RT /R      % 回复类型
>>
```

**特有属性：**
- **Open**：是否默认打开
- **Name**：图标名称（Note, Comment, Key, Help等）
- **State**：审阅状态
- **StateModel**：状态模型

### 链接注释（Link）

```pdf
<<
/Type /Annot
/Subtype /Link
/Rect [100 200 200 220]
/Border [0 0 1]
/C [0 0 1]
/A <<
  /Type /Action
  /S /URI
  /URI (https://www.example.com)
>>
/H /I  % 高亮模式
>>
```

**动作类型：**
- **GoTo**：跳转到文档内位置
- **GoToR**：跳转到外部文档
- **URI**：打开网页链接
- **Launch**：启动应用程序
- **JavaScript**：执行JavaScript代码

### 自由文本注释（FreeText）

```pdf
<<
/Type /Annot
/Subtype /FreeText
/Rect [100 300 300 350]
/Contents (自由文本内容)
/DA (/Helvetica 12 Tf 0 0 1 rg)
/Q 1  % 对齐方式：0=左，1=中，2=右
/RC (富文本内容)
/DS (font: 12pt Helvetica; color: blue;)
/CL [100 325 300 325]  % 标注线
/IT /FreeTextCallout   % 意图类型
/LE [/None /OpenArrow] % 线端样式
>>
```

### 高亮注释（Highlight）

```pdf
<<
/Type /Annot
/Subtype /Highlight
/Rect [100 400 200 420]
/QuadPoints [100 400 200 400 200 420 100 420]
/C [1 1 0]
/CA 0.5
/T (审阅者)
/Contents (重要内容)
/CreationDate (D:20240101120000+08'00')
>>
```

### 图章注释（Stamp）

```pdf
<<
/Type /Annot
/Subtype /Stamp
/Rect [100 500 200 550]
/Name /Approved
/AP <<
  /N 7 0 R  % 正常外观
>>
/F 4
/Contents (已批准)
>>
```

### 墨迹注释（Ink）

```pdf
<<
/Type /Annot
/Subtype /Ink
/Rect [100 600 300 700]
/InkList [
  [100 650 120 660 140 670 160 680]
  [180 680 200 670 220 660 240 650]
]
/BS <<
  /Type /Border
  /W 2
  /S /S
>>
/C [1 0 0]
>>
```

## 注释外观

### 外观字典

```pdf
7 0 obj
<<
/Type /XObject
/Subtype /Form
/BBox [0 0 100 50]
/Matrix [1 0 0 1 0 0]
/Resources <<
  /Font << /F1 8 0 R >>
>>
/Length 60
>>
stream
q
1 0 0 RG
2 w
10 10 80 30 re
S
BT
/F1 12 Tf
15 20 Td
(APPROVED) Tj
ET
Q
endstream
endobj

% 注释使用外观
<<
/Type /Annot
/Subtype /Stamp
/AP <<
  /N 7 0 R    % 正常状态外观
  /R 9 0 R    % 翻转状态外观
  /D 10 0 R   % 按下状态外观
>>
/AS /N        % 当前外观状态
>>
```

### 外观状态

- **N（Normal）**：正常状态
- **R（Rollover）**：鼠标悬停状态
- **D（Down）**：按下状态

## 注释交互

### 注释标志

```javascript
/**
 * 注释标志常量
 */
const AnnotationFlags = {
  INVISIBLE: 1,        // 不可见
  HIDDEN: 2,          // 隐藏
  PRINT: 4,           // 可打印
  NO_ZOOM: 8,         // 不缩放
  NO_ROTATE: 16,      // 不旋转
  NO_VIEW: 32,        // 不显示
  READ_ONLY: 64,      // 只读
  LOCKED: 128,        % 锁定
  TOGGLE_NO_VIEW: 256, // 切换显示
  LOCKED_CONTENTS: 512 // 内容锁定
};

/**
 * 检查注释标志
 * @param {number} flags - 标志值
 * @param {number} flag - 要检查的标志
 * @returns {boolean} 是否设置了该标志
 */
function hasFlag(flags, flag) {
  return (flags & flag) !== 0;
}
```

### 注释事件处理

```javascript
/**
 * 注释事件管理器
 */
class AnnotationEventManager {
  constructor() {
    this.annotations = new Map();
    this.eventListeners = new Map();
  }
  
  /**
   * 注册注释事件监听器
   * @param {string} annotId - 注释ID
   * @param {string} eventType - 事件类型
   * @param {Function} handler - 事件处理函数
   */
  addEventListener(annotId, eventType, handler) {
    const key = `${annotId}_${eventType}`;
    if (!this.eventListeners.has(key)) {
      this.eventListeners.set(key, []);
    }
    this.eventListeners.get(key).push(handler);
  }
  
  /**
   * 触发注释事件
   * @param {string} annotId - 注释ID
   * @param {string} eventType - 事件类型
   * @param {Object} eventData - 事件数据
   */
  triggerEvent(annotId, eventType, eventData) {
    const key = `${annotId}_${eventType}`;
    const handlers = this.eventListeners.get(key) || [];
    
    handlers.forEach(handler => {
      try {
        handler(eventData);
      } catch (error) {
        console.error(`Error in annotation event handler:`, error);
      }
    });
  }
  
  /**
   * 处理鼠标点击事件
   * @param {number} x - 点击X坐标
   * @param {number} y - 点击Y坐标
   * @param {Object} page - 页面对象
   */
  handleClick(x, y, page) {
    const annotations = this.getAnnotationsAtPoint(x, y, page);
    
    annotations.forEach(annotation => {
      if (annotation.Subtype === '/Link') {
        this.handleLinkClick(annotation);
      } else if (annotation.Subtype === '/Text') {
        this.handleTextAnnotationClick(annotation);
      }
    });
  }
  
  /**
   * 处理链接点击
   * @param {Object} linkAnnotation - 链接注释对象
   */
  handleLinkClick(linkAnnotation) {
    const action = linkAnnotation.A;
    if (!action) return;
    
    switch (action.S) {
      case '/URI':
        window.open(action.URI, '_blank');
        break;
      case '/GoTo':
        this.navigateToDestination(action.D);
        break;
      case '/JavaScript':
        this.executeJavaScript(action.JS);
        break;
    }
  }
}
```

## 注释渲染

### 渲染管道

```javascript
/**
 * 注释渲染器
 */
class AnnotationRenderer {
  constructor(canvas, context) {
    this.canvas = canvas;
    this.ctx = context;
    this.annotationCache = new Map();
  }
  
  /**
   * 渲染页面注释
   * @param {Array} annotations - 注释数组
   * @param {Object} viewport - 视口变换
   */
  renderAnnotations(annotations, viewport) {
    annotations.forEach(annotation => {
      if (this.shouldRenderAnnotation(annotation)) {
        this.renderAnnotation(annotation, viewport);
      }
    });
  }
  
  /**
   * 渲染单个注释
   * @param {Object} annotation - 注释对象
   * @param {Object} viewport - 视口变换
   */
  renderAnnotation(annotation, viewport) {
    const rect = this.transformRect(annotation.Rect, viewport);
    
    this.ctx.save();
    
    switch (annotation.Subtype) {
      case '/Text':
        this.renderTextAnnotation(annotation, rect);
        break;
      case '/Link':
        this.renderLinkAnnotation(annotation, rect);
        break;
      case '/Highlight':
        this.renderHighlightAnnotation(annotation, rect);
        break;
      case '/FreeText':
        this.renderFreeTextAnnotation(annotation, rect);
        break;
      default:
        this.renderGenericAnnotation(annotation, rect);
    }
    
    this.ctx.restore();
  }
  
  /**
   * 渲染文本注释
   * @param {Object} annotation - 文本注释对象
   * @param {Array} rect - 矩形区域
   */
  renderTextAnnotation(annotation, rect) {
    const [x, y, width, height] = rect;
    
    // 绘制注释图标
    this.ctx.fillStyle = annotation.C ? 
      this.rgbArrayToColor(annotation.C) : '#FFFF00';
    this.ctx.fillRect(x, y, width, height);
    
    // 绘制边框
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, width, height);
    
    // 绘制图标
    this.drawAnnotationIcon(annotation.Name || '/Note', x, y, width, height);
  }
  
  /**
   * 渲染高亮注释
   * @param {Object} annotation - 高亮注释对象
   * @param {Array} rect - 矩形区域
   */
  renderHighlightAnnotation(annotation, rect) {
    if (!annotation.QuadPoints) return;
    
    this.ctx.globalAlpha = annotation.CA || 0.5;
    this.ctx.fillStyle = annotation.C ? 
      this.rgbArrayToColor(annotation.C) : '#FFFF00';
    
    // 绘制四边形高亮区域
    const quadPoints = annotation.QuadPoints;
    for (let i = 0; i < quadPoints.length; i += 8) {
      this.ctx.beginPath();
      this.ctx.moveTo(quadPoints[i], quadPoints[i + 1]);
      this.ctx.lineTo(quadPoints[i + 2], quadPoints[i + 3]);
      this.ctx.lineTo(quadPoints[i + 4], quadPoints[i + 5]);
      this.ctx.lineTo(quadPoints[i + 6], quadPoints[i + 7]);
      this.ctx.closePath();
      this.ctx.fill();
    }
    
    this.ctx.globalAlpha = 1.0;
  }
}
```

## 注释编辑

### 注释创建

```javascript
/**
 * 注释编辑器
 */
class AnnotationEditor {
  /**
   * 创建文本注释
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {string} content - 注释内容
   * @param {string} author - 作者
   * @returns {Object} 注释对象
   */
  createTextAnnotation(x, y, content, author) {
    const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    
    return {
      Type: '/Annot',
      Subtype: '/Text',
      Rect: [x, y, x + 20, y + 20],
      Contents: content,
      T: author,
      M: `D:${now}+08'00'`,
      CreationDate: `D:${now}+08'00'`,
      F: 4, // PRINT flag
      C: [1, 1, 0], // 黄色
      Name: '/Note',
      Open: false
    };
  }
  
  /**
   * 创建高亮注释
   * @param {Array} quadPoints - 四边形点坐标
   * @param {string} content - 注释内容
   * @param {Array} color - RGB颜色数组
   * @returns {Object} 高亮注释对象
   */
  createHighlightAnnotation(quadPoints, content, color = [1, 1, 0]) {
    const rect = this.calculateBoundingRect(quadPoints);
    const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    
    return {
      Type: '/Annot',
      Subtype: '/Highlight',
      Rect: rect,
      QuadPoints: quadPoints,
      Contents: content,
      C: color,
      CA: 0.5,
      M: `D:${now}+08'00'`,
      CreationDate: `D:${now}+08'00'`,
      F: 4
    };
  }
  
  /**
   * 修改注释内容
   * @param {Object} annotation - 注释对象
   * @param {string} newContent - 新内容
   */
  updateAnnotationContent(annotation, newContent) {
    annotation.Contents = newContent;
    annotation.M = this.getCurrentDateString();
    
    // 触发更新事件
    this.triggerAnnotationUpdate(annotation);
  }
  
  /**
   * 删除注释
   * @param {Object} page - 页面对象
   * @param {Object} annotation - 要删除的注释
   */
  deleteAnnotation(page, annotation) {
    if (!page.Annots) return;
    
    const index = page.Annots.indexOf(annotation);
    if (index > -1) {
      page.Annots.splice(index, 1);
      this.triggerAnnotationDelete(annotation);
    }
  }
}
```

## 注释导入导出

### FDF格式支持

```javascript
/**
 * FDF（Forms Data Format）处理器
 */
class FDFProcessor {
  /**
   * 导出注释为FDF格式
   * @param {Array} annotations - 注释数组
   * @param {string} sourceFile - 源PDF文件路径
   * @returns {string} FDF内容
   */
  exportToFDF(annotations, sourceFile) {
    let fdfContent = `%FDF-1.2\n`;
    fdfContent += `1 0 obj\n<<\n/FDF\n<<\n/F (${sourceFile})\n/Annots [\n`;
    
    annotations.forEach((annotation, index) => {
      fdfContent += `${index + 2} 0 R\n`;
    });
    
    fdfContent += `]\n>>\n>>\nendobj\n`;
    
    // 添加注释对象
    annotations.forEach((annotation, index) => {
      fdfContent += this.serializeAnnotationToFDF(annotation, index + 2);
    });
    
    fdfContent += `trailer\n<<\n/Root 1 0 R\n>>\n%%EOF`;
    
    return fdfContent;
  }
  
  /**
   * 从FDF导入注释
   * @param {string} fdfContent - FDF内容
   * @returns {Array} 注释数组
   */
  importFromFDF(fdfContent) {
    // 解析FDF内容并提取注释
    const annotations = [];
    // FDF解析逻辑...
    return annotations;
  }
}
```

## 最佳实践

### 性能优化

1. **延迟渲染**：只渲染可见区域的注释
2. **缓存机制**：缓存注释外观和渲染结果
3. **事件委托**：使用事件委托处理大量注释的交互
4. **批量操作**：批量处理注释的创建、更新和删除

### 用户体验

1. **视觉反馈**：提供清晰的视觉反馈和状态指示
2. **键盘支持**：支持键盘导航和操作
3. **无障碍访问**：确保注释内容可被屏幕阅读器访问
4. **响应式设计**：适配不同屏幕尺寸和设备

### 数据完整性

1. **版本控制**：跟踪注释的修改历史
2. **冲突解决**：处理多用户同时编辑的冲突
3. **数据验证**：验证注释数据的完整性和有效性
4. **备份恢复**：提供注释数据的备份和恢复机制

PDF注释系统为文档提供了丰富的交互功能，理解其结构和实现原理对于开发高质量的PDF应用至关重要。