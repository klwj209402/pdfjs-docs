# 错误处理

本章将详细介绍 PDF.js 中的错误处理机制，帮助您构建更加健壮的 PDF 处理应用。

## 错误类型

PDF.js 定义了多种错误类型，每种错误都有特定的含义和处理方式：

### InvalidPDFException

当 PDF 文件格式无效或损坏时抛出：

```javascript
try {
    const pdfDocument = await pdfjsLib.getDocument('invalid.pdf').promise;
} catch (error) {
    if (error instanceof pdfjsLib.InvalidPDFException) {
        console.error('无效的 PDF 文件:', error.message);
        // 显示用户友好的错误信息
        showErrorMessage('该文件不是有效的 PDF 文档，请检查文件格式。');
    }
}
```

**常见原因：**
- 文件不是 PDF 格式
- PDF 文件已损坏
- 文件头信息错误
- 文件被截断

### MissingPDFException

当 PDF 文件不存在或无法访问时抛出：

```javascript
try {
    const pdfDocument = await pdfjsLib.getDocument('nonexistent.pdf').promise;
} catch (error) {
    if (error instanceof pdfjsLib.MissingPDFException) {
        console.error('PDF 文件不存在:', error.message);
        showErrorMessage('找不到指定的 PDF 文件，请检查文件路径。');
    }
}
```

**常见原因：**
- 文件路径错误
- 文件已被删除
- 权限不足
- 网络连接问题

### UnexpectedResponseException

当网络请求返回意外响应时抛出：

```javascript
try {
    const pdfDocument = await pdfjsLib.getDocument('https://example.com/document.pdf').promise;
} catch (error) {
    if (error instanceof pdfjsLib.UnexpectedResponseException) {
        console.error('网络请求失败:', error.message);
        console.error('状态码:', error.status);
        showErrorMessage('无法下载 PDF 文件，请检查网络连接。');
    }
}
```

**常见原因：**
- HTTP 状态码错误（404、500 等）
- 服务器响应格式错误
- 网络超时
- CORS 策略限制

### PasswordException

当 PDF 文件需要密码时抛出：

```javascript
const loadingTask = pdfjsLib.getDocument('protected.pdf');

// 处理密码请求
loadingTask.onPassword = function(callback, reason) {
    let password;
    
    if (reason === pdfjsLib.PasswordResponses.NEED_PASSWORD) {
        password = prompt('此 PDF 需要密码，请输入:');
    } else if (reason === pdfjsLib.PasswordResponses.INCORRECT_PASSWORD) {
        password = prompt('密码错误，请重新输入:');
    }
    
    if (password) {
        callback(password);
    } else {
        // 用户取消输入
        callback(null);
    }
};

try {
    const pdfDocument = await loadingTask.promise;
} catch (error) {
    if (error.name === 'PasswordException') {
        console.error('密码验证失败');
        showErrorMessage('无法打开受密码保护的 PDF 文件。');
    }
}
```

## 完善的错误处理函数

创建一个通用的错误处理函数：

```javascript
function handlePDFError(error) {
    let errorMessage = '加载 PDF 时发生错误: ';
    let userMessage = '';
    
    if (error instanceof pdfjsLib.InvalidPDFException) {
        errorMessage += '无效的 PDF 文件';
        userMessage = '该文件不是有效的 PDF 文档，请检查文件格式。';
    } else if (error instanceof pdfjsLib.MissingPDFException) {
        errorMessage += 'PDF 文件不存在';
        userMessage = '找不到指定的 PDF 文件，请检查文件路径。';
    } else if (error instanceof pdfjsLib.UnexpectedResponseException) {
        errorMessage += `网络请求失败 (状态码: ${error.status})`;
        userMessage = '无法下载 PDF 文件，请检查网络连接。';
    } else if (error.name === 'PasswordException') {
        errorMessage += '密码验证失败';
        userMessage = '无法打开受密码保护的 PDF 文件。';
    } else if (error.name === 'AbortException') {
        errorMessage += '操作被取消';
        userMessage = 'PDF 加载已取消。';
    } else {
        errorMessage += error.message || '未知错误';
        userMessage = '处理 PDF 文件时发生未知错误，请稍后重试。';
    }
    
    // 记录详细错误信息
    console.error(errorMessage, error);
    
    // 显示用户友好的错误信息
    showErrorMessage(userMessage);
    
    // 可选：发送错误报告
    reportError({
        type: error.constructor.name,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
    });
    
    return { errorMessage, userMessage };
}
```

## 渲染错误处理

处理页面渲染过程中的错误：

