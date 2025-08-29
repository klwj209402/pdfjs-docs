# PDF 文件结构

PDF文件采用分层的结构设计，从物理层面到逻辑层面都有清晰的组织方式。理解这种结构是掌握PDF处理的基础。

## 文件整体结构

PDF文件由四个主要部分组成：

```
%PDF-1.7                    ← 文件头
%âãÏÓ                      ← 二进制标识

1 0 obj                     ← 对象定义区
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
>>
endobj

xref                        ← 交叉引用表
0 4
0000000000 65535 f 
0000000015 00000 n 
0000000074 00000 n 
0000000120 00000 n 

trailer                     ← 文件尾部
<<
/Size 4
/Root 1 0 R
>>
startxref
178
%%EOF
```

## 1. 文件头（Header）

### PDF版本标识
```
%PDF-1.7
```
- 以`%PDF-`开头，后跟版本号
- 常见版本：1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.0
- 必须出现在文件的第一行

### 二进制标识
```
%âãÏÓ
```
- 包含ASCII值大于127的字符
- 告知文件传输程序这是二进制文件
- 防止在文本模式下传输时损坏

## 2. 对象定义区（Body）

### 对象结构
每个PDF对象都有固定的格式：

```
n g obj
  对象内容
endobj
```

- `n`：对象编号（从1开始）
- `g`：生成编号（通常为0）
- `obj`和`endobj`：对象边界标识

### 对象类型

#### 字典对象
```
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
/OpenAction [3 0 R /XYZ null null null]
>>
endobj
```

#### 数组对象
```
4 0 obj
[/PDF /Text /ImageB /ImageC /ImageI]
endobj
```

#### 流对象
```
5 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Hello World) Tj
ET
endstream
endobj
```

## 3. 交叉引用表（Cross-Reference Table）

### 传统格式
```
xref
0 6
0000000000 65535 f 
0000000015 00000 n 
0000000074 00000 n 
0000000120 00000 n 
0000000179 00000 n 
0000000364 00000 n 
```

- `0 6`：从对象0开始，共6个条目
- 每行20字节：10位偏移量 + 1空格 + 5位生成号 + 1空格 + 1字符状态 + 1空格 + 1换行
- 状态：`n`（使用中）、`f`（空闲）

### 压缩格式（PDF 1.5+）
```
6 0 obj
<<
/Type /XRef
/Size 7
/W [1 2 1]
/Root 1 0 R
/Length 24
>>
stream
...(二进制数据)...
endstream
endobj
```

## 4. 文件尾部（Trailer）

### 基本结构
```
trailer
<<
/Size 6
/Root 1 0 R
/Info 5 0 R
>>
startxref
408
%%EOF
```

### 关键字段
- `/Size`：交叉引用表中的条目总数
- `/Root`：文档目录对象的引用
- `/Info`：文档信息字典的引用（可选）
- `/Encrypt`：加密字典的引用（如果文档加密）
- `startxref`：交叉引用表的字节偏移量
- `%%EOF`：文件结束标记

## 文档结构层次

### 逻辑结构
```
文档目录 (Catalog)
├── 页面树 (Pages)
│   ├── 页面节点 (Pages)
│   └── 页面叶子 (Page)
│       ├── 内容流 (Contents)
│       ├── 资源字典 (Resources)
│       └── 注释数组 (Annots)
├── 大纲 (Outlines)
├── 名称字典 (Names)
└── 信息字典 (Info)
```

### 文档目录示例
```
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
/Outlines 10 0 R
/Names 11 0 R
/OpenAction [3 0 R /XYZ null null null]
/PageMode /UseOutlines
/PageLayout /SinglePage
>>
endobj
```

## 增量更新机制

PDF支持增量更新，新内容追加到文件末尾：

```
原始PDF内容
%%EOF

新增对象
7 0 obj
<<
/Type /Annot
/Subtype /Text
>>
endobj

xref
7 1
0000001234 00000 n 

trailer
<<
/Size 8
/Prev 408
/Root 1 0 R
>>
startxref
1280
%%EOF
```

## 文件解析流程

1. **读取文件头**：确定PDF版本
2. **定位trailer**：从文件末尾向前搜索`%%EOF`
3. **解析trailer**：获取交叉引用表位置和根对象
4. **读取交叉引用表**：建立对象位置索引
5. **解析文档目录**：获取页面树和其他结构
6. **按需加载对象**：根据引用关系解析具体对象

## 性能优化考虑

### 线性化PDF
- 优化网络传输的PDF结构
- 支持边下载边显示
- 重新组织对象顺序

### 对象流压缩
- 将多个小对象打包压缩
- 减少文件大小
- 提高解析效率

理解PDF文件结构是进行PDF处理的基础，这种设计既保证了文档的完整性，又提供了良好的扩展性和向后兼容性。