<script lang="ts" setup>
  import { computed } from 'vue';

  import { usePreferences } from '@vben/preferences';

  import { App, ConfigProvider, theme } from 'antdv-next';

  import { antdLocale } from '#/locales';

  defineOptions({ name: 'App' });

  const { isDark } = usePreferences();

  const tokenTheme = computed(() => ({
    algorithm: isDark.value ? [theme.darkAlgorithm] : [theme.defaultAlgorithm],
    components: {
      Button: { iconGap: 4 },
    },
  }));
</script>

<template>
  <ConfigProvider :locale="antdLocale" :theme="tokenTheme">
    <App>
      <RouterView />
    </App>
  </ConfigProvider>
</template>
