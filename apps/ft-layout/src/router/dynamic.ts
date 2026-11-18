import type { Router } from 'vue-router';

/**
 * 动态路由注册：把「当前用户可见的微前端模块」注册成基座路由。
 *
 * 与 router/index.ts 独立成模块，避免 index（创建 router）和 guard（使用 router）
 * 互相 import 造成循环依赖。注册过的 name 记在闭包里，退出登录时按它逐个卸载。
 */

const Empty = { template: '<div />' };

/** 已注册的子应用路由 name */
const registered = new Set<string>();

export function registerAppRoutes(router: Router, apps: Array<{ key: string; path: string }>): void {
  for (const app of apps) {
    if (registered.has(app.key) || router.hasRoute(app.key)) {
      continue;
    }
    router.addRoute({ path: app.path, name: app.key, component: Empty });
    registered.add(app.key);
  }
}

/** 退出登录时调用：避免换账号后残留上一个用户的模块入口 */
export function removeAppRoutes(router: Router): void {
  for (const key of registered) {
    if (router.hasRoute(key)) {
      router.removeRoute(key);
    }
  }
  registered.clear();
}
