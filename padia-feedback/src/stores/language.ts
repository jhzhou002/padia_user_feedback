import { defineStore } from 'pinia'
import { ref } from 'vue'

// 支持的语言类型
export type LanguageType = 'zh-CN' | 'en-US'

// 语言状态存储
export const useLanguageStore = defineStore('language', () => {
  // 获取localStorage中保存的语言，默认为中文
  const storedLanguage = localStorage.getItem('language') as LanguageType
  const language = ref<LanguageType>(storedLanguage || 'zh-CN')

  // 切换语言
  const changeLanguage = (lang: LanguageType) => {
    language.value = lang
    localStorage.setItem('language', lang)
  }

  return {
    language,
    changeLanguage
  }
}) 