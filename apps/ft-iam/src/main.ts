import { initPreferences } from '@vben/preferences';
import { unmountGlobalLoading } from '@vben/utils';

import { overridesPreferences } from './preferences';

/**
 * 应用初始化完成之后再加载页面
 */
async function initApplication() {
  const env = import.meta.env.PROD ? 'prod' : 'dev';
  const namespace = `${import.meta.env.VITE_APP_NAMESPACE}-${import.meta.env.VITE_APP_VERSION ?? '1.0.0'}-${env}`;

  await initPreferences({
    namespace,
    overrides: overridesPreferences,
  });

  const { bootstrap } = await import('./bootstrap');
  await bootstrap(namespace);

  unmountGlobalLoading();
}

initApplication();
