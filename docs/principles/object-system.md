# PDF 对象系统

PDF的对象系统是整个文档格式的核心，它定义了数据的组织方式和引用机制。理解对象系统对于深入掌握PDF处理至关重要。

## 基本数据类型

### 1. 布尔值（Boolean）
```
true
false
```

### 2. 数值（Numeric）
```
123          # 整数
-456         # 负整数
3.14159      # 实数
-2.5         # 负实数
0.0          # 零
```

### 3. 字符串（String）

#### 字面字符串
```
(Hello World)                    # 基本字符串
(String with \(parentheses\))    # 转义字符
(Multi-line
string)                         # 多行字符串
```

#### 十六进制字符串
```
<48656C6C6F>                     # "Hello" 的十六进制表示
<901FA3>                         # 二进制数据
```

### 4. 名称（Name）
```
/Type                            # 简单名称
/Font                           # 字体名称
/BaseFont                       # 复合名称
/Adobe#20Systems                # 包含空格（#20 = 空格）
```

### 5. 数组（Array）
```
[1 2 3]                         # 数值数组
[/PDF /Text /ImageB]            # 名称数组
[1 0 R 2 0 R 3 0 R]            # 引用数组
[(Hello) (World)]               # 字符串数组
[1 [2 3] 4]                     # 嵌套数组
```

### 6. 字典（Dictionary）
```
<<
/Type /Catalog
/Pages 2 0 R
/OpenAction [3 0 R /XYZ null null null]
/PageMode /UseOutlines
>>
```

### 7. 流（Stream）
```
5 0 obj
<<
/Length 44
/Filter /FlateDecode
>>
stream
...压缩的二进制数据...
endstream
endobj
```

### 8. 空值（Null）
```
null
```

## 间接对象与引用

### 间接对象定义
```
n g obj
  对象内容
endobj
```

- `n`：对象编号（正整数）
- `g`：生成编号（非负整数，通常为0）

### 间接引用
```
n g R
```

示例：
```
1 0 obj                         # 定义对象1
<<
/Type /Catalog
/Pages 2 0 R                   # 引用对象2
>>
endobj

2 0 obj                         # 定义对象2
<<
/Type /Pages
/Kids [3 0 R]                  # 引用对象3
/Count 1
>>
endobj
```

## 对象类型层次

### 文档级对象

#### 文档目录（Document Catalog）
```
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R                   # 页面树根节点
/Outlines 10 0 R               # 书签大纲
/Names 11 0 R                  # 名称字典
/Dests 12 0 R                  # 目标字典
/ViewerPreferences <<          # 查看器首选项
  /HideToolbar true
  /HideMenubar true
>>
/OpenAction [3 0 R /XYZ null null null]  # 打开动作
/PageMode /UseOutlines         # 页面模式
/PageLayout /SinglePage        # 页面布局
>>
endobj
```

#### 信息字典（Info Dictionary）
```
15 0 obj
<<
/Title (PDF Document Title)
/Author (Document Author)
/Subject (Document Subject)
/Keywords (keyword1, keyword2)
/Creator (Creating Application)
/Producer (PDF Producer)
/CreationDate (D:20240101120000+08'00')
/ModDate (D:20240101120000+08'00')
>>
endobj
```

### 页面相关对象

#### 页面树节点（Pages）
```
2 0 obj
<<
/Type /Pages
/Kids [3 0 R 4 0 R 5 0 R]      # 子页面或子节点
/Count 3                       # 叶子页面总数
/MediaBox [0 0 612 792]        # 继承的媒体框
/Resources <<                  # 继承的资源
  /Font <<
    /F1 6 0 R
  >>
>>
>>
endobj
```

