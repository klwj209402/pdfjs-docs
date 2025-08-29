# 在 React 中使用 PDF.js

本指南将详细介绍如何在 React 项目中集成和使用 PDF.js 来显示和操作 PDF 文档。

## 安装依赖

```bash
npm install pdfjs-dist
# 或者
yarn add pdfjs-dist
```

## 创建 PDF 查看器组件

```jsx
import React, { useState, useEffect, useRef, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry'

// 配置 Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

/**
 * PDF 查看器组件
 */
const PDFViewer = ({ src, onLoaded, onError, onProgress }) => {
  const canvasRef = useRef(null)
  const [pdf, setPdf] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * 加载 PDF 文档
   */
  const loadPDF = useCallback(async () => {
    if (!src) return
    
    setLoading(true)
    setError(null)
    
    try {
      const loadingTask = pdfjsLib.getDocument(src)
      
      // 监听加载进度
      if (onProgress) {
        loadingTask.onProgress = (progress) => {
          const percent = Math.round((progress.loaded / progress.total) * 100)
          onProgress(percent)
        }
      }
      
      const pdfDoc = await loadingTask.promise
      setPdf(pdfDoc)
      setTotalPages(pdfDoc.numPages)
      setCurrentPage(1)
      
      if (onLoaded) {
        onLoaded(pdfDoc)
      }
    } catch (err) {
      const errorMsg = `加载 PDF 失败: ${err.message}`
      setError(errorMsg)
      if (onError) {
        onError(err)
      }
    } finally {
      setLoading(false)
    }
  }, [src, onLoaded, onError, onProgress])

  /**
   * 渲染当前页面
   */
  const renderPage = useCallback(async () => {
    if (!pdf || !canvasRef.current) return
    
    try {
      const page = await pdf.getPage(currentPage)
      const viewport = page.getViewport({ scale })
      
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      // 设置 Canvas 尺寸
      canvas.height = viewport.height
      canvas.width = viewport.width
      
      // 处理高 DPI 屏幕
      const outputScale = window.devicePixelRatio || 1
      if (outputScale !== 1) {
        canvas.width *= outputScale
        canvas.height *= outputScale
        canvas.style.width = viewport.width + 'px'
        canvas.style.height = viewport.height + 'px'
        context.scale(outputScale, outputScale)
      }
      
      // 渲染页面
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      }
      
      await page.render(renderContext).promise
    } catch (err) {
      setError(`渲染页面失败: ${err.message}`)
    }
  }, [pdf, currentPage, scale])

  /**
   * 上一页
   */
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  /**
   * 下一页
   */
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  /**
   * 跳转到指定页面
   */
  const goToPage = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum)
    }
  }

  // 加载 PDF
  useEffect(() => {
    loadPDF()
  }, [loadPDF])

  // 渲染页面
  useEffect(() => {
    renderPage()
  }, [renderPage])

  // 清理资源
  useEffect(() => {
    return () => {
      if (pdf) {
        pdf.destroy()
      }
    }
  }, [pdf])

  return (
    <div className="pdf-viewer">
      <div className="pdf-controls">
        <button onClick={prevPage} disabled={currentPage <= 1}>
          上一页
        </button>
        <span>{currentPage} / {totalPages}</span>
        <button onClick={nextPage} disabled={currentPage >= totalPages}>
          下一页
        </button>
        <select 
          value={scale} 
          onChange={(e) => setScale(parseFloat(e.target.value))}
        >
          <option value={0.5}>50%</option>
          <option value={0.75}>75%</option>
          <option value={1}>100%</option>
          <option value={1.25}>125%</option>
          <option value={1.5}>150%</option>
          <option value={2}>200%</option>
        </select>
      </div>
      
      <div className="pdf-container">
        <canvas ref={canvasRef} />
      </div>
      
      {loading && <div className="loading">加载中...</div>}
      {error && <div className="error">{error}</div>}
    </div>
  )
}

export default PDFViewer
```

## CSS 样式

```css
.pdf-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.pdf-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.pdf-controls button {
  padding: 8px 16px;
  border: 1px solid #ccc;
  background: white;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
}

.pdf-controls button:hover:not(:disabled) {
  background: #e9e9e9;
}

.pdf-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pdf-controls select {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.pdf-container {
  flex: 1;
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 20px;
  background: #f9f9f9;
}

.pdf-container canvas {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  background: white;
  border-radius: 4px;
}

.loading, .error {
  text-align: center;
  padding: 20px;
  font-size: 16px;
}

.error {
  color: #d32f2f;
  background: #ffebee;
  border: 1px solid #ffcdd2;
  border-radius: 4px;
  margin: 10px;
}

.loading {
  color: #1976d2;
}
```

