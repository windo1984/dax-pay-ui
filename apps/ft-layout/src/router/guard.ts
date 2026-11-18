import type { Router } from 'vue-router';

import { useAuth } from '../store/auth';

/** 免登录路由（登录页本身） */
const WHITE_LIST = ['login'];

/**
 * 登录守卫：未登录只能停留在登录页
 * - 无 token → 跳 /login，并带上 redirect 便于登录后回跳
 * - 有 token 但未拉过用户信息 → 拉一次；401（token 失效）则清空并回登录页
 */
export function setupAuthGuard(router: Router) {
  router.beforeEach(async (to) => {
    const auth = useAuth();

    if (WHITE_LIST.includes(to.name as string)) {
      // 已登录还去登录页 → 回首页；token 失效则留在登录页
      if (auth.state.token) {
        if (!auth.state.loaded) {
          try {
            await auth.loadUserInfo();
            return { path: '/', replace: true };
          } catch {
            await auth.logout(false);
            return true;
          }
        }
        return { path: '/', replace: true };
      }
      return true;
    }

    if (!auth.state.token) {
      return {
        path: '/login',
        query: to.fullPath === '/' ? {} : { redirect: to.fullPath },
        replace: true,
      };
    }

    if (!auth.state.loaded) {
      try {
        await auth.loadUserInfo();
      } catch {
        await auth.logout(false);
        return {
          path: '/login',
          query: to.fullPath === '/' ? {} : { redirect: to.fullPath },
          replace: true,
        };
      }
    }

    return true;
  });
}
