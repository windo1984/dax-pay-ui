<script lang="ts" setup>
  import { onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { BasicLayout } from '@vben/layouts';
  import { useAccessStore, useUserStore } from '@vben/stores';

  import { useAuthStore } from '#/store';

  defineOptions({ name: 'FtIamBasicLayout' });

  const router = useRouter();
  const userStore = useUserStore();
  const accessStore = useAccessStore();
  const authStore = useAuthStore();

  const userName = ref('');

  onMounted(() => {
    userName.value = userStore.userInfo?.name || userStore.userInfo?.account || '';
  });

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
      <div class="ft-user">
        <span class="ft-user-name">{{ userName }}</span>
        <a-button type="link" size="small" @click="handleLogout">退出登录</a-button>
      </div>
    </template>
    <template v-if="accessStore.loginExpired" #extra>
      <div class="ft-expired">
        登录已过期，请
        <a-button type="link" @click="handleLogout">重新登录</a-button>
      </div>
    </template>
  </BasicLayout>
</template>

<style scoped>
  .ft-user {
    display: flex;
    gap: 4px;
    align-items: center;
    padding: 0 4px;
  }

  .ft-user-name {
    font-size: 13px;
    color: hsl(var(--foreground));
  }

  .ft-expired {
    padding: 8px 16px;
  }
</style>
