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
    // 设置（偏好）入口已上收到基座 ft-layout，子应用顶栏不再提供
    enablePreferences: false,
  },
  widget: {
    // 主题 / 语言 / 时区 / 全屏 统一由基座顶栏控制，子应用只接收基座广播
    themeToggle: false,
    languageToggle: false,
    timezone: false,
    fullscreen: false,
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
