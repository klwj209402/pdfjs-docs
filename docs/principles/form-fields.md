# 表单字段（Form Fields）

PDF表单字段系统（也称为AcroForm）允许创建可交互的表单，用户可以填写文本、选择选项、签名等。表单字段是特殊类型的注释，具有数据收集和处理功能。

## 表单架构

### 表单字典结构

```pdf
% 文档级别的表单字典
1 0 obj
<<
/Type /Catalog
/AcroForm <<
  /Fields [2 0 R 3 0 R 4 0 R]  % 顶级字段数组
  /NeedAppearances true         % 需要生成外观
  /SigFlags 3                   % 签名标志
  /CO [5 0 R]                   % 计算顺序
  /DR <<                        % 默认资源
    /Font <<
      /Helv 6 0 R
    >>
  >>
  /DA (/Helv 12 Tf 0 g)        % 默认外观
  /Q 0                          % 默认对齐方式
>>
>>
endobj
```

### 字段层次结构

```pdf
% 父字段（容器）
2 0 obj
<<
/Type /Annot
/Subtype /Widget
/FT /Tx                    % 字段类型：文本
/T (personal_info)         % 字段名称
/Kids [7 0 R 8 0 R]       % 子字段
/V ()                      % 字段值
/DV ()                     % 默认值
>>
endobj

% 子字段
7 0 obj
<<
/Type /Annot
/Subtype /Widget
/Parent 2 0 R
/T (name)                  % 完整名称：personal_info.name
/Rect [100 700 300 720]
/P 9 0 R                   % 所属页面
/V ()
/DA (/Helv 12 Tf 0 g)
/Q 0
/MaxLen 50
>>
endobj
```

## 字段类型

### 文本字段（Text Field）

```pdf
<<
/Type /Annot
/Subtype /Widget
/FT /Tx
/T (username)
/Rect [100 600 300 620]
/V (默认文本)
/DV (默认文本)
/DA (/Helv 12 Tf 0 g)
/Q 0                       % 左对齐
/MaxLen 30                 % 最大长度
/Ff 0                      % 字段标志
/AA <<                     % 附加动作
  /F <<                    % 获得焦点时
    /Type /Action
    /S /JavaScript
    /JS (this.getField("username").fillColor = color.yellow;)
  >>
  /Bl <<                   % 失去焦点时
    /Type /Action
    /S /JavaScript
    /JS (this.getField("username").fillColor = color.white;)
  >>
>>
>>
```

**文本字段属性：**
- **MaxLen**：最大字符长度
- **Multiline**：多行文本标志
- **Password**：密码字段标志
- **FileSelect**：文件选择标志
- **DoNotSpellCheck**：不检查拼写标志
- **DoNotScroll**：不滚动标志
- **Comb**：梳状字段标志
- **RichText**：富文本标志

### 按钮字段（Button Field）

#### 推按钮（Push Button）

```pdf
<<
/Type /Annot
/Subtype /Widget
/FT /Btn
/T (submit_button)
/Rect [100 500 200 530]
/TU (提交表单)             % 工具提示
/Ff 65536                  % 推按钮标志
/A <<                      % 激活动作
  /Type /Action
  /S /SubmitForm
  /F <<
    /Type /Filespec
    /F (http://example.com/submit)
  >>
  /Flags 4                 % 提交标志
>>
/AP <<
  /N <<
    /0 10 0 R              % 正常状态外观
  >>
  /D <<
    /0 11 0 R              % 按下状态外观
  >>
>>
>>
```

#### 复选框（Check Box）

```pdf
<<
/Type /Annot
/Subtype /Widget
/FT /Btn
/T (agree_terms)
/Rect [100 400 120 420]
/V /Yes                    % 选中值
/DV /Off                   % 默认值（未选中）
/AS /Off                   % 当前外观状态
/AP <<
  /N <<
    /Yes 12 0 R            % 选中状态外观
    /Off 13 0 R            % 未选中状态外观
  >>
>>
>>
```

#### 单选按钮（Radio Button）

