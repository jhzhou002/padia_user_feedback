import { createI18n } from 'vue-i18n'
import { useLanguageStore } from '../stores/language'

// 中文语言包
const zhCN = {
  common: {
    platformName: 'PADIA用户反馈平台',
    developerPlatformName: 'PADIA开发者反馈平台',
    copyright: '© 2024 PADIA User Feedback Platform. All rights reserved.',
    profile: '个人中心',
    logout: '退出登录',
    language: '简体中文',
    switchLanguage: '切换语言',
    languageChanged: '语言已切换',
    comingSoon: '功能即将上线',
    reset: '重置',
    search: '搜索',
    process: '处理',
    view: '查看',
    edit: '编辑',
    delete: '删除',
    cancel: '取消',
    confirm: '确认',
    back: '返回',
    save: '保存',
    loading: '加载中',
    empty: '暂无数据'
  },
  nav: {
    submitIssue: '提交问题',
    issueList: '问题列表',
    hotIssues: '热门问题',
    taskList: '任务列表',
    statistics: '数据统计'
  },
  form: {
    module: '所属模块',
    selectModule: '请选择所属模块',
    issueDescription: '问题描述',
    detailDescription: '请详细描述您遇到的问题...',
    isPublic: '在处理完成后公开此问题',
    submit: '提交',
    autoTitle: '智能标题',
    title: '标题',
    titlePlaceholder: '请输入问题标题',
    generatedTitle: '自动生成标题'
  },
  task: {
    title: '任务列表',
    allTasks: '全部任务',
    pending: '待处理',
    processing: '处理中',
    resolved: '已处理',
    closed: '已关闭',
    searchPlaceholder: '搜索任务',
    emptyTaskPrefix: '暂无',
    emptyTaskSuffix: '任务',
    assignTime: '分配时间',
    priority: {
      high: '高',
      medium: '中',
      low: '低'
    },
    noData: '暂无数据'
  },
  statistics: {
    title: '数据统计',
    overview: '工作概况',
    totalIssues: '总问题数',
    pendingIssues: '待处理',
    processingIssues: '处理中',
    resolvedIssues: '已解决',
    userSatisfaction: '用户满意度',
    star: '星',
    ratings: '共 {count} 条评价',
    efficiency: '效率指标',
    avgResponseTime: '平均响应时间',
    avgResolveTime: '平均解决时间',
    completionRate: '问题完成率',
    hour: '小时',
    responseTimeDesc: '从问题提交到首次查看的平均时间',
    resolveTimeDesc: '从问题提交到完全解决的平均时间',
    completionDesc: '已解决 {resolved} / 总数 {total}',
    noStatisticsData: '暂无统计数据',
    noStatisticsDesc1: '您目前暂无任务数据或评价数据',
    noStatisticsDesc2: '处理更多问题后可查看详细统计'
  },
  issue: {
    title: '问题列表',
    hotIssues: '热门问题',
    myIssues: '我的问题',
    allIssues: '全部问题',
    searchPlaceholder: '搜索问题',
    emptyIssuePrefix: '暂无',
    emptyIssueSuffix: '问题',
    status: {
      all: '全部',
      pending: '待处理',
      processing: '处理中',
      resolved: '已解决',
      closed: '已关闭'
    },
    detail: {
      title: '问题详情',
      createTime: '创建时间',
      updateTime: '更新时间',
      status: '状态',
      module: '所属模块',
      description: '问题描述',
      comments: '评论区',
      commentPlaceholder: '请输入您的评论',
      submitComment: '提交评论',
      deleteConfirm: '确定要删除这个问题吗？删除后无法恢复。',
      submitter: '提交者',
      unknownUser: '未知用户',
      unspecified: '未指定',
      unknownTime: '未知时间',
      taskStatus: '任务状态',
      currentStatus: '当前状态',
      priority: '优先级',
      assignee: '负责人',
      unassigned: '未分配',
      startProcessing: '开始处理',
      markAsResolved: '标记为已解决',
      reopen: '重新打开',
      closeTask: '关闭任务',
      remark: '备注',
      admin: '管理员',
      developer: '开发者',
      user: '用户',
      noComments: '暂无评论，来添加第一条评论吧',
      addComment: '添加评论',
      commentRequired: '请输入评论内容',
      public: '公开',
      private: '私有',
      commentSuccess: '评论添加成功',
      commentError: '添加评论失败',
      commentsError: '获取评论列表失败',
      statusUpdateSuccess: '问题状态已更新为: {status}',
      statusUpdateError: '更新问题状态失败',
      deleteSuccess: '问题已成功删除',
      deleteError: '删除问题失败'
    },
    edit: {
      title: '编辑问题',
      success: '问题更新成功'
    },
    submit_issue: {
      title: '提交问题',
      module_selection: '选择模块',
      module_placeholder: '请选择问题所属的模块',
      description: '问题描述',
      description_placeholder: '请详细描述您遇到的问题...',
      screenshot: '截图',
      add_screenshot: '添加截图',
      submit: '提交',
      submitting: '提交中...',
      submit_success: '问题提交成功',
      submit_fail: '提交失败，请稍后重试',
      empty_content_warning: '问题描述不能为空',
      magic_title: '智能标题',
      magic_title_button: '生成标题',
      title_preview: '标题预览',
      title_preview_placeholder: '标题将根据您输入的问题描述自动生成',
      email_sent_success: '邮件通知已发送给负责的开发者',
      email_sent_fail: '邮件通知发送失败，但问题已成功提交'
    }
  }
}

