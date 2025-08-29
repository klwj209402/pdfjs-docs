# 资源字典（Resource Dictionary）

资源字典是PDF页面和内容流中引用外部资源的核心机制。它定义了页面内容可以使用的字体、图像、图形状态、颜色空间、模式、着色器、外部对象等资源。

## 资源字典结构

### 基本格式

```pdf
<<
/Type /Page
/Resources <<
  /Font <<
    /F1 2 0 R
    /F2 3 0 R
  >>
  /XObject <<
    /Im1 4 0 R
    /Form1 5 0 R
  >>
  /ExtGState <<
    /GS1 6 0 R
  >>
  /ColorSpace <<
    /CS1 7 0 R
  >>
  /Pattern <<
    /P1 8 0 R
  >>
  /Shading <<
    /Sh1 9 0 R
  >>
  /Properties <<
    /MC1 10 0 R
  >>
>>
/Contents 11 0 R
>>
```

### 资源类型

| 资源类型 | 键名 | 描述 |
|---------|------|------|
| 字体 | Font | 文本渲染使用的字体资源 |
| 外部对象 | XObject | 图像和表单XObject |
| 图形状态 | ExtGState | 扩展图形状态参数 |
| 颜色空间 | ColorSpace | 颜色空间定义 |
| 模式 | Pattern | 填充和描边模式 |
| 着色器 | Shading | 渐变着色定义 |
| 属性 | Properties | 标记内容属性 |

## 字体资源

### 字体类型

```pdf
% Type 1 字体
2 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
/Encoding /WinAnsiEncoding
>>
endobj

% TrueType 字体
3 0 obj
<<
/Type /Font
/Subtype /TrueType
/BaseFont /Arial,Bold
/FirstChar 32
/LastChar 255
/Widths [278 278 355 556 556 889 667 191 333 333 ...]
/FontDescriptor 4 0 R
>>
endobj

% 复合字体（CID字体）
5 0 obj
<<
/Type /Font
/Subtype /Type0
/BaseFont /SimSun
/Encoding /UniGB-UCS2-H
/DescendantFonts [6 0 R]
>>
endobj
```

### 字体描述符

```pdf
4 0 obj
<<
/Type /FontDescriptor
/FontName /Arial,Bold
/Flags 32
/FontBBox [-628 -376 2000 1010]
/ItalicAngle 0
/Ascent 905
/Descent -212
/CapHeight 728
/StemV 47
/FontFile2 7 0 R
>>
endobj
```

## 外部对象（XObject）

### 图像XObject

```pdf
4 0 obj
<<
/Type /XObject
/Subtype /Image
/Width 100
/Height 100
/BitsPerComponent 8
/ColorSpace /DeviceRGB
/Filter /DCTDecode
/Length 2048
>>
stream
% JPEG图像数据
endstream
endobj
```

### 表单XObject

```pdf
5 0 obj
<<
/Type /XObject
/Subtype /Form
/BBox [0 0 100 100]
/Matrix [1 0 0 1 0 0]
/Resources <<
  /Font << /F1 2 0 R >>
>>
/Length 45
>>
stream
BT
/F1 12 Tf
10 50 Td
(Hello) Tj
ET
endstream
endobj
```

## 图形状态资源

### 扩展图形状态

```pdf
6 0 obj
<<
/Type /ExtGState
/CA 0.5          % 描边透明度
/ca 0.5          % 填充透明度
/BM /Multiply    % 混合模式
/SMask 8 0 R     % 软遮罩
/AIS false       % 透明度隔离
/TK true         % 文本敲除
>>
endobj
```

### 软遮罩

```pdf
8 0 obj
<<
/Type /Mask
/S /Alpha
/G 9 0 R         % 透明度组
>>
endobj

9 0 obj
<<
/Type /XObject
/Subtype /Form
/Group <<
  /Type /Group
  /S /Transparency
  /CS /DeviceGray
>>
/BBox [0 0 100 100]
/Length 30
>>
stream
0.5 g
0 0 100 100 re
f
endstream
endobj
```

## 颜色空间资源

