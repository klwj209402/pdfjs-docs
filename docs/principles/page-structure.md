# PDF 页面结构

PDF页面是文档内容的基本单位，每个页面都有明确的结构和属性定义。理解页面结构对于PDF内容的渲染和处理至关重要。

## 页面树结构

PDF使用树形结构组织页面，支持高效的页面管理和继承机制。

### 页面树根节点
```
2 0 obj
<<
/Type /Pages
/Kids [3 0 R 4 0 R 5 0 R]      # 子节点数组
/Count 3                       # 叶子页面总数
/MediaBox [0 0 612 792]        # 默认页面尺寸
/Resources <<                  # 共享资源
  /Font <<
    /F1 10 0 R
  >>
>>
>>
endobj
```

### 中间节点
```
3 0 obj
<<
/Type /Pages
/Parent 2 0 R                  # 父节点引用
/Kids [6 0 R 7 0 R]            # 子页面
/Count 2                       # 此分支的页面数
>>
endobj
```

### 叶子节点（页面）
```
6 0 obj
<<
/Type /Page
/Parent 3 0 R                  # 父节点引用
/MediaBox [0 0 612 792]        # 页面尺寸
/Contents 8 0 R                # 内容流
/Resources <<                  # 页面资源
  /Font <<
    /F1 10 0 R
  >>
>>
>>
endobj
```

## 页面边界框

PDF定义了五种不同的页面边界框，用于不同的用途。

### MediaBox（媒体框）
```
/MediaBox [0 0 612 792]        # [llx lly urx ury]
```
- 定义页面的物理尺寸
- 所有其他边界框的参考
- 必须存在的边界框
- 常见尺寸：
  - A4: [0 0 595 842]
  - Letter: [0 0 612 792]
  - Legal: [0 0 612 1008]

### CropBox（裁剪框）
```
/CropBox [36 36 576 756]       # 显示和打印区域
```
- 定义页面的可见区域
- 默认等于MediaBox
- 用于页面显示和打印

### BleedBox（出血框）
```
/BleedBox [18 18 594 774]      # 出血区域
```
- 用于印刷生产
- 包含出血区域的内容
- 默认等于CropBox

### TrimBox（修剪框）
```
/TrimBox [36 36 576 756]       # 最终页面尺寸
```
- 印刷后的最终页面尺寸
- 默认等于CropBox

### ArtBox（艺术框）
```
/ArtBox [54 54 558 738]        # 有意义内容区域
```
- 包含有意义内容的区域
- 默认等于CropBox

### 边界框关系
```
MediaBox ⊇ CropBox ⊇ BleedBox ⊇ TrimBox
MediaBox ⊇ CropBox ⊇ ArtBox
```

## 页面内容组织

### 内容流引用
```
# 单个内容流
/Contents 8 0 R

# 多个内容流
/Contents [8 0 R 9 0 R 10 0 R]
```

### 内容流对象
```
8 0 obj
<<
/Length 256
/Filter /FlateDecode           # 压缩过滤器
>>
stream
...压缩的内容流数据...
endstream
endobj
```

### 解压后的内容流示例
```
% 设置图形状态
q                              # 保存状态
1 0 0 1 100 700 cm            # 变换矩阵

% 绘制文本
BT                             # 开始文本对象
/F1 12 Tf                      # 设置字体
0 0 Td                         # 文本位置
(Hello World) Tj               # 显示文本
ET                             # 结束文本对象

% 绘制图形
200 0 0 100 0 0 re             # 矩形
S                              # 描边

Q                              # 恢复状态
```

## 资源字典

页面资源定义了页面内容可以使用的各种资源。

### 完整资源字典
```
/Resources <<
  /Font <<                     # 字体资源
    /F1 10 0 R
    /F2 11 0 R
  >>
  /XObject <<                  # 外部对象
    /Im1 12 0 R                # 图像
    /Fm1 13 0 R                # 表单
  >>
  /ColorSpace <<               # 颜色空间
    /CS1 14 0 R
  >>
  /Pattern <<                  # 图案
    /P1 15 0 R
  >>
  /Shading <<                  # 渐变
    /Sh1 16 0 R
  >>
  /ExtGState <<                # 扩展图形状态
    /GS1 17 0 R
  >>
  /Properties <<               # 属性
    /MC1 18 0 R
  >>
>>
```

