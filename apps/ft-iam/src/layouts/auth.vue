<script lang="ts" setup>
  import { computed } from 'vue';

  import { preferences } from '@vben/preferences';

  import { AuthPageLayout } from '@vben/layouts';

  defineOptions({ name: 'FtIamAuthLayout' });

  const appName = computed(() => preferences.app.name);
  const logo = computed(() => preferences.logo.source);
  const logoDark = computed(() => preferences.logo.sourceDark);
</script>

<template>
  <AuthPageLayout :app-name="appName" :logo="logo" :logo-dark="logoDark" page-title="统一用户与权限管理平台" page-description="用户 / 角色 / 菜单 / 部门 / 岗位 / 租户，Sa-Token 鉴权">
    <slot></slot>
  </AuthPageLayout>
</template>
