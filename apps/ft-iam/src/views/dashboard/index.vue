<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';

  import { useUserStore } from '@vben/stores';

  import { AuthApi } from '#/api/auth.api';
  import { useAuthStore } from '#/store';

  defineOptions({ name: 'Dashboard' });

  const userStore = useUserStore();
  const authStore = useAuthStore();

  const permCount = ref(0);
  const menuCount = ref(0);

  const user = computed(() => userStore.userInfo);

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
    <a-card :bordered="false">
      <div class="welcome">
        <div class="hello">你好，{{ user?.name || user?.account || '管理员' }}</div>
        <div class="sub">欢迎使用 Fighter IAM · 统一用户与权限管理平台</div>
      </div>
    </a-card>

    <a-row :gutter="16" class="mt">
      <a-col :span="8">
        <a-card :bordered="false">
          <a-statistic title="当前角色" :value="authStore.roles.length" suffix="个" />
          <div class="roles">{{ authStore.roles.join('、') || '—' }}</div>
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card :bordered="false">
          <a-statistic title="可访问权限码" :value="permCount" suffix="条" />
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card :bordered="false">
          <a-statistic title="可见菜单节点" :value="menuCount" suffix="个" />
        </a-card>
      </a-col>
    </a-row>

    <a-card :bordered="false" class="mt" title="说明">
      <a-descriptions :column="2" size="small">
        <a-descriptions-item label="后端服务">ft-iam（端口 19310，Sa-Token 鉴权）</a-descriptions-item>
        <a-descriptions-item label="数据访问">MyBatis-Plus + MyBatis-Plus-Join（MySQL / PostgreSQL 双库）</a-descriptions-item>
        <a-descriptions-item label="菜单来源">GET /auth/permission-info（后端权限驱动路由）</a-descriptions-item>
        <a-descriptions-item label="接口文档">/swagger-ui/index.html（需后端 FT_SWAGGER_ENABLED=true）</a-descriptions-item>
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