### 字体资源
```
10 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
/Encoding /WinAnsiEncoding
>>
endobj
```

### 图像资源
```
12 0 obj
<<
/Type /XObject
/Subtype /Image
/Width 200
/Height 150
/BitsPerComponent 8
/ColorSpace /DeviceRGB
/Filter /DCTDecode
/Length 15234
>>
stream
...JPEG图像数据...
endstream
endobj
```

## 页面属性

### 旋转属性
```
/Rotate 90                     # 顺时针旋转90度
```
- 0: 不旋转（默认）
- 90: 顺时针90度
- 180: 180度
- 270: 顺时针270度（逆时针90度）

### 用户单位
```
/UserUnit 2.0                  # 用户单位比例
```
- 默认值为1.0
- 1用户单位 = 1/72英寸
- UserUnit=2.0表示1用户单位=1/36英寸

### 页面标签
```
/Tabs /S                       # 标签顺序
```
- /S: 结构顺序
- /R: 行顺序
- /C: 列顺序

## 注释数组

页面可以包含各种类型的注释。

### 注释数组定义
```
/Annots [20 0 R 21 0 R 22 0 R]
```

### 文本注释
```
20 0 obj
<<
/Type /Annot
/Subtype /Text
/Rect [100 700 120 720]        # 注释位置
/Contents (This is a note)
/Open true
/Icon /Note
>>
endobj
```

### 链接注释
```
21 0 obj
<<
/Type /Annot
/Subtype /Link
/Rect [100 650 200 670]
/A <<                          # 动作
  /Type /Action
  /S /URI
  /URI (https://example.com)
>>
/Border [0 0 1]                # 边框样式
>>
endobj
```

## 页面继承机制

### 可继承属性
- Resources（资源字典）
- MediaBox（媒体框）
- CropBox（裁剪框）
- Rotate（旋转）

### 继承规则
```
页面树根节点
├── MediaBox: [0 0 612 792]
├── Resources: { Font: { F1: 10 0 R } }
└── 子页面
    ├── 继承父节点的MediaBox和Resources
    ├── 可以覆盖继承的属性
    └── 添加自己的特定属性
```

### 继承示例
```
# 父节点定义
2 0 obj
<<
/Type /Pages
/MediaBox [0 0 612 792]
/Resources <<
  /Font << /F1 10 0 R >>
>>
/Kids [3 0 R]
>>
endobj

# 子页面（自动继承MediaBox和Resources）
3 0 obj
<<
/Type /Page
/Parent 2 0 R
# MediaBox和Resources从父节点继承
/Contents 8 0 R
>>
endobj
```

## 页面渲染流程

### 渲染步骤
1. **解析页面对象**：获取页面属性和内容引用
2. **建立坐标系**：根据MediaBox和变换矩阵
3. **加载资源**：解析字体、图像等资源
4. **处理内容流**：解析和执行图形操作
5. **渲染注释**：绘制页面注释
6. **应用裁剪**：根据CropBox裁剪显示区域

### 坐标系统
```
(0,792) ────────────── (612,792)
   │                        │
   │     PDF页面坐标系       │
   │   (原点在左下角)        │
   │                        │
(0,0) ──────────────── (612,0)
```

### 变换矩阵
```
[a b c d e f]                  # 变换矩阵

# 变换公式
x' = a*x + c*y + e
y' = b*x + d*y + f

# 常见变换
[1 0 0 1 tx ty]               # 平移
[sx 0 0 sy 0 0]               # 缩放
[cos(θ) sin(θ) -sin(θ) cos(θ) 0 0]  # 旋转
```

## 性能优化

### 页面缓存策略
```javascript
/**
 * 页面缓存管理
 */
class PageCache {
  constructor(maxSize = 10) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }
  
  /**
   * 获取页面内容
   * @param {number} pageNum - 页面编号
   * @returns {Object} 页面内容
   */
  getPage(pageNum) {
    if (this.cache.has(pageNum)) {
      return this.cache.get(pageNum);
    }
    
    const page = this.loadPage(pageNum);
    this.cache.set(pageNum, page);
    
    // 清理超出限制的缓存
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    return page;
  }
}
```

### 延迟加载
- 只在需要时加载页面内容
- 预加载相邻页面
- 卸载不再需要的页面

理解PDF页面结构是实现PDF查看器和处理工具的基础，它定义了内容的组织方式和渲染规则，为复杂文档的正确显示提供了保障。