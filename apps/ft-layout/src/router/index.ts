import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import { setupAuthGuard } from './guard'

const Empty = { template: '<div />' }

const routes: RouteRecordRaw[] = [
  { path: '/login', name: 'login', component: () => import('../views/LoginPage.vue') },
  { path: '/', name: 'home', component: Empty },
  // 子应用路由（/iam、/admin、/merchant、/yudao…）不在这里写死：
  // 登录后按 GET /auth/app-tree 返回的数据由 router/dynamic.ts 动态注册
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 未登录不能访问任何子应用（/、/iam、/admin、/merchant、/yudao 全部拦截）
setupAuthGuard(router)

export { router, Empty }
