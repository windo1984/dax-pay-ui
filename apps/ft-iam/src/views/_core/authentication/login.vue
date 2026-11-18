<script lang="ts" setup>
  import { reactive, ref } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { message } from 'antdv-next';

  import { useAuthStore } from '#/store';

  defineOptions({ name: 'Login' });

  const router = useRouter();
  const route = useRoute();
  const authStore = useAuthStore();

  const loading = ref(false);
  const form = reactive({
    tenantCode: import.meta.env.VITE_APP_TENANT_CODE || 'fighter',
    clientCode: import.meta.env.VITE_APP_CLIENT_CODE || 'admin',
    username: 'admin',
    password: '',
  });

  const clientOptions = [
    { label: '运营端（admin）', value: 'admin' },
    { label: '商户端（merchant）', value: 'merchant' },
    { label: '应用端（app）', value: 'app' },
    { label: '网关（gateway）', value: 'gateway' },
  ];

  async function onSubmit() {
    if (!form.username || !form.password) {
      message.warning('请输入账号和密码');
      return;
    }
    loading.value = true;
    try {
      await authStore.authLogin(
        {
          clientCode: form.clientCode,
          password: form.password,
          tenantCode: form.tenantCode,
          username: form.username,
        },
        async () => {
          const redirect = route.query.redirect as undefined | string;
          await router.replace(redirect ? decodeURIComponent(redirect) : '/dashboard');
        },
      );
      message.success('登录成功');
    } catch (error: any) {
      const msg = error?.response?.data?.msg || error?.msg || error?.message || '登录失败';
      message.error(msg);
    } finally {
      loading.value = false;
    }
  }
</script>

<template>
  <div class="login-wrap">
    <div class="login-title">账号登录</div>
    <a-form :model="form" layout="vertical" @finish="onSubmit">
      <a-form-item label="租户编码" name="tenantCode">
        <a-input v-model:value="form.tenantCode" placeholder="如 fighter" allow-clear />
      </a-form-item>
      <a-form-item label="身份域" name="clientCode">
        <a-select v-model:value="form.clientCode" :options="clientOptions" />
      </a-form-item>
      <a-form-item label="账号" name="username">
        <a-input v-model:value="form.username" placeholder="请输入账号" allow-clear />
      </a-form-item>
      <a-form-item label="密码" name="password">
        <a-input-password v-model:value="form.password" placeholder="请输入密码" @press-enter="onSubmit" />
      </a-form-item>
      <a-button type="primary" block :loading="loading" html-type="submit">登录</a-button>
    </a-form>
    <div class="login-tip">默认账号 admin / admin123，租户 fighter，身份域 admin</div>
  </div>
</template>

<style scoped>
  .login-wrap {
    width: 100%;
    max-width: 380px;
  }

  .login-title {
    margin-bottom: 20px;
    font-size: 20px;
    font-weight: 600;
  }

  .login-tip {
    margin-top: 14px;
    font-size: 12px;
    color: hsl(var(--muted-foreground));
  }
</style>
