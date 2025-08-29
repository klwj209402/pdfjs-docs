# PDFDocumentProxy

`PDFDocumentProxy` 是 PDF 文档的代理对象，提供了访问 PDF 文档信息和页面的接口。通过 `getDocument()` 方法获得。

## 属性

### numPages

- **类型**: `number`
- **只读**: 是
- **描述**: PDF 文档的总页数

```javascript
console.log('总页数:', pdf.numPages);
```

### fingerprints

- **类型**: `Array<string>`
- **只读**: 是
- **描述**: PDF 文档的指纹信息，用于唯一标识文档

```javascript
console.log('文档指纹:', pdf.fingerprints);
```

### loadingParams

- **类型**: `Object`
- **只读**: 是
- **描述**: 文档加载时使用的参数

## 方法

### getPage(pageNumber)

获取指定页面的代理对象。

**参数**:
- `pageNumber` (`number`) - 页面编号（从 1 开始）

**返回值**: `Promise<PDFPageProxy>`

```javascript
// 获取第一页
pdf.getPage(1).then(function(page) {
  console.log('页面尺寸:', page.view);
});
```

### getPageIndex(ref)

根据页面引用获取页面索引。

**参数**:
- `ref` (`RefProxy`) - 页面引用对象

**返回值**: `Promise<number>`

```javascript
pdf.getPageIndex(pageRef).then(function(index) {
  console.log('页面索引:', index);
});
```

### getDestinations()

获取文档中的所有目标链接。

**返回值**: `Promise<Object>`

```javascript
pdf.getDestinations().then(function(destinations) {
  console.log('目标链接:', destinations);
});
```

### getDestination(id)

根据 ID 获取特定的目标链接。

**参数**:
- `id` (`string`) - 目标链接 ID

**返回值**: `Promise<Array | null>`

```javascript
pdf.getDestination('chapter1').then(function(dest) {
  if (dest) {
    console.log('目标位置:', dest);
  }
});
```

### getPageLabels()

获取页面标签信息。

**返回值**: `Promise<Array<string> | null>`

```javascript
pdf.getPageLabels().then(function(labels) {
  if (labels) {
    console.log('页面标签:', labels);
  }
});
```

### getPageLayout()

获取页面布局信息。

**返回值**: `Promise<string>`

```javascript
pdf.getPageLayout().then(function(layout) {
  console.log('页面布局:', layout);
});
```

### getPageMode()

获取页面显示模式。

**返回值**: `Promise<string>`

```javascript
pdf.getPageMode().then(function(mode) {
  console.log('显示模式:', mode);
});
```

### getViewerPreferences()

获取查看器首选项。

**返回值**: `Promise<Object | null>`

```javascript
pdf.getViewerPreferences().then(function(prefs) {
  if (prefs) {
    console.log('查看器首选项:', prefs);
  }
});
```

### getOpenAction()

获取文档打开时的默认操作。

**返回值**: `Promise<Array | null>`

```javascript
pdf.getOpenAction().then(function(action) {
  if (action) {
    console.log('打开操作:', action);
  }
});
```

### getAttachments()

获取文档附件。

**返回值**: `Promise<Object | null>`

```javascript
pdf.getAttachments().then(function(attachments) {
  if (attachments) {
    Object.keys(attachments).forEach(function(name) {
      console.log('附件:', name, attachments[name]);
    });
  }
});
```

### getJavaScript()

获取文档中的 JavaScript 代码。

**返回值**: `Promise<Array<string> | null>`

```javascript
pdf.getJavaScript().then(function(scripts) {
  if (scripts) {
    console.log('JavaScript 代码:', scripts);
  }
});
```

### getOutline()

获取文档大纲（书签）。

**返回值**: `Promise<Array | null>`

```javascript
pdf.getOutline().then(function(outline) {
  if (outline) {
    console.log('文档大纲:', outline);
    // 遍历大纲项
    outline.forEach(function(item) {
      console.log('标题:', item.title);
      console.log('目标:', item.dest);
      if (item.items) {
        console.log('子项数量:', item.items.length);
      }
    });
  }
});
```

### getOptionalContentConfig()

获取可选内容配置（图层信息）。

**返回值**: `Promise<OptionalContentConfig | null>`

```javascript
pdf.getOptionalContentConfig().then(function(config) {
  if (config) {
    console.log('图层配置:', config);
  }
});
```

### getPermissions()

获取文档权限信息。

**返回值**: `Promise<Array<number> | null>`

```javascript
pdf.getPermissions().then(function(permissions) {
  if (permissions) {
    console.log('文档权限:', permissions);
  }
});
```

### getMetadata()

获取文档元数据。

**返回值**: `Promise<Object>`

```javascript
pdf.getMetadata().then(function(metadata) {
  console.log('文档信息:', metadata.info);
  console.log('元数据:', metadata.metadata);
  console.log('内容长度:', metadata.contentLength);
});
```

### getMarkInfo()

获取文档标记信息。

**返回值**: `Promise<Object | null>`

```javascript
pdf.getMarkInfo().then(function(markInfo) {
  if (markInfo) {
    console.log('标记信息:', markInfo);
  }
});
```