## 在应用中使用

```jsx
import React from 'react'
import PDFViewer from './components/PDFViewer'
import './App.css'

/**
 * 主应用组件
 */
function App() {
  /**
   * PDF 加载完成处理
   */
  const handlePDFLoaded = (pdf) => {
    console.log('PDF 加载完成，总页数:', pdf.numPages)
  }

  /**
   * 加载进度处理
   */
  const handleProgress = (percent) => {
    console.log('加载进度:', percent + '%')
  }

  /**
   * 错误处理
   */
  const handleError = (error) => {
    console.error('PDF 加载错误:', error)
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>PDF 查看器示例</h1>
      </header>
      <main className="App-main">
        <PDFViewer 
          src="/path/to/your/document.pdf"
          onLoaded={handlePDFLoaded}
          onProgress={handleProgress}
          onError={handleError}
        />
      </main>
    </div>
  )
}

export default App
```

## 使用 React Hooks 的简化版本

```jsx
import React, { useState, useEffect, useRef } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry'

// 配置 Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

/**
 * 简化的 PDF 查看器 Hook
 */
const usePDFViewer = (src) => {
  const canvasRef = useRef(null)
  const [pdf, setPdf] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadPDF = async () => {
      if (!src) return
      
      setLoading(true)
      setError(null)
      
      try {
        const pdfDoc = await pdfjsLib.getDocument(src).promise
        setPdf(pdfDoc)
        setTotalPages(pdfDoc.numPages)
        setCurrentPage(1)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadPDF()
  }, [src])

  useEffect(() => {
    const renderPage = async () => {
      if (!pdf || !canvasRef.current) return
      
      const page = await pdf.getPage(currentPage)
      const viewport = page.getViewport({ scale: 1.5 })
      
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      canvas.height = viewport.height
      canvas.width = viewport.width
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise
    }

    renderPage()
  }, [pdf, currentPage])

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  return {
    canvasRef,
    currentPage,
    totalPages,
    loading,
    error,
    nextPage,
    prevPage
  }
}

/**
 * 使用 Hook 的组件
 */
const SimplePDFViewer = ({ src }) => {
  const {
    canvasRef,
    currentPage,
    totalPages,
    loading,
    error,
    nextPage,
    prevPage
  } = usePDFViewer(src)

  if (loading) return <div>加载中...</div>
  if (error) return <div>错误: {error}</div>

  return (
    <div>
      <div>
        <button onClick={prevPage} disabled={currentPage <= 1}>
          上一页
        </button>
        <span>{currentPage} / {totalPages}</span>
        <button onClick={nextPage} disabled={currentPage >= totalPages}>
          下一页
        </button>
      </div>
      <canvas ref={canvasRef} style={{ border: '1px solid #ccc' }} />
    </div>
  )
}

export default SimplePDFViewer
```

## 高级功能

### 1. 文本提取和搜索

```jsx
import React, { useState, useCallback } from 'react'

/**
 * 带搜索功能的 PDF 查看器
 */
const SearchablePDFViewer = ({ src }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [pdf, setPdf] = useState(null)

  /**
   * 提取页面文本
   */
  const extractPageText = useCallback(async (pageNum) => {
    if (!pdf) return ''
    
    const page = await pdf.getPage(pageNum)
    const textContent = await page.getTextContent()
    return textContent.items.map(item => item.str).join(' ')
  }, [pdf])

  /**
   * 搜索文本
   */
  const searchText = useCallback(async () => {
    if (!pdf || !searchTerm.trim()) {
      setSearchResults([])
      return
    }

    const results = []
    const term = searchTerm.toLowerCase()

    for (let i = 1; i <= pdf.numPages; i++) {
      const text = await extractPageText(i)
      if (text.toLowerCase().includes(term)) {
        // 找到匹配的上下文
        const index = text.toLowerCase().indexOf(term)
        const start = Math.max(0, index - 50)
        const end = Math.min(text.length, index + term.length + 50)
        const context = text.substring(start, end)
        
        results.push({
          page: i,
          context: context,
          position: index
        })
      }
    }

    setSearchResults(results)
  }, [pdf, searchTerm, extractPageText])

  return (
    <div className="searchable-pdf-viewer">
      <div className="search-controls">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="搜索文本..."
          onKeyPress={(e) => e.key === 'Enter' && searchText()}
        />
        <button onClick={searchText}>搜索</button>
      </div>
      
      {searchResults.length > 0 && (
        <div className="search-results">
          <h3>搜索结果 ({searchResults.length})</h3>
          {searchResults.map((result, index) => (
            <div key={index} className="search-result">
              <strong>第 {result.page} 页:</strong>
              <p>{result.context}</p>
            </div>
          ))}
        </div>
      )}
      
      {/* PDF 查看器组件 */}
      <PDFViewer src={src} onLoaded={setPdf} />
    </div>
  )
}
```

