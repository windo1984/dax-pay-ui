import { loadLocaleMessages } from '@vben/locales';
import type { SupportedLanguagesType } from '@vben/locales';
import { preferences, updatePreferences } from '@vben/preferences';
import { useTimezoneStore } from '@vben/stores';

interface HostAppearancePayload {
  locale?: string;
  theme?: 'dark' | 'light';
  timezone?: string;
}

/**
 * 收敛子应用顶栏工具。
 *
 * 主题 / 语言 / 时区 / 全屏 / 设置（偏好）入口统一上收到基座 ft-layout，
 * 子应用顶栏不再提供这些部件。
 *
 * 注意：偏好缓存优先级高于 overrides（本机有历史缓存时 overrides 不生效），
 * 所以必须在启动后用 updatePreferences 主动写一次，而不是只写 preferences.ts。
 */
export function compactAppHeader() {
  updatePreferences({
    app: { enablePreferences: false },
    widget: {
      themeToggle: false,
      languageToggle: false,
      timezone: false,
      fullscreen: false,
    },
  });
}

/**
 * 接收基座广播的外观设置。
 *
 * 子应用以 iframe 方式运行、与基座不同 origin，localStorage 隔离，
 * 基座顶栏切换后 postMessage 过来，这里落到本应用偏好与 timezone store 上。
 */
export function setupHostAppearanceBridge() {
  window.addEventListener('message', async (event: MessageEvent) => {
    const data = event.data as
      | { payload?: HostAppearancePayload; source?: string; type?: string }
      | undefined;

    if (!data || data.source !== 'ft-layout' || data.type !== 'appearance') {
      return;
    }

    const payload = data.payload ?? {};

    if (payload.theme && payload.theme !== preferences.theme.mode) {
      updatePreferences({ theme: { mode: payload.theme } });
    }

    if (payload.locale && payload.locale !== preferences.app.locale) {
      const locale = payload.locale as SupportedLanguagesType;
      updatePreferences({ app: { locale } });
      await loadLocaleMessages(locale);
    }

    if (payload.timezone) {
      const timezoneStore = useTimezoneStore();
      if (timezoneStore.timezone !== payload.timezone) {
        await timezoneStore.setTimezone(payload.timezone);
      }
    }
  });
}