```pdf
% 单选按钮组
<<
/Type /Annot
/Subtype /Widget
/FT /Btn
/T (gender)
/Ff 49152                  % 单选按钮标志
/V /Male                   % 当前选中值
/Kids [14 0 R 15 0 R]     % 单选按钮选项
>>

% 单选按钮选项1
14 0 obj
<<
/Type /Annot
/Subtype /Widget
/Parent 3 0 R
/Rect [100 300 120 320]
/AS /Off
/AP <<
  /N <<
    /Male 16 0 R
    /Off 17 0 R
  >>
>>
>>
endobj

% 单选按钮选项2
15 0 obj
<<
/Type /Annot
/Subtype /Widget
/Parent 3 0 R
/Rect [150 300 170 320]
/AS /Off
/AP <<
  /N <<
    /Female 18 0 R
    /Off 19 0 R
  >>
>>
>>
endobj
```

### 选择字段（Choice Field）

#### 列表框（List Box）

```pdf
<<
/Type /Annot
/Subtype /Widget
/FT /Ch
/T (country)
/Rect [100 200 250 280]
/Opt [                     % 选项数组
  (中国)
  (美国)
  (英国)
  (日本)
  [(法国) (France)]        % [显示值, 导出值]
]
/V (中国)                  % 当前选中值
/DV (中国)                 % 默认值
/TI 0                      % 顶部索引
/I [0]                     % 选中索引数组
/Ff 0                      % 列表框标志（非组合框）
>>
```

#### 组合框（Combo Box）

```pdf
<<
/Type /Annot
/Subtype /Widget
/FT /Ch
/T (city)
/Rect [100 150 250 170]
/Opt [
  (北京)
  (上海)
  (广州)
  (深圳)
]
/V (北京)
/DV (北京)
/Ff 131072                 % 组合框标志
/MaxLen 20                 % 最大输入长度
>>
```

### 签名字段（Signature Field）

```pdf
<<
/Type /Annot
/Subtype /Widget
/FT /Sig
/T (signature1)
/Rect [100 50 300 100]
/V 20 0 R                  % 签名字典引用
/Lock <<                   % 锁定字典
  /Type /SigFieldLock
  /Action /All             % 锁定所有字段
  /Fields []
>>
/SV <<                     % 种子值字典
  /Type /SV
  /Ff 1
  /Filter /Adobe.PPKLite
>>
>>
```

## 字段标志

### 通用字段标志

```javascript
/**
 * 字段标志常量
 */
const FieldFlags = {
  // 通用标志
  READ_ONLY: 1,              // 只读
  REQUIRED: 2,               // 必填
  NO_EXPORT: 4,              // 不导出
  
  // 文本字段标志
  MULTILINE: 4096,           // 多行
  PASSWORD: 8192,            // 密码
  FILE_SELECT: 1048576,      // 文件选择
  DO_NOT_SPELL_CHECK: 4194304, // 不检查拼写
  DO_NOT_SCROLL: 8388608,    // 不滚动
  COMB: 16777216,            // 梳状字段
  RICH_TEXT: 33554432,       // 富文本
  
  // 按钮字段标志
  NO_TOGGLE_TO_OFF: 16384,   // 不能切换到关闭
  RADIO: 32768,              // 单选按钮
  PUSHBUTTON: 65536,         // 推按钮
  RADIOS_IN_UNISON: 33554432, // 单选按钮同步
  
  // 选择字段标志
  COMBO: 131072,             // 组合框
  EDIT: 262144,              // 可编辑
  SORT: 524288,              // 排序
  MULTI_SELECT: 2097152,     // 多选
  DO_NOT_SPELL_CHECK_CHOICE: 4194304, // 选择字段不检查拼写
  COMMIT_ON_SEL_CHANGE: 67108864 // 选择改变时提交
};

/**
 * 检查字段标志
 * @param {number} flags - 标志值
 * @param {number} flag - 要检查的标志
 * @returns {boolean} 是否设置了该标志
 */
function hasFieldFlag(flags, flag) {
  return (flags & flag) !== 0;
}
```

## 表单处理

### 表单数据提取