### getData()

获取 PDF 文档的原始二进制数据。

**返回值**: `Promise<Uint8Array>`

```javascript
pdf.getData().then(function(data) {
  console.log('文档大小:', data.length, '字节');
  // 可以用于保存文档
  const blob = new Blob([data], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  // 创建下载链接
});
```

### saveDocument()

保存文档（包含所有修改）。

**返回值**: `Promise<Uint8Array>`

```javascript
pdf.saveDocument().then(function(data) {
  console.log('保存的文档大小:', data.length, '字节');
  // 下载修改后的文档
  const blob = new Blob([data], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'modified.pdf';
  a.click();
});
```

### getDownloadInfo()

获取下载信息。

**返回值**: `Promise<Object>`

```javascript
pdf.getDownloadInfo().then(function(info) {
  console.log('下载信息:', info);
});
```

### getFieldObjects()

获取表单字段对象。

**返回值**: `Promise<Object | null>`

```javascript
pdf.getFieldObjects().then(function(fields) {
  if (fields) {
    Object.keys(fields).forEach(function(name) {
      const field = fields[name];
      console.log('字段名:', name);
      console.log('字段类型:', field.type);
      console.log('字段值:', field.value);
    });
  }
});
```

### hasJSActions()

检查文档是否包含 JavaScript 操作。

**返回值**: `Promise<boolean>`

```javascript
pdf.hasJSActions().then(function(hasJS) {
  if (hasJS) {
    console.log('文档包含 JavaScript 操作');
  }
});
```

### getCalculationOrderIds()

获取计算顺序 ID。

**返回值**: `Promise<Array<string> | null>`

```javascript
pdf.getCalculationOrderIds().then(function(ids) {
  if (ids) {
    console.log('计算顺序:', ids);
  }
});
```

### cleanup(keepLoadedFonts)

清理文档资源。

**参数**:
- `keepLoadedFonts` (`boolean`, 可选) - 是否保留已加载的字体，默认为 `false`

**返回值**: `Promise<void>`

```javascript
// 清理资源但保留字体
pdf.cleanup(true).then(function() {
  console.log('文档资源已清理');
});
```

### destroy()

销毁文档对象，释放所有资源。

**返回值**: `Promise<void>`

```javascript
pdf.destroy().then(function() {
  console.log('文档已销毁');
});
```

## 使用示例

### 基本文档信息获取

```javascript
pdfjsLib.getDocument('document.pdf').promise.then(function(pdf) {
  console.log('页面数量:', pdf.numPages);
  
  // 获取文档元数据
  return pdf.getMetadata();
}).then(function(metadata) {
  const info = metadata.info;
  console.log('标题:', info.Title);
  console.log('作者:', info.Author);
  console.log('创建日期:', info.CreationDate);
  console.log('修改日期:', info.ModDate);
});
```

### 遍历所有页面

```javascript
pdfjsLib.getDocument('document.pdf').promise.then(function(pdf) {
  const promises = [];
  
  for (let i = 1; i <= pdf.numPages; i++) {
    promises.push(pdf.getPage(i));
  }
  
  return Promise.all(promises);
}).then(function(pages) {
  pages.forEach(function(page, index) {
    console.log(`第 ${index + 1} 页尺寸:`, page.view);
  });
});
```

### 处理文档大纲

```javascript
pdfjsLib.getDocument('document.pdf').promise.then(function(pdf) {
  return pdf.getOutline();
}).then(function(outline) {
  if (outline) {
    function processOutline(items, level = 0) {
      items.forEach(function(item) {
        const indent = '  '.repeat(level);
        console.log(indent + item.title);
        
        if (item.items && item.items.length > 0) {
          processOutline(item.items, level + 1);
        }
      });
    }
    
    processOutline(outline);
  } else {
    console.log('文档没有大纲');
  }
});
```

### 检查文档权限

```javascript
pdfjsLib.getDocument('document.pdf').promise.then(function(pdf) {
  return pdf.getPermissions();
}).then(function(permissions) {
  if (permissions) {
    const canPrint = permissions.includes(pdfjsLib.PermissionFlag.PRINT);
    const canCopy = permissions.includes(pdfjsLib.PermissionFlag.COPY);
    const canModify = permissions.includes(pdfjsLib.PermissionFlag.MODIFY_CONTENTS);
    
    console.log('可以打印:', canPrint);
    console.log('可以复制:', canCopy);
    console.log('可以修改:', canModify);
  }
});
```

## 注意事项

1. **内存管理**: 使用完毕后应调用 `destroy()` 方法释放资源
2. **异步操作**: 所有方法都返回 Promise，需要正确处理异步操作
3. **页面编号**: 页面编号从 1 开始，不是从 0 开始
4. **错误处理**: 应该为所有 Promise 添加错误处理

## 相关 API

- [getDocument](/api/get-document) - 加载 PDF 文档
- [PDFPageProxy](/api/pdf-page-proxy) - PDF 页面代理对象
- [常量和枚举](/api/constants) - 相关常量定义