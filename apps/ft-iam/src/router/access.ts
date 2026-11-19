import type { ComponentRecordType } from '@vben/types';
import type { Router } from 'vue-router';

import { generateAccessible } from '@vben/access';
import { preferences } from '@vben/preferences';

import { AuthApi } from '#/api/auth.api';
import { convertMenuListToRoutes, pickAppMenus } from '#/api/menu-to-routes';

/** iam 自己的微应用标识：菜单按 iam_menu.app_key = 'iam' 归属，不渲染子应用菜单 */
const IAM_APP_KEY = 'iam';

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
      const { data } = await AuthApi.getPermissionInfo(IAM_APP_KEY);
      return convertMenuListToRoutes(pickAppMenus(data?.menus ?? [], IAM_APP_KEY));
    },
    forbiddenComponent,
    layoutMap,
    pageMap,
  });
}

export { generateAccess }