```javascript
/**
 * 表单数据处理器
 */
class FormDataProcessor {
  /**
   * 提取表单数据
   * @param {Object} acroForm - AcroForm字典
   * @returns {Object} 表单数据对象
   */
  extractFormData(acroForm) {
    const formData = {};
    
    if (acroForm.Fields) {
      acroForm.Fields.forEach(field => {
        this.extractFieldData(field, formData);
      });
    }
    
    return formData;
  }
  
  /**
   * 提取字段数据
   * @param {Object} field - 字段对象
   * @param {Object} formData - 表单数据对象
   * @param {string} parentName - 父字段名称
   */
  extractFieldData(field, formData, parentName = '') {
    const fieldName = this.getFullFieldName(field, parentName);
    
    if (field.Kids) {
      // 容器字段，递归处理子字段
      field.Kids.forEach(kid => {
        this.extractFieldData(kid, formData, fieldName);
      });
    } else {
      // 终端字段，提取值
      const value = this.getFieldValue(field);
      if (value !== null) {
        formData[fieldName] = value;
      }
    }
  }
  
  /**
   * 获取字段值
   * @param {Object} field - 字段对象
   * @returns {*} 字段值
   */
  getFieldValue(field) {
    if (field.V !== undefined) {
      return this.normalizeFieldValue(field.V, field.FT);
    }
    return field.DV || null;
  }
  
  /**
   * 标准化字段值
   * @param {*} value - 原始值
   * @param {string} fieldType - 字段类型
   * @returns {*} 标准化后的值
   */
  normalizeFieldValue(value, fieldType) {
    switch (fieldType) {
      case '/Tx': // 文本字段
        return typeof value === 'string' ? value : String(value);
      case '/Btn': // 按钮字段
        return value === '/Yes' || value === true;
      case '/Ch': // 选择字段
        return Array.isArray(value) ? value : [value];
      case '/Sig': // 签名字段
        return value ? 'signed' : 'unsigned';
      default:
        return value;
    }
  }
}
```

### 表单验证

```javascript
/**
 * 表单验证器
 */
class FormValidator {
  constructor() {
    this.validationRules = new Map();
    this.errorMessages = new Map();
  }
  
  /**
   * 添加验证规则
   * @param {string} fieldName - 字段名称
   * @param {Function} validator - 验证函数
   * @param {string} errorMessage - 错误消息
   */
  addRule(fieldName, validator, errorMessage) {
    if (!this.validationRules.has(fieldName)) {
      this.validationRules.set(fieldName, []);
    }
    this.validationRules.get(fieldName).push({
      validator,
      errorMessage
    });
  }
  
  /**
   * 验证表单数据
   * @param {Object} formData - 表单数据
   * @returns {Object} 验证结果
   */
  validateForm(formData) {
    const errors = {};
    let isValid = true;
    
    for (const [fieldName, rules] of this.validationRules) {
      const fieldValue = formData[fieldName];
      const fieldErrors = [];
      
      rules.forEach(rule => {
        if (!rule.validator(fieldValue, formData)) {
          fieldErrors.push(rule.errorMessage);
          isValid = false;
        }
      });
      
      if (fieldErrors.length > 0) {
        errors[fieldName] = fieldErrors;
      }
    }
    
    return { isValid, errors };
  }
  
  /**
   * 预定义验证器
   */
  static validators = {
    required: (value) => value !== null && value !== undefined && value !== '',
    email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    minLength: (min) => (value) => value && value.length >= min,
    maxLength: (max) => (value) => !value || value.length <= max,
    numeric: (value) => !value || /^\d+$/.test(value),
    phone: (value) => !value || /^[\d\-\+\(\)\s]+$/.test(value)
  };
}
```

## 表单提交

### 提交动作

```pdf
% 提交表单动作
<<
/Type /Action
/S /SubmitForm
/F <<
  /Type /Filespec
  /F (http://example.com/submit)
>>
/Fields [2 0 R 3 0 R]      % 要提交的字段
/Flags 4                   % 提交标志：包含字段值
/CharSet (utf-8)           % 字符编码
/Format /HTML              % 提交格式
>>
```

### 提交格式