### 设备相关颜色空间

```pdf
% DeviceRGB, DeviceGray, DeviceCMYK
/ColorSpace /DeviceRGB
```

### CIE颜色空间

```pdf
7 0 obj
[
/CalRGB
<<
/WhitePoint [0.9505 1.0000 1.0890]
/BlackPoint [0.0000 0.0000 0.0000]
/Gamma [2.2 2.2 2.2]
/Matrix [0.4124 0.2126 0.0193
         0.3576 0.7152 0.1192
         0.1805 0.0722 0.9505]
>>
]
endobj
```

### 索引颜色空间

```pdf
[
/Indexed
/DeviceRGB
255
<00FF0000FF0000FF...>  % 颜色查找表
]
```

## 模式资源

### 平铺模式

```pdf
8 0 obj
<<
/Type /Pattern
/PatternType 1
/PaintType 1
/TilingType 1
/BBox [0 0 10 10]
/XStep 10
/YStep 10
/Resources <<>>
/Length 25
>>
stream
1 0 0 RG
0 0 10 10 re
S
endstream
endobj
```

### 着色模式

```pdf
<<
/Type /Pattern
/PatternType 2
/Shading 9 0 R
>>
```

## 着色器资源

### 轴向着色器

```pdf
9 0 obj
<<
/ShadingType 2
/ColorSpace /DeviceRGB
/Coords [0 0 100 0]
/Function <<
  /FunctionType 2
  /Domain [0 1]
  /C0 [1 0 0]    % 起始颜色（红色）
  /C1 [0 0 1]    % 结束颜色（蓝色）
  /N 1
>>
>>
endobj
```

### 径向着色器

```pdf
<<
/ShadingType 3
/ColorSpace /DeviceRGB
/Coords [50 50 0 50 50 25]  % [x0 y0 r0 x1 y1 r1]
/Function 10 0 R
>>
```

## 资源继承机制

### 继承层次

```javascript
/**
 * 资源解析器 - 处理资源继承
 */
class ResourceResolver {
  /**
   * 解析资源引用
   * @param {Object} page - 页面对象
   * @param {string} resourceType - 资源类型
   * @param {string} resourceName - 资源名称
   * @returns {Object|null} 资源对象
   */
  resolveResource(page, resourceType, resourceName) {
    // 1. 检查页面资源字典
    let resource = this.findInResources(page.Resources, resourceType, resourceName);
    if (resource) return resource;
    
    // 2. 检查父页面节点
    let parent = page.Parent;
    while (parent) {
      resource = this.findInResources(parent.Resources, resourceType, resourceName);
      if (resource) return resource;
      parent = parent.Parent;
    }
    
    return null;
  }
  
  /**
   * 在资源字典中查找资源
   * @param {Object} resources - 资源字典
   * @param {string} type - 资源类型
   * @param {string} name - 资源名称
   * @returns {Object|null} 资源对象
   */
  findInResources(resources, type, name) {
    if (!resources || !resources[type]) return null;
    return resources[type][name] || null;
  }
}
```

## 资源优化

### 资源共享

```pdf
% 多个页面共享同一字体资源
1 0 obj  % 页面1
<<
/Type /Page
/Resources << /Font << /F1 10 0 R >> >>
/Contents 2 0 R
>>
endobj

3 0 obj  % 页面2
<<
/Type /Page
/Resources << /Font << /F1 10 0 R >> >>  % 共享字体
/Contents 4 0 R
>>
endobj
```

### 资源压缩

```javascript
/**
 * 资源压缩管理器
 */
class ResourceCompressor {
  /**
   * 压缩图像资源
   * @param {Object} imageXObject - 图像XObject
   * @returns {Object} 压缩后的图像对象
   */
  compressImage(imageXObject) {
    const { width, height, colorSpace, bitsPerComponent } = imageXObject;
    
    // 选择合适的压缩算法
    if (colorSpace === '/DeviceGray' && bitsPerComponent === 1) {
      return this.applyJBIG2Compression(imageXObject);
    } else if (colorSpace === '/DeviceRGB') {
      return this.applyJPEGCompression(imageXObject);
    } else {
      return this.applyFlateCompression(imageXObject);
    }
  }
  
  /**
   * 应用JPEG压缩
   * @param {Object} imageXObject - 图像对象
   * @returns {Object} 压缩后的对象
   */
  applyJPEGCompression(imageXObject) {
    return {
      ...imageXObject,
      Filter: '/DCTDecode',
      // 压缩后的数据
    };
  }
}
```

