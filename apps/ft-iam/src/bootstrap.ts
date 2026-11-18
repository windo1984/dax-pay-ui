import { createApp, watchEffect } from 'vue';

import { registerLoadingDirective } from '@vben/common-ui/es/loading';
import { preferences } from '@vben/preferences';
import { initStores, useAccessStore } from '@vben/stores';
import '@vben/styles';

import { useTitle } from '@vueuse/core';

import App from './app.vue';
import { setRequestIdentity } from './api/request';
import { setupI18n } from './locales';
import { router } from './router';

/**
 * 接管基座（ft-layout）传来的登录态。
 *
 * 基座与 ft-iam 是不同 origin（基座 :19000 / iam :7002），localStorage 天然隔离，
 * 所以基座在自己的 MicroPane 里把 token / tenantId / clientCode 挂到子应用地址上。
 * 这里读一次、写进 access store，然后把参数从地址栏抹掉（避免 token 出现在书签、截图、Referer）。
 *
 * 直连访问 :7002（不经基座）时没有这些参数，走原有登录流程，行为不变。
 */
function adoptTokenFromHost() {
  const url = new URL(window.location.href);
  const token = url.searchParams.get('token');
  if (!token) {
    return;
  }

  const accessStore = useAccessStore();
  accessStore.setAccessToken(token);

  const tenantId = url.searchParams.get('tenantId');
  const clientCode = url.searchParams.get('clientCode');
  if (tenantId || clientCode) {
    setRequestIdentity(tenantId || undefined, clientCode || undefined);
  }

  url.searchParams.delete('token');
  url.searchParams.delete('tenantId');
  url.searchParams.delete('clientCode');
  window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
}

async function bootstrap(namespace: string) {
  const app = createApp(App);

  // v-loading 指令（Vben 布局/弹窗内部会用到）
  registerLoadingDirective(app, {
    loading: 'loading',
    spinning: 'spinning',
  });

  await setupI18n(app);
  await initStores(app, { namespace });

  // initStores 之后 pinia 才可用
  adoptTokenFromHost();

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
