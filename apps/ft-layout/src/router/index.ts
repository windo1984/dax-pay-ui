import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import { setupAuthGuard } from './guard'

const Empty = { template: '<div />' }

const routes: RouteRecordRaw[] = [
  { path: '/login', name: 'login', component: () => import('../views/LoginPage.vue') },
  { path: '/', name: 'home', component: Empty },
  { path: '/admin', name: 'admin', component: Empty },
  { path: '/merchant', name: 'merchant', component: Empty },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 未登录不能访问任何子应用（/、/admin、/merchant 全部拦截）
setupAuthGuard(router)

export { router }
