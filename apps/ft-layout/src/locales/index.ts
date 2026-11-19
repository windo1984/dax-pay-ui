/**
 * 基座自身的轻量文案（zh-CN / en-US）。
 *
 * 基座不依赖 @vben 的 i18n（运行时依赖只有 micro-app + vue + vue-router），
 * 所以用一张字典 + 当前语言（来自 appearance store）做最简实现。
 * 只覆盖基座自绘界面（顶栏、首页、登录页）；子应用的语言由各应用自己的语言包负责。
 */
import type { ComputedRef } from 'vue';
import { computed } from 'vue';

import { useAppearance } from '../store/appearance';

type Locale = 'en-US' | 'zh-CN';

const messages: Record<Locale, Record<string, string>> = {
  'en-US': {
    refresh: 'Refresh',
    home: 'Home',
    allApps: 'All apps',
    closeAll: 'Close all',
    current: 'Current',
    noApps: 'No modules are available for this account.',
    loadFailed: 'Failed to load the main menu:',
    noAppsHint:
      'No modules are available for this account. Ask an administrator to grant module access in IAM → Role Management → Assign Menus.',
    welcome: 'Welcome to Fighter micro-frontend shell',
    intro:
      'Hover ☰ at the top to browse apps by product line. A click opens one as a tab, and multiple tabs can stay open. Only the login page is available when signed out.',
    appsCount: '{n} apps',
    roleSep: ', ',
    // 顶栏工具
    settings: 'Settings',
    theme: 'Theme',
    toLight: 'Switch to light',
    toDark: 'Switch to dark',
    language: 'Language',
    timezone: 'Timezone',
    timezoneLabel: 'Timezone: {tz}',
    fullscreen: 'Fullscreen',
    appearance: 'Appearance',
    light: 'Light',
    dark: 'Dark',
    logout: 'Sign out',
    syncHint: 'These settings are owned by the shell and synced to all open sub-apps.',
    // 登录页
    login: 'Sign in',
    tenant: 'Tenant',
    loginAccount: 'Account',
    password: 'Password',
    loggingIn: 'Signing in…',
    loginSubtitle: 'Unified identity and permission platform',
    loginTitle: 'Fighter IAM shell',
    loginFailed: 'Sign in failed',
    loginIntro: 'Access all business modules after signing in',
    tenantCode: 'Tenant code',
    identityDomain: 'Client domain',
    accountPlaceholder: 'Enter account',
    passwordPlaceholder: 'Enter password',
    errorEmpty: 'Account and password are required',
    defaultHint: 'Default: admin / admin123, tenant fighter, client admin',
    clientAdmin: 'Admin (admin)',
    clientMerchant: 'Merchant (merchant)',
    clientApp: 'App (app)',
    clientGateway: 'Gateway (gateway)',
  },
  'zh-CN': {
    refresh: '刷新当前页',
    home: '首页',
    allApps: '全部应用',
    closeAll: '全部关闭',
    current: '当前',
    noApps: '当前账号没有可访问的模块',
    loadFailed: '主菜单加载失败：',
    noAppsHint:
      '当前账号没有可访问的模块。请联系管理员在「IAM → 角色管理 → 分配菜单」中授予模块访问权限。',
    welcome: '欢迎使用 Fighter 微前端基座',
    intro:
      '顶部 ☰ hover 按产品线展开子应用，点击后以 Tab 形式打开，多 Tab 可并存；未登录仅能停留在登录页。',
    appsCount: '{n} 个应用',
    roleSep: '、',
    settings: '设置',
    theme: '主题',
    toLight: '切换到浅色',
    toDark: '切换到深色',
    language: '语言',
    timezone: '时区',
    timezoneLabel: '时区：{tz}',
    fullscreen: '全屏',
    appearance: '外观设置',
    light: '浅色',
    dark: '深色',
    logout: '退出登录',
    syncHint: '这些设置由基座统一持有，会同步给所有已打开的子应用。',
    login: '登录',
    tenant: '租户',
    loginAccount: '账号',
    password: '密码',
    loggingIn: '登录中…',
    loginSubtitle: '统一用户与权限管理平台',
    loginTitle: 'Fighter IAM 微前端基座',
    loginFailed: '登录失败，请稍后重试',
    loginIntro: '登录后可访问各业务端模块',
    tenantCode: '租户编码',
    identityDomain: '身份域',
    accountPlaceholder: '请输入账号',
    passwordPlaceholder: '请输入密码',
    errorEmpty: '请输入账号和密码',
    defaultHint: '默认账号 admin / admin123，租户 fighter，身份域 admin',
    clientAdmin: '运营端（admin）',
    clientMerchant: '商户端（merchant）',
    clientApp: '应用端（app）',
    clientGateway: '网关（gateway）',
  },
};

export function useLocale(): {
  locale: ComputedRef<string>;
  t: (key: string, params?: Record<string, number | string>) => string;
} {
  const { state } = useAppearance();

  const t = (key: string, params?: Record<string, number | string>) => {
    const dict = messages[(state.locale as Locale)] ?? messages['zh-CN'];
    let text = dict[key] ?? messages['zh-CN'][key] ?? key;
    if (params) {
      text = text.replace(/\{(\w+)\}/g, (_m, name: string) =>
        params[name] === undefined ? `{${name}}` : String(params[name]),
      );
    }
    return text;
  };

  return { locale: computed(() => state.locale), t };
}

export { messages };
