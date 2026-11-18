import type { RouteRecordRaw } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';

/** 首页：工作台（不依赖后端菜单，静态注册在 Root 下） */
export const HOME_PATH = '/dashboard';

const BasicLayout = () => import('#/layouts/basic.vue');
const AuthPageLayout = () => import('#/layouts/auth.vue');

/** 全局 404 */
const fallbackNotFoundRoute: RouteRecordRaw = {
  component: () => import('#/views/_core/fallback/not-found.vue'),
  meta: {
    hideInBreadcrumb: true,
    hideInMenu: true,
    hideInTab: true,
    title: '404',
  },
  name: 'FallbackNotFound',
  path: '/:path(.*)*',
};

/** 基础路由：Root（基础布局）、认证页、404 */
const coreRoutes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      hideInBreadcrumb: true,
      title: 'Root',
    },
    name: 'Root',
    path: '/',
    redirect: HOME_PATH,
    children: [
      {
        name: 'Dashboard',
        path: 'dashboard',
        component: () => import('#/views/dashboard/index.vue'),
        meta: {
          title: '工作台',
          icon: 'lucide:layout-dashboard',
          affixTab: true,
        },
      },
    ],
  },
  {
    component: AuthPageLayout,
    meta: {
      hideInTab: true,
      title: '登录',
    },
    name: 'Authentication',
    path: '/auth',
    redirect: LOGIN_PATH,
    children: [
      {
        name: 'Login',
        path: 'login',
        component: () => import('#/views/_core/authentication/login.vue'),
        meta: {
          title: '登录',
        },
      },
    ],
  },
];

export { coreRoutes, fallbackNotFoundRoute };