#### 页面对象（Page）
```
3 0 obj
<<
/Type /Page
/Parent 2 0 R                  # 父页面树节点
/MediaBox [0 0 612 792]        # 媒体框（页面尺寸）
/CropBox [36 36 576 756]       # 裁剪框
/BleedBox [18 18 594 774]      # 出血框
/TrimBox [36 36 576 756]       # 修剪框
/ArtBox [54 54 558 738]        # 艺术框
/Contents [7 0 R 8 0 R]        # 内容流
/Resources <<                  # 页面资源
  /Font <<
    /F1 6 0 R
    /F2 9 0 R
  >>
  /XObject <<
    /Im1 10 0 R
  >>
>>
/Annots [11 0 R 12 0 R]        # 注释数组
/Rotate 0                      # 旋转角度
>>
endobj
```

### 内容相关对象

#### 内容流（Content Stream）
```
7 0 obj
<<
/Length 128
/Filter /FlateDecode
>>
stream
...压缩的内容流数据...
endstream
endobj
```

解压后的内容流：
```
BT                             # 开始文本对象
/F1 12 Tf                      # 设置字体和大小
100 700 Td                     # 移动文本位置
(Hello World) Tj               # 显示文本
ET                             # 结束文本对象

q                              # 保存图形状态
1 0 0 1 100 600 cm            # 变换矩阵
200 0 0 100 0 0 re             # 矩形路径
S                              # 描边
Q                              # 恢复图形状态
```

#### 字体对象（Font）
```
6 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
/Encoding /WinAnsiEncoding
>>
endobj
```

#### 图像对象（Image XObject）
```
10 0 obj
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

## 对象引用机制

### 直接引用
```
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R                   # 直接引用对象2
>>
endobj
```

### 间接引用链
```
文档目录 → 页面树 → 页面 → 内容流
1 0 R   → 2 0 R  → 3 0 R → 7 0 R
```

### 循环引用处理
PDF允许循环引用，但解析器需要检测并处理：
```
页面 ← Parent → 页面树
3 0 R          2 0 R
```

## 对象生成与版本控制

### 生成编号的作用
- 支持增量更新
- 对象版本管理
- 删除对象的重用

### 对象更新示例
```
# 原始对象
5 0 obj
<<
/Type /Page
/Contents 6 0 R
>>
endobj

# 更新后的对象（生成编号递增）
5 1 obj
<<
/Type /Page
/Contents [6 0 R 7 0 R]        # 添加了新的内容流
>>
endobj
```

## 对象压缩（PDF 1.5+）

### 对象流（Object Stream）
```
20 0 obj
<<
/Type /ObjStm
/N 3                           # 包含的对象数量
/First 15                      # 第一个对象的偏移量
/Length 150
/Filter /FlateDecode
>>
stream
21 0 22 25 23 40               # 对象编号和偏移量
<<                             # 对象21的内容
/Type /Font
/Subtype /Type1
>>
<<                             # 对象22的内容
/Type /FontDescriptor
>>
<<                             # 对象23的内容
/Type /Encoding
>>
endstream
endobj
```

## 内存管理策略

### 延迟加载
- 只在需要时解析对象
- 减少内存占用
- 提高启动速度

### 对象缓存
- 缓存频繁访问的对象
- 避免重复解析
- 平衡内存使用

### 垃圾回收
- 识别未引用的对象
- 清理临时对象
- 优化内存使用

## 解析算法

### 对象解析流程
```javascript
/**
 * 解析PDF对象
 * @param {number} objNum - 对象编号
 * @param {number} genNum - 生成编号
 * @returns {Object} 解析后的对象
 */
function parseObject(objNum, genNum) {
  // 1. 从交叉引用表获取对象位置
  const offset = xrefTable.getOffset(objNum, genNum);
  
  // 2. 定位到对象位置
  stream.seek(offset);
  
  // 3. 验证对象头
  const header = stream.readLine();
  if (!header.match(/^\d+ \d+ obj$/)) {
    throw new Error('Invalid object header');
  }
  
  // 4. 解析对象内容
  const content = parseValue();
  
  // 5. 验证对象尾
  const trailer = stream.readLine();
  if (trailer !== 'endobj') {
    throw new Error('Missing endobj');
  }
  
  return content;
}
```

理解PDF对象系统是掌握PDF处理的关键，它提供了灵活而强大的数据组织方式，支持复杂文档结构的表示和高效的数据访问。