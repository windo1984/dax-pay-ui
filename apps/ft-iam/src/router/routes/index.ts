import type { RouteRecordRaw } from 'vue-router';

import { traverseTreeValues } from '@vben/utils';

import { coreRoutes, fallbackNotFoundRoute, HOME_PATH } from './core';

/** 不需要走权限拦截的路由名 */
const coreRouteNames = traverseTreeValues(coreRoutes, (route) => route.name);

const routes: RouteRecordRaw[] = [...coreRoutes, fallbackNotFoundRoute];

export { coreRouteNames, HOME_PATH, routes };
