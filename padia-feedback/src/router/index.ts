import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Root',
    redirect: '/auth/login'
  },
  {
    path: '/auth',
    name: 'AuthLayout',
    component: () => import('../layouts/AuthLayout.vue'),
    children: [
      {
        path: 'login',
        name: 'Login',
        component: () => import('../views/auth/Login.vue'),
        meta: { title: '登录' }
      }
    ]
  },
  {
    path: '/user',
    name: 'UserLayout',
    component: () => import('../layouts/UserLayout.vue'),
    children: [
      {
        path: '',
        name: 'UserHome',
        redirect: '/user/submit'
      },
      {
        path: 'submit',
        name: 'SubmitIssue',
        component: () => import('../views/user/SubmitIssue.vue'),
        meta: { title: '提交问题' }
      },
      {
        path: 'issues',
        name: 'IssueList',
        component: () => import('../views/user/IssueList.vue'),
        meta: { title: '问题列表' }
      },
      {
        path: 'hot',
        name: 'HotIssues',
        component: () => import('../views/user/HotIssues.vue'),
        meta: { title: '热门问题' }
      },
      {
        path: 'issue/:id',
        name: 'UserIssueDetail',
        component: () => import('../views/common/IssueDetail.vue'),
        meta: { title: '问题详情' }
      }
    ]
  },
  {
    path: '/developer',
    name: 'DeveloperLayout',
    component: () => import('../layouts/DeveloperLayout.vue'),
    children: [
      {
        path: '',
        name: 'DeveloperHome',
        redirect: '/developer/tasks'
      },
      {
        path: 'tasks',
        name: 'TaskList',
        component: () => import('../views/developer/TaskList.vue'),
        meta: { title: '任务列表' }
      },
      {
        path: 'issue/:id',
        name: 'DeveloperIssueDetail',
        component: () => import('../views/common/IssueDetail.vue'),
        meta: { title: '问题详情', isDeveloper: true }
      },
      {
        path: 'statistics',
        name: 'Statistics',
        component: () => import('../views/developer/Statistics.vue'),
        meta: { title: '数据统计' }
      }
    ]
  },
  {
    path: '/issue/:id',
    name: 'IssueRedirect',
    redirect: to => {
      return { path: `/user/issue/${to.params.id}` }
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 导航守卫
router.beforeEach((to, from, next) => {
  // 检查用户是否已登录
  const isAuthenticated = localStorage.getItem('token') !== null
  
  // 如果目标路由不是认证相关页面，并且用户未登录，则重定向到登录页面
  if (!to.path.startsWith('/auth') && !isAuthenticated) {
    next({ path: '/auth/login' })
  } else {
    next()
  }
})

export default router 