```javascript
async function renderPage(page, canvas) {
    try {
        const viewport = page.getViewport({ scale: 1.5 });
        const context = canvas.getContext('2d');
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        
        const renderTask = page.render(renderContext);
        
        // 监听渲染进度
        renderTask.onProgress = function(progress) {
            console.log(`渲染进度: ${progress.loaded}/${progress.total}`);
        };
        
        await renderTask.promise;
        console.log('页面渲染完成');
        
    } catch (error) {
        console.error('页面渲染失败:', error);
        
        if (error.name === 'RenderingCancelledException') {
            console.log('渲染被取消');
        } else {
            // 显示渲染错误
            showRenderError(canvas, '页面渲染失败，请稍后重试。');
        }
    }
}

function showRenderError(canvas, message) {
    const context = canvas.getContext('2d');
    context.fillStyle = '#f8f9fa';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.fillStyle = '#dc3545';
    context.font = '16px Arial';
    context.textAlign = 'center';
    context.fillText(message, canvas.width / 2, canvas.height / 2);
}
```

## 网络错误处理

处理网络相关的错误：

```javascript
function createLoadingTask(url, options = {}) {
    const defaultOptions = {
        // 设置超时时间
        timeout: 30000,
        // 启用范围请求
        disableRange: false,
        // 启用流式加载
        disableStream: false,
        // 重试配置
        maxRetries: 3,
        retryDelay: 1000
    };
    
    const config = { ...defaultOptions, ...options, url };
    const loadingTask = pdfjsLib.getDocument(config);
    
    // 监听加载进度
    loadingTask.onProgress = function(progress) {
        const percent = Math.round((progress.loaded / progress.total) * 100);
        updateProgressBar(percent);
    };
    
    return loadingTask;
}

async function loadPDFWithRetry(url, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`尝试加载 PDF (第 ${attempt} 次)...`);
            const loadingTask = createLoadingTask(url);
            const pdfDocument = await loadingTask.promise;
            console.log('PDF 加载成功');
            return pdfDocument;
            
        } catch (error) {
            lastError = error;
            console.warn(`第 ${attempt} 次加载失败:`, error.message);
            
            if (attempt < maxRetries) {
                // 等待后重试
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
    }
    
    // 所有重试都失败
    throw new Error(`PDF 加载失败，已重试 ${maxRetries} 次。最后错误: ${lastError.message}`);
}
```

## 内存错误处理

处理内存不足的情况：

```javascript
class PDFMemoryManager {
    constructor(maxMemoryMB = 100) {
        this.maxMemory = maxMemoryMB * 1024 * 1024; // 转换为字节
        this.loadedDocuments = new Map();
        this.memoryUsage = 0;
    }
    
    async loadDocument(url) {
        try {
            // 检查内存使用情况
            if (this.memoryUsage > this.maxMemory) {
                await this.cleanup();
            }
            
            const loadingTask = pdfjsLib.getDocument(url);
            const pdfDocument = await loadingTask.promise;
            
            // 估算内存使用
            const estimatedSize = pdfDocument.numPages * 1024 * 1024; // 每页约1MB
            this.memoryUsage += estimatedSize;
            
            this.loadedDocuments.set(url, {
                document: pdfDocument,
                size: estimatedSize,
                lastAccessed: Date.now()
            });
            
            return pdfDocument;
            
        } catch (error) {
            if (error.name === 'OutOfMemoryError' || 
                error.message.includes('memory')) {
                console.warn('内存不足，尝试清理...');
                await this.cleanup();
                // 重试一次
                return this.loadDocument(url);
            }
            throw error;
        }
    }
    
    async cleanup() {
        // 按最后访问时间排序，清理最旧的文档
        const entries = Array.from(this.loadedDocuments.entries())
            .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
        
        for (const [url, info] of entries) {
            if (this.memoryUsage <= this.maxMemory * 0.7) break;
            
            await info.document.destroy();
            this.loadedDocuments.delete(url);
            this.memoryUsage -= info.size;
            console.log(`清理文档: ${url}`);
        }
    }
}
```

## 用户界面错误反馈

创建用户友好的错误界面：

