<script lang="ts" setup>
  import { computed, reactive, ref } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { message } from 'antdv-next';

  import { $t } from '#/locales';
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

  // 身份域文案走词条，语言切换后下拉项立即跟随
  const clientOptions = computed(() => [
    { label: $t('common.clientCode.admin'), value: 'admin' },
    { label: $t('common.clientCode.merchant'), value: 'merchant' },
    { label: $t('common.clientCode.app'), value: 'app' },
    { label: $t('common.clientCode.gateway'), value: 'gateway' },
  ]);

  async function onSubmit() {
    if (!form.username || !form.password) {
      message.warning($t('_core.authentication.msg.required'));
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
      message.success($t('_core.authentication.msg.success'));
    } catch (error: any) {
      const msg = error?.response?.data?.msg || error?.msg || error?.message || $t('_core.authentication.msg.failed');
      message.error(msg);
    } finally {
      loading.value = false;
    }
  }
</script>

<template>
  <div class="login-wrap">
    <div class="login-title">{{ $t('_core.authentication.title') }}</div>
    <a-form :model="form" layout="vertical" @finish="onSubmit">
      <a-form-item :label="$t('_core.authentication.tenantCode')" name="tenantCode">
        <a-input v-model:value="form.tenantCode" :placeholder="$t('_core.authentication.tenantCodePlaceholder')" allow-clear />
      </a-form-item>
      <a-form-item :label="$t('_core.authentication.clientCode')" name="clientCode">
        <a-select v-model:value="form.clientCode" :options="clientOptions" />
      </a-form-item>
      <a-form-item :label="$t('_core.authentication.username')" name="username">
        <a-input v-model:value="form.username" :placeholder="$t('_core.authentication.usernamePlaceholder')" allow-clear />
      </a-form-item>
      <a-form-item :label="$t('_core.authentication.password')" name="password">
        <a-input-password
          v-model:value="form.password"
          :placeholder="$t('_core.authentication.passwordPlaceholder')"
          @press-enter="onSubmit"
        />
      </a-form-item>
      <a-button type="primary" block :loading="loading" html-type="submit">{{ $t('_core.authentication.submit') }}</a-button>
    </a-form>
    <div class="login-tip">{{ $t('_core.authentication.tip') }}</div>
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
