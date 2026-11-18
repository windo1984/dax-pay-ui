import type { Router } from 'vue-router';

import { useAppRegistry } from '../config/apps';
import { useAuth } from '../store/auth';
import { registerAppRoutes } from './dynamic';

/** 免登录路由（登录页本身） */
const WHITE_LIST = ['login'];

/**
 * 登录守卫：未登录只能停留在登录页
 * - 无 token → 跳 /login，并带上 redirect 便于登录后回跳
 * - 有 token 但未拉过用户信息 → 拉用户信息 + 模块树，并按返回数据动态注册子应用路由
 * - 目标路径不在当前用户可见模块里（没权限 / 不存在）→ 回首页，不留在空白页
 */
export function setupAuthGuard(router: Router) {
  router.beforeEach(async (to) => {
    const auth = useAuth();
    const registry = useAppRegistry();

    if (WHITE_LIST.includes(to.name as string)) {
      // 已登录还去登录页 → 回首页；token 失效则留在登录页
      if (auth.state.token) {
        if (!auth.state.loaded) {
          try {
            await auth.loadUserInfo();
            await ensureRegistry(router, registry);
            return { path: '/', replace: true };
          } catch {
            await auth.logout(false);
            registry.reset();
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
        registry.reset();
        return {
          path: '/login',
          query: to.fullPath === '/' ? {} : { redirect: to.fullPath },
          replace: true,
        };
      }
    }

    if (!registry.state.loaded) {
      try {
        await ensureRegistry(router, registry);
      } catch {
        // 模块树拉取失败不阻断进入基座：首页会提示"菜单加载失败"，重新登录或刷新可重试
        return to.path === '/' ? true : { path: '/', replace: true };
      }
      // 路由刚注册完，重新解析一次目标地址（首屏直接访问 /iam 时靠这一步才能匹配上）
      if (to.path !== '/' && router.resolve(to.fullPath).matched.length === 0) {
        return { path: to.fullPath, replace: true };
      }
      return true;
    }

    // 注册表已就绪，但目标地址不在可见模块里 → 回首页（首页会说明"无可访问模块"）
    if (to.matched.length === 0 && to.path !== '/') {
      return { path: '/', replace: true };
    }

    return true;
  });
}

/** 拉取模块树并注册路由 */
async function ensureRegistry(
  router: Router,
  registry: ReturnType<typeof useAppRegistry>,
): Promise<void> {
  const groups = await registry.load();
  registerAppRoutes(
    router,
    groups.flatMap((group) => group.apps),
  );
}
