# PDF 内容流

PDF内容流是描述页面视觉内容的指令序列，使用类似PostScript的图形描述语言。理解内容流是实现PDF渲染的核心。

## 内容流基础

### 内容流对象结构
```
8 0 obj
<<
/Length 256                    # 流数据长度
/Filter /FlateDecode           # 压缩过滤器
>>
stream
...压缩的内容流数据...
endstream
endobj
```

### 解压后的内容流示例
```
% 图形状态操作
q                              # 保存图形状态
1 0 0 1 100 700 cm            # 设置变换矩阵

% 文本操作
BT                             # 开始文本对象
/F1 12 Tf                      # 设置字体和大小
0 0 Td                         # 设置文本位置
(Hello World) Tj               # 显示文本
ET                             # 结束文本对象

% 路径操作
200 0 0 100 0 0 re             # 绘制矩形
S                              # 描边

Q                              # 恢复图形状态
```

## 操作符分类

### 图形状态操作符

#### 状态保存与恢复
```
q                              # 保存当前图形状态
Q                              # 恢复图形状态
```

#### 变换矩阵
```
a b c d e f cm                 # 连接变换矩阵
# [a b c d e f] 表示变换矩阵
# x' = a*x + c*y + e
# y' = b*x + d*y + f

# 常见变换示例
1 0 0 1 100 200 cm            # 平移 (100, 200)
2 0 0 2 0 0 cm                # 缩放 2倍
0.707 0.707 -0.707 0.707 0 0 cm  # 旋转 45度
```

#### 线宽和线型
```
2 w                            # 设置线宽为2
[3 2] 0 d                      # 设置虚线模式：3单位线，2单位空隙
[] 0 d                         # 实线模式
0 J                            # 线端样式：0=平端，1=圆端，2=方端
0 j                            # 线连接样式：0=斜接，1=圆接，2=斜切
10 M                           # 斜接限制
```

#### 颜色设置
```
# 灰度颜色
0.5 g                          # 填充灰度
0.8 G                          # 描边灰度

# RGB颜色
1 0 0 rg                       # 红色填充
0 1 0 RG                       # 绿色描边

# CMYK颜色
0 1 1 0 k                      # 红色填充（CMYK）
0 0 1 0 K                      # 黄色描边（CMYK）

# 颜色空间
/CS1 cs                        # 设置填充颜色空间
/CS1 CS                        # 设置描边颜色空间
```

### 路径构造操作符

#### 路径移动和直线
```
100 200 m                      # 移动到点 (100, 200)
300 200 l                      # 直线到点 (300, 200)
300 400 l                      # 直线到点 (300, 400)
100 400 l                      # 直线到点 (100, 400)
h                              # 闭合路径
```

#### 矩形
```
x y w h re                     # 矩形：左下角(x,y)，宽度w，高度h
100 200 200 100 re             # 矩形 (100,200) 宽200 高100
```

#### 曲线
```
# 三次贝塞尔曲线
x1 y1 x2 y2 x3 y3 c            # 控制点(x1,y1), (x2,y2), 终点(x3,y3)

# 简化曲线（第一个控制点为当前点）
x2 y2 x3 y3 v                  # 控制点(x2,y2), 终点(x3,y3)

# 简化曲线（第二个控制点为终点）
x1 y1 x3 y3 y                  # 控制点(x1,y1), 终点(x3,y3)
```

### 路径绘制操作符

#### 基本绘制
```
S                              # 描边路径
s                              # 闭合并描边路径
f                              # 填充路径（非零缠绕规则）
f*                             # 填充路径（奇偶规则）
F                              # 填充路径（非零缠绕规则，兼容性）
B                              # 填充并描边路径
B*                             # 填充（奇偶）并描边路径
b                              # 闭合、填充并描边路径
b*                             # 闭合、填充（奇偶）并描边路径
n                              # 结束路径（不绘制）
```

#### 裁剪路径
```
W                              # 设置裁剪路径（非零缠绕规则）
W*                             # 设置裁剪路径（奇偶规则）
n                              # 结束路径定义
```

### 文本操作符

#### 文本对象
```
BT                             # 开始文本对象
ET                             # 结束文本对象
```

#### 文本状态
```
/F1 12 Tf                      # 设置字体和大小
2 Tc                           # 字符间距
4 Tw                           # 单词间距
100 Tz                         # 水平缩放（百分比）
2 TL                           # 行间距
0 Tr                           # 渲染模式
1 Ts                           # 文本上升
```

#### 文本定位
```
tx ty Td                       # 移动文本位置
tx ty TD                       # 移动文本位置并设置行间距
Tm a b c d e f                 # 设置文本矩阵
T*                             # 移动到下一行
```

#### 文本显示
```
(Hello World) Tj               # 显示文本字符串
[(Hello) 120 (World)] TJ       # 显示文本数组（带字距调整）
' (Next line) '                # 移到下一行并显示文本
" aw ac (Text) "                # 设置间距并显示文本
```

### 外部对象操作符

#### 图像显示
```
/Im1 Do                        # 显示图像对象 Im1
```

#### 表单显示
```
/Fm1 Do                        # 显示表单对象 Fm1
```

## 图形状态参数

### 当前变换矩阵（CTM）
```
# 初始矩阵（单位矩阵）
[1 0 0 1 0 0]

# 变换操作
2 0 0 2 100 200 cm            # 缩放2倍，平移(100,200)
# 结果矩阵：[2 0 0 2 100 200]
```

### 裁剪路径
```
# 设置矩形裁剪区域
50 50 200 300 re               # 定义矩形
W                              # 设置为裁剪路径
n                              # 结束路径

# 后续所有绘制都被裁剪到此区域
```

