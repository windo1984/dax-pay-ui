<script lang="ts" setup>
  import { computed } from 'vue';
  import { useRouter } from 'vue-router';

  import { BasicLayout } from '@vben/layouts';
  import { useAccessStore, useUserStore } from '@vben/stores';

  import { $t } from '#/locales';
  import { UserDropdown } from '#/components/user-dropdown';
  import { useAuthStore } from '#/store';

  defineOptions({ name: 'FtIamBasicLayout' });

  const router = useRouter();
  const userStore = useUserStore();
  const accessStore = useAccessStore();
  const authStore = useAuthStore();

  /** 顶栏用户名：昵称/账号来自后端数据，不随语言切换 */
  const displayName = computed(
    () => userStore.userInfo?.name || userStore.userInfo?.account || '',
  );

  function handleLogout() {
    authStore.logout(false);
  }

  function goHome() {
    router.push('/dashboard');
  }
</script>

<template>
  <BasicLayout @clear-preferences-and-logout="handleLogout" @click-logo="goHome">
    <template #user-dropdown>
      <UserDropdown :text="displayName" @logout="handleLogout" />
    </template>
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
