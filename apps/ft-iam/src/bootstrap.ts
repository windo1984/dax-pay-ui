import { createApp, watchEffect } from 'vue';

import { registerLoadingDirective } from '@vben/common-ui/es/loading';
import { preferences } from '@vben/preferences';
import { initStores } from '@vben/stores';
import '@vben/styles';

import { useTitle } from '@vueuse/core';

import App from './app.vue';
import { setupI18n } from './locales';
import { router } from './router';

async function bootstrap(namespace: string) {
  const app = createApp(App);

  // v-loading 指令（Vben 布局/弹窗内部会用到）
  registerLoadingDirective(app, {
    loading: 'loading',
    spinning: 'spinning',
  });

  await setupI18n(app);
  await initStores(app, { namespace });

  const { initTippy } = await import('@vben/common-ui/es/tippy');
  initTippy(app);

  app.use(router);

  const { MotionPlugin } = await import('@vben/plugins/motion');
  app.use(MotionPlugin);

  watchEffect(() => {
    if (preferences.app.dynamicTitle) {
      const routeTitle = router.currentRoute.value.meta?.title;
      const pageTitle = (routeTitle ? `${routeTitle} - ` : '') + preferences.app.name;
      useTitle(pageTitle);
    }
  });

  app.mount('#app');
}

export { bootstrap };
