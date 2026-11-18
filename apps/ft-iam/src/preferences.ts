import { defineOverridesPreferences } from '@vben/preferences';

/**
 * @description 项目配置：只覆盖需要的字段，其余走 Vben 默认
 */
export const overridesPreferences = defineOverridesPreferences({
  app: {
    // 菜单/路由由后端权限接口驱动
    accessMode: 'backend',
    name: 'Fighter IAM',
    defaultHomePath: '/dashboard',
  },
  logo: {
    enable: true,
    source: '/logo.png',
    sourceDark: '/logo-dark.png',
    fit: 'contain',
  },
  breadcrumb: {
    showHome: true,
  },
  copyright: {
    enable: false,
  },
  sidebar: {
    width: 240,
    fixedButton: false,
  },
  tabbar: {
    persist: false,
  },
  shortcutKeys: {
    globalLogout: false,
    globalLockScreen: false,
  },
  theme: {
    mode: 'light',
    builtinType: 'default',
    colorPrimary: 'hsl(212 100% 45%)',
  },
});
