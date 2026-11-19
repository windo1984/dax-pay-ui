<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';

  import { useUserStore } from '@vben/stores';

  import { AuthApi } from '#/api/auth.api';
  import { $t } from '#/locales';
  import { useAuthStore } from '#/store';

  defineOptions({ name: 'Dashboard' });

  const userStore = useUserStore();
  const authStore = useAuthStore();

  const permCount = ref(0);
  const menuCount = ref(0);

  const user = computed(() => userStore.userInfo);

  /** 欢迎语里的用户名，缺省时回退到词条里的“管理员” */
  const displayName = computed(
    () => user.value?.name || user.value?.account || $t('dashboard.defaultName'),
  );

  onMounted(async () => {
    try {
      const { data } = await AuthApi.getPermissionInfo();
      permCount.value = data?.permissions?.length ?? 0;
      const countMenus = (nodes: any[] = []): number =>
        nodes.reduce((sum, node) => sum + 1 + countMenus(node.children ?? []), 0);
      menuCount.value = countMenus(data?.menus ?? []);
    } catch {
      // 首页统计失败不阻断
    }
  });
</script>

<template>
  <div class="dashboard">
    <a-card variant="borderless">
      <div class="welcome">
        <div class="hello">{{ $t('dashboard.hello', { name: displayName }) }}</div>
        <div class="sub">{{ $t('dashboard.sub') }}</div>
      </div>
    </a-card>

    <a-row :gutter="16" class="mt">
      <a-col :span="8">
        <a-card variant="borderless">
          <a-statistic :title="$t('dashboard.roles')" :value="authStore.roles.length" :suffix="$t('dashboard.rolesUnit')" />
          <div class="roles">{{ authStore.roles.join($t('common.listSeparator')) || '—' }}</div>
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card variant="borderless">
          <a-statistic :title="$t('dashboard.permCodes')" :value="permCount" :suffix="$t('dashboard.permUnit')" />
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card variant="borderless">
          <a-statistic :title="$t('dashboard.menuNodes')" :value="menuCount" :suffix="$t('dashboard.menuUnit')" />
        </a-card>
      </a-col>
    </a-row>

    <a-card variant="borderless" class="mt" :title="$t('dashboard.descTitle')">
      <a-descriptions :column="2" size="small">
        <a-descriptions-item :label="$t('dashboard.backend')">{{ $t('dashboard.backendValue') }}</a-descriptions-item>
        <a-descriptions-item :label="$t('dashboard.dataAccess')">{{ $t('dashboard.dataAccessValue') }}</a-descriptions-item>
        <a-descriptions-item :label="$t('dashboard.menuSource')">{{ $t('dashboard.menuSourceValue') }}</a-descriptions-item>
        <a-descriptions-item :label="$t('dashboard.apiDoc')">{{ $t('dashboard.apiDocValue') }}</a-descriptions-item>
      </a-descriptions>
    </a-card>
  </div>
</template>

<style scoped>
  .dashboard {
    padding: 16px;
  }

  .welcome {
    padding: 8px 4px;
  }

  .hello {
    font-size: 20px;
    font-weight: 600;
  }

  .sub {
    margin-top: 6px;
    color: hsl(var(--muted-foreground));
  }

  .roles {
    margin-top: 8px;
    font-size: 12px;
    color: hsl(var(--muted-foreground));
  }

  .mt {
    margin-top: 16px;
  }
</style>