// 英文语言包
const enUS = {
  common: {
    platformName: 'PADIA User Feedback Platform',
    developerPlatformName: 'PADIA Developer Feedback Platform',
    copyright: '© 2024 PADIA User Feedback Platform. All rights reserved.',
    profile: 'Profile',
    logout: 'Logout',
    language: 'English',
    switchLanguage: 'Switch Language',
    languageChanged: 'Language Changed',
    comingSoon: 'Coming Soon',
    reset: 'Reset',
    search: 'Search',
    process: 'Process',
    view: 'View',
    edit: 'Edit',
    delete: 'Delete',
    cancel: 'Cancel',
    confirm: 'Confirm',
    back: 'Back',
    save: 'Save',
    loading: 'Loading',
    empty: 'No Data'
  },
  nav: {
    submitIssue: 'Submit Issue',
    issueList: 'Issue List',
    hotIssues: 'Hot Issues',
    taskList: 'Task List',
    statistics: 'Statistics'
  },
  form: {
    module: 'Module',
    selectModule: 'Please select a module',
    issueDescription: 'Issue Description',
    detailDescription: 'Please describe your issue in detail...',
    isPublic: 'Make this issue public after being resolved',
    submit: 'Submit',
    autoTitle: 'Auto Title',
    title: 'Title',
    titlePlaceholder: 'Please enter the issue title',
    generatedTitle: 'Auto Generated Title'
  },
  task: {
    title: 'Task List',
    allTasks: 'All Tasks',
    pending: 'Pending',
    processing: 'Processing',
    resolved: 'Resolved',
    closed: 'Closed',
    searchPlaceholder: 'Search tasks',
    emptyTaskPrefix: 'No',
    emptyTaskSuffix: 'tasks',
    assignTime: 'Assigned time',
    priority: {
      high: 'High',
      medium: 'Medium',
      low: 'Low'
    },
    noData: 'No Data'
  },
  statistics: {
    title: 'Statistics',
    overview: 'Work Overview',
    totalIssues: 'Total Issues',
    pendingIssues: 'Pending',
    processingIssues: 'Processing',
    resolvedIssues: 'Resolved',
    userSatisfaction: 'User Satisfaction',
    star: 'star',
    ratings: '{count} ratings in total',
    efficiency: 'Efficiency Metrics',
    avgResponseTime: 'Avg. Response Time',
    avgResolveTime: 'Avg. Resolution Time',
    completionRate: 'Completion Rate',
    hour: 'hours',
    responseTimeDesc: 'Average time from submission to first view',
    resolveTimeDesc: 'Average time from submission to resolution',
    completionDesc: 'Resolved {resolved} / Total {total}',
    noStatisticsData: 'No Statistics Data',
    noStatisticsDesc1: 'You currently have no task or rating data',
    noStatisticsDesc2: 'Process more issues to view detailed statistics'
  },
  issue: {
    title: 'Issue List',
    hotIssues: 'Hot Issues',
    myIssues: 'My Issues',
    allIssues: 'All Issues',
    searchPlaceholder: 'Search issues',
    emptyIssuePrefix: 'No',
    emptyIssueSuffix: 'issues',
    status: {
      all: 'All',
      pending: 'Pending',
      processing: 'Processing',
      resolved: 'Resolved',
      closed: 'Closed'
    },
    detail: {
      title: 'Issue Detail',
      createTime: 'Created Time',
      updateTime: 'Updated Time',
      status: 'Status',
      module: 'Module',
      description: 'Description',
      comments: 'Comments',
      commentPlaceholder: 'Please enter your comment',
      submitComment: 'Submit Comment',
      deleteConfirm: 'Are you sure you want to delete this issue? This action cannot be undone.',
      submitter: 'Submitter',
      unknownUser: 'Unknown User',
      unspecified: 'Unspecified',
      unknownTime: 'Unknown time',
      taskStatus: 'Task Status',
      currentStatus: 'Current Status',
      priority: 'Priority',
      assignee: 'Assignee',
      unassigned: 'Unassigned',
      startProcessing: 'Start Processing',
      markAsResolved: 'Mark as Resolved',
      reopen: 'Reopen',
      closeTask: 'Close Task',
      remark: 'Remark',
      admin: 'Admin',
      developer: 'Developer',
      user: 'User',
      noComments: 'No comments yet. Be the first to add a comment!',
      addComment: 'Add Comment',
      commentRequired: 'Please enter a comment',
      public: 'Public',
      private: 'Private',
      commentSuccess: 'Comment added successfully',
      commentError: 'Failed to add comment',
      commentsError: 'Failed to get comments',
      statusUpdateSuccess: 'Issue status updated to: {status}',
      statusUpdateError: 'Failed to update issue status',
      deleteSuccess: 'Issue deleted successfully',
      deleteError: 'Failed to delete issue'
    },
    edit: {
      title: 'Edit Issue',
      success: 'Issue updated successfully'
    },
    submit_issue: {
      title: 'Submit Issue',
      module_selection: 'Select Module',
      module_placeholder: 'Please select the module for the issue',
      description: 'Issue Description',
      description_placeholder: 'Please describe your issue in detail...',
      screenshot: 'Screenshot',
      add_screenshot: 'Add Screenshot',
      submit: 'Submit',
      submitting: 'Submitting...',
      submit_success: 'Issue submitted successfully',
      submit_fail: 'Submission failed, please try again later',
      empty_content_warning: 'Issue description cannot be empty',
      magic_title: 'Auto Title',
      magic_title_button: 'Generate Title',
      title_preview: 'Title Preview',
      title_preview_placeholder: 'Title will be automatically generated based on your issue description',
      email_sent_success: 'Email notification sent to responsible developer',
      email_sent_fail: 'Email notification failed to send, but issue submitted successfully'
    }
  }
}

// 创建i18n实例
export const setupI18n = () => {
  // 获取语言设置
  const languageStore = useLanguageStore()
  
  const i18n = createI18n({
    legacy: false, // 使用组合式API
    locale: languageStore.language,
    fallbackLocale: 'zh-CN',
    messages: {
      'zh-CN': zhCN,
      'en-US': enUS
    },
    sync: true
  })
  
  // 监听语言变化
  languageStore.$subscribe((mutation, state) => {
    i18n.global.locale.value = state.language
  })
  
  return i18n
} 