import type { ComponentRecordType } from '@vben/types';
import type { Router } from 'vue-router';

import { generateAccessible } from '@vben/access';
import { preferences } from '@vben/preferences';

import { AuthApi } from '#/api/auth.api';
import { convertMenuListToRoutes } from '#/api/menu-to-routes';

const forbiddenComponent = () => import('#/views/_core/fallback/forbidden.vue');

interface GenerateAccessOptions {
  router: Router;
}

/** 后端菜单驱动：拉 /auth/permission-info 的 menus 生成路由与侧边栏 */
async function generateAccess(options: GenerateAccessOptions) {
  const { router } = options;

  const pageMap: ComponentRecordType = import.meta.glob('../views/**/*.vue');
  const layoutMap: ComponentRecordType = {
    BasicLayout: () => import('#/layouts/basic.vue'),
    IFrameView: () => import('@vben/layouts').then((m) => ({ default: m.IFrameView })),
  };

  return await generateAccessible(preferences.app.accessMode, {
    router,
    routes: [],
    fetchMenuListAsync: async () => {
      const { data } = await AuthApi.getPermissionInfo();
      return convertMenuListToRoutes(data?.menus ?? []);
    },
    forbiddenComponent,
    layoutMap,
    pageMap,
  });
}

export { generateAccess }
