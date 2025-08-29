# 在 Vue 中使用 PDF.js

本指南将详细介绍如何在 Vue 项目中集成和使用 PDF.js 来显示和操作 PDF 文档。

## 安装依赖

在 Vue 项目中使用 PDF.js，首先安装必要的依赖：

```bash
npm install pdfjs-dist
# 或者
yarn add pdfjs-dist
```

## 创建 PDF 查看器组件

创建一个可复用的 PDF 查看器组件：

```vue
<template>
  <div class="pdf-viewer">
    <div class="pdf-controls">
      <button @click="prevPage" :disabled="currentPage <= 1">上一页</button>
      <span>{{ currentPage }} / {{ totalPages }}</span>
      <button @click="nextPage" :disabled="currentPage >= totalPages">下一页</button>
      <select v-model="scale" @change="renderCurrentPage">
        <option value="0.5">50%</option>
        <option value="0.75">75%</option>
        <option value="1">100%</option>
        <option value="1.25">125%</option>
        <option value="1.5">150%</option>
        <option value="2">200%</option>
      </select>
    </div>
    <div class="pdf-container" ref="pdfContainer">
      <canvas ref="pdfCanvas"></canvas>
    </div>
    <div v-if="loading" class="loading">加载中...</div>
    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script>
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry'

// 配置 Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

export default {
  name: 'PDFViewer',
  props: {
    src: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      pdf: null,
      currentPage: 1,
      totalPages: 0,
      scale: 1,
      loading: false,
      error: null
    }
  },
  mounted() {
    this.loadPDF()
  },
  watch: {
    src() {
      this.loadPDF()
    }
  },
  methods: {
    /**
     * 加载 PDF 文档
     */
    async loadPDF() {
      this.loading = true
      this.error = null
      
      try {
        const loadingTask = pdfjsLib.getDocument(this.src)
        
        // 监听加载进度
        loadingTask.onProgress = (progress) => {
          const percent = Math.round((progress.loaded / progress.total) * 100)
          this.$emit('progress', percent)
        }
        
        this.pdf = await loadingTask.promise
        this.totalPages = this.pdf.numPages
        this.currentPage = 1
        
        await this.renderCurrentPage()
        this.$emit('loaded', this.pdf)
      } catch (err) {
        this.error = `加载 PDF 失败: ${err.message}`
        this.$emit('error', err)
      } finally {
        this.loading = false
      }
    },
    
    /**
     * 渲染当前页面
     */
    async renderCurrentPage() {
      if (!this.pdf) return
      
      try {
        const page = await this.pdf.getPage(this.currentPage)
        const viewport = page.getViewport({ scale: this.scale })
        
        const canvas = this.$refs.pdfCanvas
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
        this.$emit('page-rendered', this.currentPage)
      } catch (err) {
        this.error = `渲染页面失败: ${err.message}`
      }
    },
    
    /**
     * 上一页
     */
    async prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--
        await this.renderCurrentPage()
      }
    },
    
    /**
     * 下一页
     */
    async nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++
        await this.renderCurrentPage()
      }
    },
    
    /**
     * 跳转到指定页面
     */
    async goToPage(pageNum) {
      if (pageNum >= 1 && pageNum <= this.totalPages) {
        this.currentPage = pageNum
        await this.renderCurrentPage()
      }
    }
  },
  
  beforeUnmount() {
    // 清理资源
    if (this.pdf) {
      this.pdf.destroy()
    }
  }
}
</script>

<style scoped>
.pdf-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
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
  padding: 5px 10px;
  border: 1px solid #ccc;
  background: white;
  cursor: pointer;
}

.pdf-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pdf-controls select {
  padding: 5px;
  border: 1px solid #ccc;
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
}

.loading, .error {
  text-align: center;
  padding: 20px;
}

.error {
  color: #d32f2f;
  background: #ffebee;
  border: 1px solid #ffcdd2;
  border-radius: 4px;
  margin: 10px;
}
</style>
```

## 在父组件中使用

```vue
<template>
  <div class="app">
    <h1>PDF 查看器示例</h1>
    <PDFViewer 
      :src="pdfUrl" 
      @loaded="onPDFLoaded"
      @progress="onProgress"
      @error="onError"
      @page-rendered="onPageRendered"
    />
  </div>
</template>

<script>
import PDFViewer from './components/PDFViewer.vue'

export default {
  name: 'App',
  components: {
    PDFViewer
  },
  data() {
    return {
      pdfUrl: '/path/to/your/document.pdf'
    }
  },
  methods: {
    /**
     * PDF 加载完成回调
     */
    onPDFLoaded(pdf) {
      console.log('PDF 加载完成，总页数:', pdf.numPages)
    },
    
    /**
     * 加载进度回调
     */
    onProgress(percent) {
      console.log('加载进度:', percent + '%')
    },
    
    /**
     * 错误处理回调
     */
    onError(error) {
      console.error('PDF 加载错误:', error)
    },
    
    /**
     * 页面渲染完成回调
     */
    onPageRendered(pageNum) {
      console.log('页面', pageNum, '渲染完成')
    }
  }
}
</script>
```

## Vue 3 Composition API 版本

如果您使用 Vue 3，可以使用 Composition API：