### 2. 缩略图导航

```jsx
import React, { useState, useEffect, useCallback } from 'react'

/**
 * 带缩略图的 PDF 查看器
 */
const ThumbnailPDFViewer = ({ src }) => {
  const [pdf, setPdf] = useState(null)
  const [thumbnails, setThumbnails] = useState([])
  const [currentPage, setCurrentPage] = useState(1)

  /**
   * 生成缩略图
   */
  const generateThumbnails = useCallback(async () => {
    if (!pdf) return

    const thumbs = []
    const scale = 0.2 // 缩略图缩放比例

    for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) { // 限制前10页
      const page = await pdf.getPage(i)
      const viewport = page.getViewport({ scale })
      
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      
      canvas.height = viewport.height
      canvas.width = viewport.width
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise
      
      thumbs.push({
        pageNum: i,
        dataUrl: canvas.toDataURL()
      })
    }

    setThumbnails(thumbs)
  }, [pdf])

  useEffect(() => {
    generateThumbnails()
  }, [generateThumbnails])

  return (
    <div className="thumbnail-pdf-viewer">
      <div className="thumbnail-sidebar">
        <h3>页面导航</h3>
        <div className="thumbnails">
          {thumbnails.map((thumb) => (
            <div
              key={thumb.pageNum}
              className={`thumbnail ${currentPage === thumb.pageNum ? 'active' : ''}`}
              onClick={() => setCurrentPage(thumb.pageNum)}
            >
              <img src={thumb.dataUrl} alt={`第 ${thumb.pageNum} 页`} />
              <span>第 {thumb.pageNum} 页</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="main-viewer">
        <PDFViewer 
          src={src} 
          onLoaded={setPdf}
          initialPage={currentPage}
        />
      </div>
    </div>
  )
}
```

### 3. 注释和标记

```jsx
import React, { useState, useRef, useCallback } from 'react'

/**
 * 带注释功能的 PDF 查看器
 */
const AnnotatablePDFViewer = ({ src }) => {
  const overlayRef = useRef(null)
  const [annotations, setAnnotations] = useState([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentTool, setCurrentTool] = useState('highlight')

  /**
   * 开始绘制注释
   */
  const startDrawing = useCallback((e) => {
    if (currentTool === 'highlight') {
      setIsDrawing(true)
      const rect = overlayRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      const newAnnotation = {
        id: Date.now(),
        type: currentTool,
        startX: x,
        startY: y,
        endX: x,
        endY: y
      }
      
      setAnnotations(prev => [...prev, newAnnotation])
    }
  }, [currentTool])

  /**
   * 绘制注释
   */
  const drawAnnotation = useCallback((e) => {
    if (!isDrawing) return
    
    const rect = overlayRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    setAnnotations(prev => {
      const updated = [...prev]
      const lastAnnotation = updated[updated.length - 1]
      if (lastAnnotation) {
        lastAnnotation.endX = x
        lastAnnotation.endY = y
      }
      return updated
    })
  }, [isDrawing])

  /**
   * 结束绘制
   */
  const stopDrawing = useCallback(() => {
    setIsDrawing(false)
  }, [])

  return (
    <div className="annotatable-pdf-viewer">
      <div className="annotation-tools">
        <button 
          className={currentTool === 'highlight' ? 'active' : ''}
          onClick={() => setCurrentTool('highlight')}
        >
          高亮
        </button>
        <button 
          className={currentTool === 'note' ? 'active' : ''}
          onClick={() => setCurrentTool('note')}
        >
          注释
        </button>
        <button onClick={() => setAnnotations([])}>
          清除所有
        </button>
      </div>
      
      <div className="pdf-with-overlay">
        <PDFViewer src={src} />
        <div 
          ref={overlayRef}
          className="annotation-overlay"
          onMouseDown={startDrawing}
          onMouseMove={drawAnnotation}
          onMouseUp={stopDrawing}
        >
          {annotations.map(annotation => (
            <div
              key={annotation.id}
              className={`annotation ${annotation.type}`}
              style={{
                left: Math.min(annotation.startX, annotation.endX),
                top: Math.min(annotation.startY, annotation.endY),
                width: Math.abs(annotation.endX - annotation.startX),
                height: Math.abs(annotation.endY - annotation.startY)
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
```

