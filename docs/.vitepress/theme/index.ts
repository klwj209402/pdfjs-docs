import DefaultTheme from 'vitepress/theme'
import ExampleViewer from '../components/ExampleViewer.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // 注册全局组件
    app.component('ExampleViewer', ExampleViewer)
  }
}