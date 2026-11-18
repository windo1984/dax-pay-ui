import type { App } from 'vue';

// antd 组件库语言包（本端固定简体中文）
import antdZhCn from 'antdv-next/dist/locale/zh_CN';

import { setupI18n as coreSetup } from '@vben/locales';
import { preferences } from '@vben/preferences';

/**
 * ft-iam 端只做简体中文，词条直接来自 @vben/locales 内置语言包，
 * 业务侧文案（菜单名、表单标签）走后端菜单数据与本地常量，不进语言包。
 */
async function setupI18n(app: App) {
  await coreSetup(app, {
    defaultLocale: preferences.app.locale ?? 'zh-CN',
    missingWarn: !import.meta.env.PROD,
  });
}

export { setupI18n };
export const antdLocale = antdZhCn;