### 颜色空间
```
# 设备相关颜色空间
/DeviceGray                    # 灰度
/DeviceRGB                     # RGB
/DeviceCMYK                    # CMYK

# 设备无关颜色空间
/CalGray                       # 校准灰度
/CalRGB                        # 校准RGB
/Lab                           # Lab颜色空间
/ICCBased                      # ICC配置文件
```

## 文本渲染模式

```
0 Tr                           # 填充文本
1 Tr                           # 描边文本
2 Tr                           # 填充并描边文本
3 Tr                           # 不可见文本
4 Tr                           # 填充文本并添加到裁剪路径
5 Tr                           # 描边文本并添加到裁剪路径
6 Tr                           # 填充、描边文本并添加到裁剪路径
7 Tr                           # 添加文本到裁剪路径
```

## 复杂内容流示例

### 绘制带文本的图形
```
% 保存图形状态
q

% 设置填充颜色为蓝色
0 0 1 rg

% 绘制圆形（使用贝塞尔曲线近似）
200 300 m
200 344.18 176.18 380 132 380 c
87.82 380 64 344.18 64 300 c
64 255.82 87.82 220 132 220 c
176.18 220 200 255.82 200 300 c
f

% 设置文本颜色为白色
1 g

% 绘制文本
BT
/F1 14 Tf
110 295 Td
(Circle) Tj
ET

% 恢复图形状态
Q
```

### 渐变填充
```
% 定义渐变
/Sh1 sh                        # 应用渐变 Sh1

% 渐变对象定义（在资源中）
<<
/ShadingType 2                 # 轴向渐变
/ColorSpace /DeviceRGB
/Coords [0 0 100 100]          # 渐变轴
/Function <<
  /FunctionType 2
  /Domain [0 1]
  /C0 [1 0 0]                  # 起始颜色（红色）
  /C1 [0 0 1]                  # 结束颜色（蓝色）
  /N 1
>>
>>
```

## 内容流解析

### 解析器状态机
```javascript
/**
 * 内容流解析器
 */
class ContentStreamParser {
  constructor() {
    this.stack = [];             // 操作数栈
    this.graphicsState = new GraphicsState();
  }
  
  /**
   * 解析内容流
   * @param {string} content - 内容流字符串
   */
  parse(content) {
    const tokens = this.tokenize(content);
    
    for (const token of tokens) {
      if (this.isOperator(token)) {
        this.executeOperator(token);
      } else {
        this.stack.push(this.parseOperand(token));
      }
    }
  }
  
  /**
   * 执行操作符
   * @param {string} operator - 操作符
   */
  executeOperator(operator) {
    switch (operator) {
      case 'q':
        this.graphicsState.save();
        break;
      case 'Q':
        this.graphicsState.restore();
        break;
      case 'cm':
        const matrix = this.stack.splice(-6);
        this.graphicsState.transform(matrix);
        break;
      case 'Tj':
        const text = this.stack.pop();
        this.showText(text);
        break;
      // ... 其他操作符
    }
  }
}
```

### 图形状态管理
```javascript
/**
 * 图形状态类
 */
class GraphicsState {
  constructor() {
    this.ctm = [1, 0, 0, 1, 0, 0]; // 当前变换矩阵
    this.lineWidth = 1;
    this.lineCap = 0;
    this.lineJoin = 0;
    this.fillColor = [0, 0, 0];
    this.strokeColor = [0, 0, 0];
    this.font = null;
    this.fontSize = 12;
    this.stateStack = [];
  }
  
  /**
   * 保存当前状态
   */
  save() {
    this.stateStack.push({
      ctm: [...this.ctm],
      lineWidth: this.lineWidth,
      lineCap: this.lineCap,
      lineJoin: this.lineJoin,
      fillColor: [...this.fillColor],
      strokeColor: [...this.strokeColor],
      font: this.font,
      fontSize: this.fontSize
    });
  }
  
  /**
   * 恢复状态
   */
  restore() {
    if (this.stateStack.length > 0) {
      const state = this.stateStack.pop();
      Object.assign(this, state);
    }
  }
  
  /**
   * 应用变换矩阵
   * @param {Array} matrix - 变换矩阵 [a, b, c, d, e, f]
   */
  transform(matrix) {
    const [a, b, c, d, e, f] = matrix;
    const [m11, m12, m21, m22, m31, m32] = this.ctm;
    
    this.ctm = [
      a * m11 + b * m21,
      a * m12 + b * m22,
      c * m11 + d * m21,
      c * m12 + d * m22,
      e * m11 + f * m21 + m31,
      e * m12 + f * m22 + m32
    ];
  }
}
```

## 性能优化

### 内容流缓存
```javascript
/**
 * 内容流缓存
 */
class ContentStreamCache {
  constructor() {
    this.cache = new Map();
  }
  
  /**
   * 获取解析后的内容流
   * @param {string} streamId - 流ID
   * @param {Function} parser - 解析函数
   * @returns {Object} 解析结果
   */
  getParsedStream(streamId, parser) {
    if (this.cache.has(streamId)) {
      return this.cache.get(streamId);
    }
    
    const result = parser();
    this.cache.set(streamId, result);
    return result;
  }
}
```

### 增量渲染
- 按操作符分组
- 延迟执行复杂操作
- 优先渲染可见区域

理解PDF内容流是实现PDF渲染引擎的核心，它定义了如何将抽象的图形描述转换为具体的视觉输出，为PDF文档的正确显示提供了精确的指令集。