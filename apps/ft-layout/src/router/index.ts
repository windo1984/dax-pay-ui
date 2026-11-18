import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import { flatApps } from '../config/apps'
import { setupAuthGuard } from './guard'

const Empty = { template: '<div />' }

const routes: RouteRecordRaw[] = [
  { path: '/login', name: 'login', component: () => import('../views/LoginPage.vue') },
  { path: '/', name: 'home', component: Empty },
  // 子应用路由由注册表生成：/iam、/admin、/merchant、/yudao
  ...flatApps.map((app) => ({
    path: app.path,
    name: app.key,
    component: Empty,
  })),
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 未登录不能访问任何子应用（/、/iam、/admin、/merchant、/yudao 全部拦截）
setupAuthGuard(router)

export { router }