```javascript
class ErrorDisplay {
    constructor(container) {
        this.container = container;
    }
    
    showError(type, message, details = null) {
        const errorDiv = document.createElement('div');
        errorDiv.className = `error-message error-${type}`;
        
        const icon = this.getErrorIcon(type);
        const title = this.getErrorTitle(type);
        
        errorDiv.innerHTML = `
            <div class="error-header">
                <span class="error-icon">${icon}</span>
                <h3 class="error-title">${title}</h3>
            </div>
            <p class="error-message">${message}</p>
            ${details ? `<details class="error-details">
                <summary>技术详情</summary>
                <pre>${details}</pre>
            </details>` : ''}
            <div class="error-actions">
                <button onclick="location.reload()">重新加载</button>
                <button onclick="this.parentElement.parentElement.remove()">关闭</button>
            </div>
        `;
        
        this.container.appendChild(errorDiv);
        
        // 自动隐藏非严重错误
        if (type !== 'critical') {
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.remove();
                }
            }, 10000);
        }
    }
    
    getErrorIcon(type) {
        const icons = {
            'warning': '⚠️',
            'error': '❌',
            'critical': '🚨',
            'network': '🌐',
            'file': '📄'
        };
        return icons[type] || '❓';
    }
    
    getErrorTitle(type) {
        const titles = {
            'warning': '警告',
            'error': '错误',
            'critical': '严重错误',
            'network': '网络错误',
            'file': '文件错误'
        };
        return titles[type] || '未知错误';
    }
}

// 使用示例
const errorDisplay = new ErrorDisplay(document.getElementById('error-container'));

try {
    const pdfDocument = await pdfjsLib.getDocument('document.pdf').promise;
} catch (error) {
    if (error instanceof pdfjsLib.InvalidPDFException) {
        errorDisplay.showError('file', '该文件不是有效的 PDF 文档', error.stack);
    } else if (error instanceof pdfjsLib.UnexpectedResponseException) {
        errorDisplay.showError('network', '无法下载 PDF 文件', `状态码: ${error.status}`);
    } else {
        errorDisplay.showError('critical', '处理 PDF 文件时发生未知错误', error.stack);
    }
}
```

## 错误监控和报告

实现错误监控系统：

```javascript
class PDFErrorReporter {
    constructor(options = {}) {
        this.endpoint = options.endpoint || '/api/errors';
        this.maxReports = options.maxReports || 10;
        this.reportCount = 0;
        this.sessionId = this.generateSessionId();
    }
    
    generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    async reportError(error, context = {}) {
        if (this.reportCount >= this.maxReports) {
            console.warn('错误报告已达到最大限制');
            return;
        }
        
        const report = {
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack
            },
            context: {
                userAgent: navigator.userAgent,
                url: window.location.href,
                ...context
            },
            pdfjs: {
                version: pdfjsLib.version,
                build: pdfjsLib.build
            }
        };
        
        try {
            await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(report)
            });
            
            this.reportCount++;
            console.log('错误报告已发送');
            
        } catch (reportError) {
            console.warn('发送错误报告失败:', reportError);
        }
    }
}

// 全局错误处理
const errorReporter = new PDFErrorReporter({
    endpoint: 'https://api.example.com/pdf-errors'
});

window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.toString().includes('pdf')) {
        errorReporter.reportError(event.reason, {
            type: 'unhandledRejection'
        });
    }
});
```

## 最佳实践

### 1. 分层错误处理

```javascript
// 底层：捕获所有错误
function lowLevelErrorHandler(error) {
    console.error('底层错误:', error);
    errorReporter.reportError(error);
}

// 中层：业务逻辑错误处理
function businessLogicErrorHandler(error, operation) {
    console.warn(`${operation} 操作失败:`, error.message);
    return handlePDFError(error);
}

// 上层：用户界面错误处理
function uiErrorHandler(error, userMessage) {
    errorDisplay.showError('error', userMessage);
}
```

### 2. 错误恢复策略

```javascript
class PDFErrorRecovery {
    static async recoverFromError(error, context) {
        if (error instanceof pdfjsLib.UnexpectedResponseException) {
            // 网络错误：尝试重新加载
            return this.retryWithBackoff(context.loadFunction, 3);
        }
        
        if (error instanceof pdfjsLib.InvalidPDFException) {
            // 文件错误：尝试修复或使用备用文件
            return this.tryAlternativeSource(context.url);
        }
        
        // 其他错误：降级处理
        return this.fallbackMode(context);
    }
    
    static async retryWithBackoff(fn, maxRetries) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await fn();
            } catch (error) {
                if (i === maxRetries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
            }
        }
    }
}
```

### 3. 错误预防

```javascript
// 文件验证
function validatePDFFile(file) {
    if (!file) {
        throw new Error('文件不能为空');
    }
    
    if (file.size > 50 * 1024 * 1024) { // 50MB
        throw new Error('文件大小超过限制');
    }
    
    if (!file.name.toLowerCase().endsWith('.pdf')) {
        throw new Error('文件类型必须是 PDF');
    }
}

// URL 验证
function validatePDFUrl(url) {
    try {
        new URL(url);
    } catch {
        throw new Error('无效的 URL 格式');
    }
    
    if (!url.toLowerCase().includes('.pdf')) {
        console.warn('URL 可能不是 PDF 文件');
    }
}
```

通过实施完善的错误处理机制，您可以构建更加健壮和用户友好的 PDF 处理应用。记住，良好的错误处理不仅能提升用户体验，还能帮助您快速定位和解决问题。