// @ts-ignore 类型来自 antdv-next 内部声明
import type { Locale } from 'antdv-next/dist/locale';

import type { App } from 'vue';

import type { LocaleMessageValue, LocaleSetupOptions, SupportedLanguagesType } from '@vben/locales';

import { ref } from 'vue';

import { $t, loadLocalesMapFromDir, setupI18n as coreSetup } from '@vben/locales';
import { preferences } from '@vben/preferences';

import antdEnLocale from 'antdv-next/dist/locale/en_US';
import antdIdLocale from 'antdv-next/dist/locale/id_ID';
import antdJaLocale from 'antdv-next/dist/locale/ja_JP';
import antdKoLocale from 'antdv-next/dist/locale/ko_KR';
import antdMsLocale from 'antdv-next/dist/locale/ms_MY';
import antdThLocale from 'antdv-next/dist/locale/th_TH';
import antdViLocale from 'antdv-next/dist/locale/vi_VN';
import antdZhLocale from 'antdv-next/dist/locale/zh_CN';
import antdHkLocale from 'antdv-next/dist/locale/zh_HK';
import antdTwLocale from 'antdv-next/dist/locale/zh_TW';
import dayjs from 'dayjs';

// 菜单标题词条：后端 iam_menu 只存 i18n_key，标题真相源在语言包（与 daxpay-admin 一致）
import enUsMenuTitles from './menu-titles/en-US.json';
import idIdMenuTitles from './menu-titles/id-ID.json';
import jaJpMenuTitles from './menu-titles/ja-JP.json';
import koKrMenuTitles from './menu-titles/ko-KR.json';
import msMyMenuTitles from './menu-titles/ms-MY.json';
import thThMenuTitles from './menu-titles/th-TH.json';
import viVnMenuTitles from './menu-titles/vi-VN.json';
import zhCnMenuTitles from './menu-titles/zh-CN.json';
import zhHkMenuTitles from './menu-titles/zh-HK.json';
import zhTwMenuTitles from './menu-titles/zh-TW.json';

/** 10 种支持语言的菜单标题，key 与后端 iam_menu.i18n_key 一一对应 */
const menuTitlesMap: Record<string, Record<string, string>> = {
  'en-US': enUsMenuTitles,
  'id-ID': idIdMenuTitles,
  'ja-JP': jaJpMenuTitles,
  'ko-KR': koKrMenuTitles,
  'ms-MY': msMyMenuTitles,
  'th-TH': thThMenuTitles,
  'vi-VN': viVnMenuTitles,
  'zh-CN': zhCnMenuTitles,
  'zh-HK': zhHkMenuTitles,
  'zh-TW': zhTwMenuTitles,
};

/**
 * 国际化入口，机制与 apps/daxpay-admin 保持一致：
 *
 * 1. 框架词条由 @vben/locales 内置（loadLocaleMessages 里先加载，再由下面的 loadMessages 合并）；
 * 2. 业务词条放 `src/locales/langs/<locale>/...json`，按文件名形成命名空间
 *    （如 `langs/zh-CN/system/user.json` → `$t('system.user.xxx')`）；
 * 3. antd 组件库语言包用 ref 跟随切换（这是之前写死 zh_CN 导致「切了语言界面不变」的原因）；
 * 4. dayjs 语言包同步切换（日期选择器、相对时间依赖它）。
 */

/** antd 组件库当前语言包，app.vue 的 <ConfigProvider :locale="antdLocale"> 直接绑定 */
const antdLocale = ref<Locale>(antdZhLocale);

// 业务词条：dev 下逐 json 热更新；生产构建由 Vite 打成按语言拆分的动态 chunk
const jsonModules = import.meta.glob('./langs/**/*.json');
const localesMap = loadLocalesMapFromDir(/\.\/langs\/([^/]+)\/(.*)\.json$/, jsonModules);

/**
 * 每次切换语言都会走这里：加载业务词条 + 菜单标题 + 同步第三方组件库语言。
 * 缺业务词条的语言（zh-TW/ja-JP 等）返回 undefined，由 fallbackLocale 回退到中文。
 */
async function loadMessages(lang: SupportedLanguagesType): Promise<Record<string, LocaleMessageValue> | undefined> {
  const [appLocaleMessages] = await Promise.all([localesMap[lang]?.(), loadThirdPartyMessage(lang)]);
  const business = (appLocaleMessages?.default ?? {}) as Record<string, LocaleMessageValue>;
  const menuTitles = menuTitlesMap[lang] ?? {};
  return { ...business, ...menuTitles };
}

/** 第三方库语言包（antd / dayjs） */
async function loadThirdPartyMessage(lang: SupportedLanguagesType) {
  await Promise.all([loadAntdLocale(lang), loadDayjsLocale(lang)]);
}

/** antd 组件库语言包：日期、分页、空状态、表单校验提示都靠它 */
async function loadAntdLocale(lang: SupportedLanguagesType) {
  switch (lang) {
    case 'en-US': {
      antdLocale.value = antdEnLocale;
      break;
    }
    case 'id-ID': {
      antdLocale.value = antdIdLocale;
      break;
    }
    case 'ja-JP': {
      antdLocale.value = antdJaLocale;
      break;
    }
    case 'ko-KR': {
      antdLocale.value = antdKoLocale;
      break;
    }
    case 'ms-MY': {
      antdLocale.value = antdMsLocale;
      break;
    }
    case 'th-TH': {
      antdLocale.value = antdThLocale;
      break;
    }
    case 'vi-VN': {
      antdLocale.value = antdViLocale;
      break;
    }
    case 'zh-CN': {
      antdLocale.value = antdZhLocale;
      break;
    }
    case 'zh-HK': {
      antdLocale.value = antdHkLocale;
      break;
    }
    case 'zh-TW': {
      antdLocale.value = antdTwLocale;
      break;
    }
    default: {
      antdLocale.value = antdZhLocale;
    }
  }
}

/** dayjs 语言包 */
async function loadDayjsLocale(lang: SupportedLanguagesType) {
  let locale;
  switch (lang) {
    case 'en-US': {
      locale = await import('dayjs/locale/en');
      break;
    }
    case 'id-ID': {
      locale = await import('dayjs/locale/id');
      break;
    }
    case 'ja-JP': {
      locale = await import('dayjs/locale/ja');
      break;
    }
    case 'ko-KR': {
      locale = await import('dayjs/locale/ko');
      break;
    }
    case 'ms-MY': {
      locale = await import('dayjs/locale/ms');
      break;
    }
    case 'th-TH': {
      locale = await import('dayjs/locale/th');
      break;
    }
    case 'vi-VN': {
      locale = await import('dayjs/locale/vi');
      break;
    }
    case 'zh-CN': {
      locale = await import('dayjs/locale/zh-cn');
      break;
    }
    case 'zh-HK': {
      locale = await import('dayjs/locale/zh-hk');
      break;
    }
    case 'zh-TW': {
      locale = await import('dayjs/locale/zh-tw');
      break;
    }
    default: {
      locale = await import('dayjs/locale/zh-cn');
    }
  }
  if (locale) {
    dayjs.locale(locale);
  } else {
    console.error(`Failed to load dayjs locale for ${lang}`);
  }
}

async function setupI18n(app: App, options: LocaleSetupOptions = {}) {
  await coreSetup(app, {
    defaultLocale: preferences.app.locale ?? 'zh-CN',
    loadMessages,
    missingWarn: !import.meta.env.PROD,
    ...options,
  });
}

export { $t, antdLocale, setupI18n };
export { i18n } from '@vben/locales';