```vue
<template>
  <div class="pdf-viewer">
    <div class="pdf-controls">
      <button @click="prevPage" :disabled="currentPage <= 1">上一页</button>
      <span>{{ currentPage }} / {{ totalPages }}</span>
      <button @click="nextPage" :disabled="currentPage >= totalPages">下一页</button>
    </div>
    <canvas ref="canvasRef"></canvas>
    <div v-if="loading">加载中...</div>
    <div v-if="error">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry'

// 配置 Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

// Props
const props = defineProps({
  src: {
    type: String,
    required: true
  }
})

// Emits
const emit = defineEmits(['loaded', 'error', 'progress'])

// 响应式数据
const canvasRef = ref(null)
const pdf = ref(null)
const currentPage = ref(1)
const totalPages = ref(0)
const loading = ref(false)
const error = ref(null)

/**
 * 加载 PDF 文档
 */
const loadPDF = async () => {
  loading.value = true
  error.value = null
  
  try {
    const loadingTask = pdfjsLib.getDocument(props.src)
    pdf.value = await loadingTask.promise
    totalPages.value = pdf.value.numPages
    currentPage.value = 1
    
    await renderPage()
    emit('loaded', pdf.value)
  } catch (err) {
    error.value = `加载失败: ${err.message}`
    emit('error', err)
  } finally {
    loading.value = false
  }
}

/**
 * 渲染页面
 */
const renderPage = async () => {
  if (!pdf.value || !canvasRef.value) return
  
  const page = await pdf.value.getPage(currentPage.value)
  const viewport = page.getViewport({ scale: 1.5 })
  
  const canvas = canvasRef.value
  const context = canvas.getContext('2d')
  
  canvas.height = viewport.height
  canvas.width = viewport.width
  
  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise
}

/**
 * 上一页
 */
const prevPage = async () => {
  if (currentPage.value > 1) {
    currentPage.value--
    await renderPage()
  }
}

/**
 * 下一页
 */
const nextPage = async () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    await renderPage()
  }
}

// 监听 src 变化
watch(() => props.src, loadPDF)

// 组件挂载时加载 PDF
onMounted(loadPDF)

// 组件卸载时清理资源
onUnmounted(() => {
  if (pdf.value) {
    pdf.value.destroy()
  }
})
</script>
```

## 最佳实践

### 1. 错误处理

```vue
<script>
export default {
  methods: {
    async loadPDF() {
      try {
        // PDF 加载逻辑
      } catch (err) {
        // 根据错误类型提供不同的处理
        if (err.name === 'PasswordException') {
          this.error = 'PDF 文件需要密码'
          this.$emit('password-required')
        } else if (err.name === 'InvalidPDFException') {
          this.error = 'PDF 文件格式无效'
        } else {
          this.error = `加载失败: ${err.message}`
        }
      }
    }
  }
}
</script>
```

### 2. 性能优化

```vue
<script>
export default {
  methods: {
    /**
     * 延迟加载页面
     */
    async lazyLoadPage(pageNum) {
      // 只渲染可见页面
      if (this.isPageVisible(pageNum)) {
        await this.renderPage(pageNum)
      }
    },
    
    /**
     * 预加载相邻页面
     */
    async preloadAdjacentPages() {
      const promises = []
      if (this.currentPage > 1) {
        promises.push(this.pdf.getPage(this.currentPage - 1))
      }
      if (this.currentPage < this.totalPages) {
        promises.push(this.pdf.getPage(this.currentPage + 1))
      }
      await Promise.all(promises)
    }
  }
}
</script>
```

### 3. 响应式设计

```vue
<script>
export default {
  mounted() {
    // 监听窗口大小变化
    window.addEventListener('resize', this.handleResize)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    /**
     * 处理窗口大小变化
     */
    handleResize() {
      // 重新计算缩放比例
      this.calculateOptimalScale()
      this.renderCurrentPage()
    },
    
    /**
     * 计算最佳缩放比例
     */
    calculateOptimalScale() {
      const container = this.$refs.pdfContainer
      if (container && this.pdf) {
        const containerWidth = container.clientWidth - 40 // 减去 padding
        const page = await this.pdf.getPage(1)
        const viewport = page.getViewport({ scale: 1 })
        this.scale = containerWidth / viewport.width
      }
    }
  }
}
</script>
```

## 常见问题

### Q: 如何处理密码保护的 PDF？

A: 监听 `PasswordException` 并提示用户输入密码：

```vue
<script>
export default {
  methods: {
    async loadPDF(password = null) {
      try {
        const loadingTask = pdfjsLib.getDocument({
          url: this.src,
          password: password
        })
        this.pdf = await loadingTask.promise
      } catch (err) {
        if (err.name === 'PasswordException') {
          const userPassword = prompt('请输入 PDF 密码:')
          if (userPassword) {
            await this.loadPDF(userPassword)
          }
        }
      }
    }
  }
}
</script>
```

### Q: 如何提取 PDF 文本？

A: 使用 `getTextContent()` 方法：

```vue
<script>
export default {
  methods: {
    /**
     * 提取页面文本
     */
    async extractText(pageNum) {
      const page = await this.pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      return textContent.items.map(item => item.str).join(' ')
    }
  }
}
</script>
```

### Q: 如何实现文本搜索？

A: 结合文本提取和高亮显示：

```vue
<script>
export default {
  methods: {
    /**
     * 搜索文本
     */
    async searchText(searchTerm) {
      const results = []
      for (let i = 1; i <= this.totalPages; i++) {
        const text = await this.extractText(i)
        if (text.toLowerCase().includes(searchTerm.toLowerCase())) {
          results.push({ page: i, text })
        }
      }
      return results
    }
  }
}
</script>
```

## 下一步

- [React 集成指南](/guide/react-integration) - 学习在 React 中使用 PDF.js
- [本地开发指南](/guide/local-development) - 了解如何本地运行 PDF.js 源码
- [API 文档](/api/) - 查看完整的 API 参考
- [性能优化](/guide/performance) - 学习性能优化技巧