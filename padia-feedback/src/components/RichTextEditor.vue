<template>
  <div class="editor-container">
    <Toolbar
      style="border-bottom: 1px solid #ccc"
      :editor="editorRef"
      :defaultConfig="toolbarConfig"
      :mode="mode"
    />
    <Editor
      style="height: 300px; overflow-y: hidden;"
      v-model="valueHtml"
      :defaultConfig="editorConfig"
      :mode="mode"
      @onCreated="handleCreated"
    />
  </div>
</template>

<script lang="ts">
// 定义组件名称
export default {
  name: 'RichTextEditor'
}
</script>

<script setup lang="ts">
import { ref, shallowRef, onBeforeUnmount, watch } from 'vue'
import '@wangeditor/editor/dist/css/style.css'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'

// 定义组件属性
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '请输入内容...'
  }
})

// 定义组件事件
const emit = defineEmits(['update:modelValue'])

// 编辑器实例，必须用 shallowRef
const editorRef = shallowRef()

// 内容 HTML，绑定编辑器
const valueHtml = ref(props.modelValue)

// 监听值变化
watch(() => props.modelValue, (val) => {
  valueHtml.value = val
})

// 监听内部值变化，触发更新
watch(valueHtml, (val) => {
  emit('update:modelValue', val)
})

// 工具栏配置
const toolbarConfig = {
  excludeKeys: []
}

// 编辑器配置
const editorConfig = {
  placeholder: props.placeholder,
  MENU_CONF: {
    uploadImage: {
      // 上传图片的配置
      server: '/api/upload', // 上传图片地址（请根据后端实际情况修改）
      fieldName: 'file', // 上传图片时的参数名
      maxFileSize: 10 * 1024 * 1024, // 限制图片大小 10M
      maxNumberOfFiles: 10, // 限制一次上传图片的数量
      allowedFileTypes: ['image/*'],
      metaWithUrl: true, // 将图片meta信息发送到服务端
      withCredentials: true, // 跨域时是否携带cookie
      // 自定义上传图片的回调
      customUpload: async (file: File, insertFn: (url: string) => void) => {
        try {
          const formData = new FormData()
          formData.append('file', file)
          
          // 上传到服务器
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          })
          
          const result = await response.json()
          
          if (result.code === 200 && result.data && result.data.url) {
            // 插入图片
            insertFn(result.data.url)
          } else {
            console.error('上传图片失败:', result)
            // 可以使用Element Plus的消息提示组件
            // ElMessage.error('上传图片失败')
          }
        } catch (error) {
          console.error('上传图片错误:', error)
          // ElMessage.error('上传图片发生错误')
        }
      }
    }
  },
  // 配置粘贴处理
  PASTE_MATCH_MEDIA: (mediaInfo: any) => {
    console.log('粘贴媒体:', mediaInfo)
    return true // 始终返回true，允许所有粘贴媒体
  },
  // 配置粘贴中止处理
  PASTE_ABORT_CUSTOM_HANDLERS: (_event: any) => {
    // 是否要终止粘贴处理，false表示不终止
    return false
  },
}

// 编辑器模式
const mode = ref('default')

// 组件销毁时，也销毁编辑器
onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor == null) return
  editor.destroy()
})

// 编辑器创建完成时的回调
const handleCreated = (editor: any) => {
  editorRef.value = editor // 记录 editor 实例
}
</script>

<style scoped>
.editor-container {
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 100%;
  margin-bottom: 20px;
}
</style> 