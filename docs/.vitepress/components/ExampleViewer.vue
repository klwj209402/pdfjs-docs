<template>
  <div class="example-viewer">
    <div class="example-header">
      <h3>{{ title }}</h3>
      <div class="example-actions">
        <button @click="toggleCode" class="btn-toggle">
          {{ showCode ? '隐藏代码' : '查看代码' }}
        </button>
        <a :href="previewUrl" target="_blank" class="btn-preview">
          在新窗口预览
        </a>
      </div>
    </div>
    
    <div class="example-content">
      <!-- 预览区域 -->
      <div class="preview-container" v-show="!showCode">
        <iframe 
          :src="previewUrl" 
          class="preview-frame"
          frameborder="0"
          @load="onFrameLoad"
        ></iframe>
        <div v-if="loading" class="loading-overlay">
          <div class="loading-spinner"></div>
          <p>加载示例中...</p>
        </div>
      </div>
      
      <!-- 代码区域 -->
      <div class="code-container" v-show="showCode">
        <div class="code-header">
          <span class="file-name">{{ fileName }}</span>
          <button @click="copyCode" class="btn-copy">
            {{ copied ? '已复制' : '复制代码' }}
          </button>
        </div>
        <pre class="code-block"><code v-html="highlightedCode"></code></pre>
      </div>
    </div>
    
    <div class="example-description" v-if="description">
      <h4>功能说明</h4>
      <div v-html="description"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  previewUrl: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  }
})

const showCode = ref(false)
const loading = ref(true)
const copied = ref(false)
const codeContent = ref('')

// 切换代码显示
function toggleCode() {
  showCode.value = !showCode.value
  if (showCode.value && !codeContent.value) {
    loadCode()
  }
}

// 加载代码内容
async function loadCode() {
  try {
    const response = await fetch(props.previewUrl)
    codeContent.value = await response.text()
  } catch (error) {
    console.error('Failed to load code:', error)
    codeContent.value = '// 代码加载失败'
  }
}

// 复制代码
async function copyCode() {
  try {
    await navigator.clipboard.writeText(codeContent.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    console.error('Failed to copy code:', error)
  }
}

// 简单的HTML语法高亮
const highlightedCode = computed(() => {
  if (!codeContent.value) return ''
  
  return codeContent.value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/(&lt;\/?[a-zA-Z][^&]*&gt;)/g, '<span class="tag">$1</span>')
    .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="comment">$1</span>')
    .replace(/("[^"]*")/g, '<span class="string">$1</span>')
    .replace(/\b(function|var|let|const|if|else|for|while|return|class|extends)\b/g, '<span class="keyword">$1</span>')
})

// 框架加载完成
function onFrameLoad() {
  loading.value = false
}

onMounted(() => {
  // 预加载代码
  loadCode()
})
</script>

<style scoped>
.example-viewer {
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  overflow: hidden;
  margin: 16px 0;
}

.example-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-border);
}

.example-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.example-actions {
  display: flex;
  gap: 8px;
}

.btn-toggle,
.btn-copy {
  padding: 4px 12px;
  font-size: 12px;
  border: 1px solid var(--vp-c-border);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-toggle:hover,
.btn-copy:hover {
  background: var(--vp-c-bg-soft);
}

.btn-preview {
  padding: 4px 12px;
  font-size: 12px;
  border: 1px solid var(--vp-c-brand);
  border-radius: 4px;
  background: var(--vp-c-brand);
  color: white;
  text-decoration: none;
  transition: all 0.2s;
}

.btn-preview:hover {
  background: var(--vp-c-brand-dark);
}

.example-content {
  position: relative;
}

.preview-container {
  position: relative;
  height: 500px;
}

.preview-frame {
  width: 100%;
  height: 100%;
  border: none;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--vp-c-bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--vp-c-border);
  border-top: 3px solid var(--vp-c-brand);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.code-container {
  background: var(--vp-code-bg);
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-border);
}

.file-name {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: var(--vp-c-text-2);
}

.code-block {
  margin: 0;
  padding: 16px;
  overflow-x: auto;
  font-family: var(--vp-font-family-mono);
  font-size: 14px;
  line-height: 1.5;
  background: transparent;
}

.code-block code {
  color: var(--vp-c-text-1);
}

/* 语法高亮样式 */
.code-block :deep(.tag) {
  color: #e06c75;
}

.code-block :deep(.comment) {
  color: #5c6370;
  font-style: italic;
}

.code-block :deep(.string) {
  color: #98c379;
}

.code-block :deep(.keyword) {
  color: #c678dd;
  font-weight: bold;
}

.example-description {
  padding: 16px;
  background: var(--vp-c-bg-soft);
  border-top: 1px solid var(--vp-c-border);
}

.example-description h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
}

.example-description :deep(ul) {
  margin: 8px 0;
  padding-left: 20px;
}

.example-description :deep(li) {
  margin: 4px 0;
  font-size: 14px;
  color: var(--vp-c-text-2);
}
</style>