## 性能优化

### 1. 虚拟滚动

```jsx
import React, { useState, useEffect, useMemo } from 'react'
import { FixedSizeList as List } from 'react-window'

/**
 * 虚拟滚动 PDF 查看器
 */
const VirtualizedPDFViewer = ({ src }) => {
  const [pdf, setPdf] = useState(null)
  const [pageHeight, setPageHeight] = useState(800)

  /**
   * 页面渲染组件
   */
  const PageRenderer = ({ index, style }) => {
    const pageNum = index + 1
    
    return (
      <div style={style}>
        <PDFPage 
          pdf={pdf} 
          pageNum={pageNum} 
          onHeightChange={setPageHeight}
        />
      </div>
    )
  }

  const totalPages = pdf ? pdf.numPages : 0

  return (
    <div className="virtualized-pdf-viewer">
      {pdf && (
        <List
          height={600}
          itemCount={totalPages}
          itemSize={pageHeight}
          itemData={{ pdf }}
        >
          {PageRenderer}
        </List>
      )}
    </div>
  )
}
```

### 2. 懒加载

```jsx
import React, { useState, useEffect, useRef } from 'react'

/**
 * 懒加载 PDF 页面组件
 */
const LazyPDFPage = ({ pdf, pageNum, scale = 1 }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const containerRef = useRef(null)
  const canvasRef = useRef(null)

  // 使用 Intersection Observer 检测可见性
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [])

  // 当页面可见时加载
  useEffect(() => {
    if (isVisible && !isLoaded && pdf) {
      renderPage()
    }
  }, [isVisible, isLoaded, pdf])

  /**
   * 渲染页面
   */
  const renderPage = async () => {
    try {
      const page = await pdf.getPage(pageNum)
      const viewport = page.getViewport({ scale })
      
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      canvas.height = viewport.height
      canvas.width = viewport.width
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise
      
      setIsLoaded(true)
    } catch (error) {
      console.error(`渲染第 ${pageNum} 页失败:`, error)
    }
  }

  return (
    <div ref={containerRef} className="lazy-pdf-page">
      {isVisible ? (
        <canvas ref={canvasRef} />
      ) : (
        <div className="page-placeholder">
          第 {pageNum} 页 - 加载中...
        </div>
      )}
    </div>
  )
}
```

## 常见问题

### Q: 如何处理密码保护的 PDF？

A: 监听 `PasswordException` 并提示用户输入密码：

```jsx
const loadPDF = async (password = null) => {
  try {
    const loadingTask = pdfjsLib.getDocument({
      url: src,
      password: password
    })
    const pdfDoc = await loadingTask.promise
    setPdf(pdfDoc)
  } catch (err) {
    if (err.name === 'PasswordException') {
      const userPassword = prompt('请输入 PDF 密码:')
      if (userPassword) {
        await loadPDF(userPassword)
      }
    } else {
      setError(err.message)
    }
  }
}
```

### Q: 如何优化大文件的加载性能？

A: 使用流式加载和分页渲染：

```jsx
const loadPDFStream = async () => {
  const loadingTask = pdfjsLib.getDocument({
    url: src,
    rangeChunkSize: 65536, // 64KB chunks
    disableAutoFetch: true, // 禁用自动获取
    disableStream: false    // 启用流式加载
  })
  
  const pdf = await loadingTask.promise
  setPdf(pdf)
}
```

### Q: 如何实现打印功能？

A: 创建打印专用的页面：

```jsx
const printPDF = async () => {
  const printWindow = window.open('', '_blank')
  const printDoc = printWindow.document
  
  printDoc.write('<html><head><title>打印 PDF</title></head><body>')
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 1.5 })
    
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    
    canvas.height = viewport.height
    canvas.width = viewport.width
    
    await page.render({ canvasContext: context, viewport }).promise
    
    printDoc.write(`<img src="${canvas.toDataURL()}" style="page-break-after: always;" />`)
  }
  
  printDoc.write('</body></html>')
  printDoc.close()
  
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 1000)
}
```

## 下一步

- [Vue 集成指南](/guide/vue-integration) - 学习在 Vue 中使用 PDF.js
- [本地开发指南](/guide/local-development) - 了解如何本地运行 PDF.js 源码
- [API 文档](/api/) - 查看完整的 API 参考
- [性能优化](/guide/performance) - 学习性能优化技巧