```javascript
/**
 * 表单提交处理器
 */
class FormSubmissionHandler {
  /**
   * 生成FDF格式数据
   * @param {Object} formData - 表单数据
   * @param {string} sourceFile - 源文件路径
   * @returns {string} FDF格式字符串
   */
  generateFDF(formData, sourceFile) {
    let fdf = '%FDF-1.2\n';
    fdf += '1 0 obj\n<<\n/FDF\n<<\n';
    fdf += `/F (${sourceFile})\n`;
    fdf += '/Fields [\n';
    
    Object.entries(formData).forEach(([name, value]) => {
      fdf += `<<\n/T (${name})\n/V `;
      if (typeof value === 'string') {
        fdf += `(${value})`;
      } else if (typeof value === 'boolean') {
        fdf += value ? '/Yes' : '/Off';
      } else {
        fdf += `(${String(value)})`;
      }
      fdf += '\n>>\n';
    });
    
    fdf += ']\n>>\n>>\nendobj\n';
    fdf += 'trailer\n<<\n/Root 1 0 R\n>>\n%%EOF';
    
    return fdf;
  }
  
  /**
   * 生成HTML格式数据
   * @param {Object} formData - 表单数据
   * @returns {string} HTML表单字符串
   */
  generateHTML(formData) {
    let html = '<form method="post">\n';
    
    Object.entries(formData).forEach(([name, value]) => {
      const encodedName = this.htmlEncode(name);
      const encodedValue = this.htmlEncode(String(value));
      html += `<input type="hidden" name="${encodedName}" value="${encodedValue}">\n`;
    });
    
    html += '</form>';
    return html;
  }
  
  /**
   * HTML编码
   * @param {string} str - 要编码的字符串
   * @returns {string} 编码后的字符串
   */
  htmlEncode(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
```

## 计算字段

### JavaScript计算

```pdf
% 计算字段示例
<<
/Type /Annot
/Subtype /Widget
/FT /Tx
/T (total)
/Rect [300 100 400 120]
/V ()
/AA <<
  /C <<                    % 计算动作
    /Type /Action
    /S /JavaScript
    /JS (
      var price = this.getField("price").value;
      var quantity = this.getField("quantity").value;
      event.value = price * quantity;
    )
  >>
>>
>>
```

### 计算顺序

```pdf
% AcroForm中的计算顺序
<<
/CO [                      % 计算顺序数组
  5 0 R                    % 小计字段
  6 0 R                    % 税额字段
  7 0 R                    % 总计字段
]
>>
```

## 表单安全

### 字段锁定

```pdf
% 签名后锁定字段
<<
/Type /SigFieldLock
/Action /Include           % 锁定指定字段
/Fields [(name) (address) (phone)]
>>
```

### 使用权限

```pdf
% 使用权限字典
<<
/Type /Sig
/Filter /Adobe.PPKLite
/SubFilter /adbe.pkcs7.detached
/Reference [<<
  /Type /SigRef
  /TransformMethod /UR3
  /TransformParams <<
    /Type /TransformParams
    /V /2.2
    /Form true             % 允许表单填写
    /FormEx true           % 允许表单导入/导出
    /Annots true           % 允许注释
  >>
>>]
>>
```

## 最佳实践

### 表单设计

1. **字段命名**：使用有意义的层次化字段名称
2. **默认值**：为字段设置合理的默认值
3. **验证规则**：实现客户端和服务端双重验证
4. **用户体验**：提供清晰的标签和帮助信息
5. **无障碍访问**：确保表单可被辅助技术访问

### 性能优化

1. **延迟计算**：避免不必要的字段计算
2. **批量更新**：批量处理字段值变更
3. **缓存机制**：缓存计算结果和验证状态
4. **异步处理**：异步执行复杂的表单操作

### 数据安全

1. **输入验证**：严格验证用户输入
2. **数据加密**：敏感数据传输加密
3. **访问控制**：实现适当的字段访问控制
4. **审计日志**：记录表单操作日志

PDF表单字段系统为文档提供了强大的数据收集和处理能力，理解其结构和实现原理对于开发交互式PDF应用至关重要。