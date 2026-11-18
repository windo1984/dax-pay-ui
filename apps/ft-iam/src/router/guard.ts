import type { Router } from 'vue-router';

import { watch } from 'vue';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { useAccessStore, useUserStore } from '@vben/stores';
import { startProgress, stopProgress } from '@vben/utils';

import { AuthApi } from '#/api/auth.api';
import { $t, i18n } from '#/locales';
import { HOME_PATH } from '#/router/routes';
import { useAuthStore } from '#/store';

import { generateAccess } from './access';

/**
 * 完全不需要登录态的基础页面。
 *
 * 注意：不能用 coreRouteNames（它是整棵核心路由树的名字，包含 Root 与其子路由 Dashboard）。
 * 否则访问 /dashboard 时守卫会直接 return true，跳过下面的权限初始化，
 * accessMenus 永远是空数组 —— 表现为工作台能打开、但侧边栏一个菜单都没有。
 */
const ACCESS_FREE_ROUTE_NAMES = ['Authentication', 'Login'];

function setupCommonGuard(router: Router) {
  const loadedPaths = new Set<string>();

  router.beforeEach((to) => {
    to.meta.loaded = loadedPaths.has(to.path);
    if (!to.meta.loaded && preferences.transition.progress) {
      startProgress();
    }
    return true;
  });

  router.afterEach((to) => {
    loadedPaths.add(to.path);
    if (preferences.transition.progress) {
      stopProgress();
    }
  });
}

function setupAccessGuard(router: Router) {
  router.beforeEach(async (to, _from) => {
    const accessStore = useAccessStore();
    const userStore = useUserStore();
    const authStore = useAuthStore();

    // 只有登录页/登录态跳转不需要登录；FallbackNotFound 也要先建权限路由，
    // 否则直接输入 /system/dept 这类动态地址时会被 404 兜底捕获、永远出不来
    if (ACCESS_FREE_ROUTE_NAMES.includes(to.name as string)) {
      if (to.path === LOGIN_PATH && accessStore.accessToken) {
        return HOME_PATH;
      }
      return true;
    }

    if (!accessStore.accessToken) {
      if (to.meta.ignoreAccess) {
        return true;
      }
      if (to.fullPath !== LOGIN_PATH) {
        return {
          path: LOGIN_PATH,
          query: to.fullPath === HOME_PATH ? {} : { redirect: encodeURIComponent(to.fullPath) },
          replace: true,
        };
      }
      return to;
    }

    if (accessStore.isAccessChecked) {
      return true;
    }

    try {
      if (!userStore.userInfo) {
        await authStore.fetchUserInfo();
      }

      // 权限码 + 菜单一次性拉取
      const { data: permission } = await AuthApi.getPermissionInfo();
      accessStore.setPermCodes(permission?.permissions ?? []);
      authStore.setRoles(permission?.roles ?? []);

      const { accessibleMenus, accessibleRoutes } = await generateAccess({ router });
      accessStore.setAccessMenus(accessibleMenus);
      accessStore.setAccessRoutes(accessibleRoutes);
      accessStore.setIsAccessChecked(true);

      return {
        ...router.resolve(to.fullPath),
        replace: true,
      };
    } catch (error) {
      console.error('[ft-iam] 初始化权限失败', error);
      if (!accessStore.accessToken) {
        return { path: LOGIN_PATH, replace: true };
      }
      // token 有效但接口异常：留在原页，避免死循环
      return true;
    }
  });
}

/**
 * 浏览器标签标题：路由 meta.title 现在存的是词条 key（如 menu.system.user），
 * 直接拼进 document.title 会显示成 "menu.system.user - Fighter IAM"，
 * 所以这里走一遍 $t 再拼应用名。放在最后注册，确保比其它 afterEach 更晚执行。
 */
function setupTitleGuard(router: Router) {
  function apply(raw?: string) {
    if (!raw) {
      return;
    }
    const text = $t(raw);
    const appName = preferences.app.name;
    document.title = appName ? `${text} - ${appName}` : text;
  }

  router.afterEach((to) => {
    const raw = to.meta?.title as string | undefined;
    apply(raw);
    // 框架自身也会写 document.title（保证在它之后落地）
    setTimeout(() => apply(raw), 0);
  });

  // 语言切换不会触发路由变更，标题要单独跟着刷新
  watch(
    () => i18n.global.locale.value,
    () => {
      const raw = router.currentRoute.value.meta?.title as string | undefined;
      setTimeout(() => apply(raw), 0);
    },
  );
}

function createRouterGuard(router: Router) {
  setupCommonGuard(router);
  setupAccessGuard(router);
  setupTitleGuard(router);
}

export { createRouterGuard };