## 资源缓存策略

### 缓存管理

```javascript
/**
 * 资源缓存管理器
 */
class ResourceCache {
  constructor() {
    this.fontCache = new Map();
    this.imageCache = new Map();
    this.patternCache = new Map();
    this.maxCacheSize = 100;
  }
  
  /**
   * 获取字体资源
   * @param {string} fontRef - 字体引用
   * @returns {Object|null} 字体对象
   */
  getFont(fontRef) {
    if (this.fontCache.has(fontRef)) {
      // 更新访问时间
      const font = this.fontCache.get(fontRef);
      font.lastAccess = Date.now();
      return font.data;
    }
    return null;
  }
  
  /**
   * 缓存字体资源
   * @param {string} fontRef - 字体引用
   * @param {Object} fontData - 字体数据
   */
  cacheFont(fontRef, fontData) {
    // 检查缓存大小限制
    if (this.fontCache.size >= this.maxCacheSize) {
      this.evictLeastRecentlyUsed();
    }
    
    this.fontCache.set(fontRef, {
      data: fontData,
      lastAccess: Date.now(),
      size: this.calculateFontSize(fontData)
    });
  }
  
  /**
   * 清理最少使用的资源
   */
  evictLeastRecentlyUsed() {
    let oldestKey = null;
    let oldestTime = Date.now();
    
    for (const [key, value] of this.fontCache) {
      if (value.lastAccess < oldestTime) {
        oldestTime = value.lastAccess;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.fontCache.delete(oldestKey);
    }
  }
}
```

## 错误处理

### 资源缺失处理

```javascript
/**
 * 资源错误处理器
 */
class ResourceErrorHandler {
  /**
   * 处理缺失的字体资源
   * @param {string} fontName - 字体名称
   * @returns {Object} 替代字体
   */
  handleMissingFont(fontName) {
    // 字体替换映射
    const fontSubstitutions = {
      'Arial': 'Helvetica',
      'Times': 'Times-Roman',
      'Courier': 'Courier'
    };
    
    const substitute = fontSubstitutions[fontName] || 'Helvetica';
    console.warn(`Font '${fontName}' not found, using '${substitute}' instead`);
    
    return this.createSubstituteFont(substitute);
  }
  
  /**
   * 处理损坏的图像资源
   * @param {string} imageRef - 图像引用
   * @returns {Object} 占位符图像
   */
  handleCorruptedImage(imageRef) {
    console.error(`Image '${imageRef}' is corrupted`);
    return this.createPlaceholderImage();
  }
  
  /**
   * 创建占位符图像
   * @returns {Object} 占位符图像对象
   */
  createPlaceholderImage() {
    return {
      Type: '/XObject',
      Subtype: '/Image',
      Width: 100,
      Height: 100,
      BitsPerComponent: 8,
      ColorSpace: '/DeviceRGB',
      // 生成简单的占位符图像数据
      data: this.generatePlaceholderData()
    };
  }
}
```

## 最佳实践

### 开发建议

1. **资源重用**：尽可能重用相同的资源对象
2. **延迟加载**：按需加载资源，避免内存浪费
3. **缓存策略**：实现合理的资源缓存机制
4. **错误恢复**：提供资源缺失时的替代方案
5. **内存管理**：及时释放不再使用的资源

### 性能优化

- 使用资源字典继承减少重复定义
- 对大型图像使用适当的压缩算法
- 实现资源预加载机制
- 监控资源使用情况，优化缓存策略

资源字典是PDF文档内容渲染的基础设施，合理管理资源对于提高PDF处理性能和用户体验至关重要。