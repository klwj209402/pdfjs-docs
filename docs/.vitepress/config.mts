import { defineConfig } from 'vitepress'
// @ts-ignore
import { resolve } from 'path'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "PDF.js 中文文档",
  description: "PDF.js JavaScript PDF 处理库的完整中文API文档",
  head: [
    ['link', { rel: 'icon', href: '/favicon.svg' }]
  ],
  base: '/pdfjs-docs/',
  lang: 'zh-CN',
  ignoreDeadLinks: true,
  
  vite: {
      resolve: {
        alias: {
          // @ts-ignore
          '@': resolve(__dirname, '../')
        }
      }
    },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '/logo.svg',
    nav: [
      { text: '首页', link: '/' },
      { text: '入门指南', link: '/guide/getting-started.html' },
      { text: 'API文档', link: '/api/' },
      { text: 'PDF原理', link: '/principles/' },
      { text: '代码示例', link: '/examples/basic-rendering' }
    ],

    sidebar: {
      '/': [
        {
          text: '入门指南',
          collapsed: false,
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: 'Vue 集成', link: '/guide/vue-integration' },
            { text: 'React 集成', link: '/guide/react-integration' },
            { text: '本地开发', link: '/guide/local-development' },
            { text: '基本概念', link: '/guide/concepts' },
            { text: '配置选项', link: '/guide/configuration' }
          ]
        },
        {
          text: '进阶指南',
          items: [
            { text: '性能优化', link: '/guide/performance' },
            { text: '错误处理', link: '/guide/error-handling' },
            { text: '最佳实践', link: '/guide/best-practices' }
          ]
        }
      ],
      '/api/': [
        {
          text: '核心API',
          items: [
            { text: '核心 API 说明', link: '/api/core-api' },
            { text: 'getDocument', link: '/api/get-document' },
            { text: 'PDFDocumentProxy', link: '/api/pdf-document-proxy' },
            { text: 'PDFPageProxy', link: '/api/pdf-page-proxy' },
            { text: 'GlobalWorkerOptions', link: '/api/global-worker-options' }
          ]
        },
        {
          text: '显示层组件',
          items: [
            { text: 'AnnotationLayer', link: '/api/annotation-layer' },
            { text: 'TextLayer', link: '/api/text-layer' },
            { text: 'XfaLayer', link: '/api/xfa-layer' },
            { text: 'DrawLayer', link: '/api/draw-layer' }
          ]
        },
        {
          text: '编辑器组件',
          items: [
            { text: 'AnnotationEditorLayer', link: '/api/annotation-editor-layer' },
            { text: 'AnnotationEditorUIManager', link: '/api/annotation-editor-ui-manager' },
            { text: 'ColorPicker', link: '/api/color-picker' }
          ]
        },
        {
          text: '工具类',
          items: [
            { text: 'PDFWorker', link: '/api/pdf-worker' },
            { text: 'PDFDataRangeTransport', link: '/api/pdf-data-range-transport' },
            { text: 'Util', link: '/api/util' },
            { text: '常量和枚举', link: '/api/constants' }
          ]
        }
      ],
      '/examples/': [
        {
          text: '基础示例',
          items: [
            { text: '基础渲染', link: '/examples/basic-rendering' },
            { text: '多页面处理', link: '/examples/multi-page' },
            { text: '文本提取', link: '/examples/text-extraction' },
            { text: 'PDF.js组件', link: '/examples/components' },
            { text: 'Node.js环境', link: '/examples/nodejs' },
            { text: '移动端查看器', link: '/examples/mobile-viewer' },
            { text: 'Webpack集成', link: '/examples/webpack' }
          ]
        },
        {
          text: '高级示例',
          items: [
            { text: '注释处理', link: '/examples/annotations' },
            { text: '表单填写', link: '/examples/forms' },
            { text: '高级功能', link: '/examples/advanced-features' }
          ]
        }
      ],
      '/principles/': [
        {
          text: '基础结构',
          items: [
            { text: '概述', link: '/principles/' },
            { text: 'PDF文件结构', link: '/principles/file-structure' },
            { text: 'PDF对象系统', link: '/principles/object-system' },
            { text: '交叉引用表', link: '/principles/xref-table' }
          ]
        },
        {
          text: '内容组织',
          items: [
            { text: '页面结构', link: '/principles/page-structure' },
            { text: '内容流', link: '/principles/content-streams' },
            { text: '资源字典', link: '/principles/resources' }
          ]
        },
        {
          text: '高级特性',
          items: [
            { text: '注释系统', link: '/principles/annotations' },
            { text: '表单字段', link: '/principles/form-fields' },
            { text: '安全机制', link: '/principles/security' }
          ]
        }
      ],
      '/guide/': [
        {
          text: '入门指南',
          items: [
            { text: '基本概念', link: '/guide/concepts' },
            { text: '安装配置', link: '/guide/installation' },
            { text: '快速开始', link: '/guide/getting-started' },
            { text: 'Vue 集成', link: '/guide/vue-integration' },
            { text: 'React 集成', link: '/guide/react-integration' },
            { text: '本地开发', link: '/guide/local-development' },
          ]
        },
        {
          text: '进阶指南',
          items: [
            { text: '错误处理', link: '/guide/error-handling' },
            { text: '性能优化', link: '/guide/performance' },
            { text: '常见问题', link: '/guide/faq' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/mozilla/pdf.js' }
    ],

    footer: {
      message: '基于 Mozilla PDF.js 项目的中文文档',
      copyright: 'Copyright © 2025 PDF.js 中文文档'
    },

    search: {
      provider: 'local'
    }
  }
})
