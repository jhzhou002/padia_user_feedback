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
  name: 'QiniuEditor'
}
</script>

<script setup lang="ts">
import { ref, shallowRef, onBeforeUnmount, watch } from 'vue'
import '@wangeditor/editor/dist/css/style.css'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { ElMessage } from 'element-plus'

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
  excludeKeys: [] // 保留所有工具栏功能
}

// 编辑器配置
const editorConfig = {
  placeholder: props.placeholder,
  MENU_CONF: {
    uploadImage: {
      // 自定义上传配置
      async customUpload(file: File, insertFn: (url: string) => void) {
        try {
          console.log('开始上传图片:', file.name);
          
          // 1. 获取七牛云上传token
          const tokenRes = await fetch('/qiniu-token');
          if (!tokenRes.ok) {
            throw new Error(`获取上传凭证请求失败: ${tokenRes.status} ${tokenRes.statusText}`);
          }
          
          const tokenData = await tokenRes.json();
          console.log('获取七牛云token响应:', tokenData);
          
          if (!tokenData.data || !tokenData.data.token) {
            throw new Error('获取上传凭证失败: 响应格式错误');
          }
          
          const { token, domain } = tokenData.data;
          
          // 2. 准备上传数据
          const formData = new FormData();
          formData.append('file', file);
          formData.append('token', token);
          const key = `${Date.now()}-${file.name}`; // 生成唯一文件名
          formData.append('key', key);
          
          console.log('准备上传到七牛云:', { token: token.substring(0, 10) + '...', key });
          
          // 3. 上传到七牛云
          const uploadRes = await fetch('https://upload.qiniup.com', {
            method: 'POST',
            body: formData
          });
          
          if (!uploadRes.ok) {
            throw new Error(`上传到七牛云失败: ${uploadRes.status} ${uploadRes.statusText}`);
          }
          
          const result = await uploadRes.json();
          console.log('七牛云上传响应:', result);
          
          if (!result.key) {
            throw new Error('上传失败，未获取到文件地址');
          }
          
          // 4. 拼接完整URL并插入编辑器
          const imageUrl = `${domain}/${result.key}`;
          console.log('图片上传成功，URL:', imageUrl);
          
          insertFn(imageUrl);
          ElMessage.success('图片上传成功');
        } catch (error: any) {
          console.error('上传图片错误:', error);
          ElMessage.error(`上传图片失败: ${error.message || '未知错误'}`);
          
          // 备用方案：转为Base64插入
          try {
            console.log('尝试使用Base64作为备用方案');
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = reader.result as string;
              insertFn(base64);
              ElMessage.warning('图片已以Base64格式插入，刷新页面后可能无法显示');
            };
            reader.readAsDataURL(file);
          } catch (e) {
            console.error('Base64转换失败:', e);
          }
        }
      }
    }
  }
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
  
  // 支持粘贴图片
  editor.on('paste:each', (event: any) => {
    if (event instanceof File && event.type.indexOf('image') !== -1) {
      console.log('粘贴图片:', event)
    }
  })
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