<script lang="ts" setup>
  import { useRouter } from 'vue-router';

  import { BasicLayout } from '@vben/layouts';
  import { useAccessStore } from '@vben/stores';

  import { $t } from '#/locales';
  import { useAuthStore } from '#/store';

  defineOptions({ name: 'FtIamBasicLayout' });

  const router = useRouter();
  const accessStore = useAccessStore();
  const authStore = useAuthStore();

  function handleLogout() {
    authStore.logout(false);
  }

  function goHome() {
    router.push('/dashboard');
  }
</script>

<template>
  <BasicLayout @clear-preferences-and-logout="handleLogout" @click-logo="goHome">
    <!-- 顶栏工具（主题/语言/时区/全屏/用户菜单）已迁移到基座 ft-layout，这里不再提供 #user-dropdown -->
    <template v-if="accessStore.loginExpired" #extra>
      <div class="ft-expired">
        {{ $t('common.layout.loginExpired') }}
        <a-button type="link" @click="handleLogout">{{ $t('common.layout.relogin') }}</a-button>
      </div>
    </template>
  </BasicLayout>
</template>

<style scoped>
  .ft-expired {
    padding: 8px 16px;
  }
</style>
