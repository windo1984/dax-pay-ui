<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLocale } from '../locales'
import { useAuth } from '../store/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuth()
const { t } = useLocale()

const loading = ref(false)
const errorMsg = ref('')

const form = reactive({
  tenantCode: 'fighter',
  clientCode: 'admin',
  username: 'admin',
  password: '',
})

/** 身份域名称跟随基座语言切换 */
const clientOptions = computed(() => [
  { value: 'admin', label: t('clientAdmin') },
  { value: 'merchant', label: t('clientMerchant') },
  { value: 'app', label: t('clientApp') },
  { value: 'gateway', label: t('clientGateway') },
])

async function onSubmit() {
  errorMsg.value = ''
  if (!form.username || !form.password) {
    errorMsg.value = t('errorEmpty')
    return
  }
  loading.value = true
  try {
    await auth.login({ ...form })
    const redirect = route.query.redirect as string | undefined
    await router.replace(redirect ? decodeURIComponent(redirect) : '/')
  }
  catch (error: any) {
    errorMsg.value = error?.message || t('loginFailed')
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-100 px-4">
    <div class="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
      <h1 class="mb-1 text-xl font-bold text-gray-800">{{ t('loginTitle') }}</h1>
      <p class="mb-6 text-sm text-gray-500">{{ t('loginIntro') }}</p>

      <form class="space-y-3" @submit.prevent="onSubmit">
        <div>
          <label class="mb-1 block text-sm text-gray-600">{{ t('tenantCode') }}</label>
          <input
            v-model="form.tenantCode"
            class="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            placeholder="fighter"
          >
        </div>

        <div>
          <label class="mb-1 block text-sm text-gray-600">{{ t('identityDomain') }}</label>
          <select
            v-model="form.clientCode"
            class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
          >
            <option v-for="item in clientOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </option>
          </select>
        </div>

        <div>
          <label class="mb-1 block text-sm text-gray-600">{{ t('loginAccount') }}</label>
          <input
            v-model="form.username"
            class="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            :placeholder="t('accountPlaceholder')"
          >
        </div>

        <div>
          <label class="mb-1 block text-sm text-gray-600">{{ t('password') }}</label>
          <input
            v-model="form.password"
            type="password"
            class="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            :placeholder="t('passwordPlaceholder')"
            @keyup.enter="onSubmit"
          >
        </div>

        <p v-if="errorMsg" class="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{{ errorMsg }}</p>

        <button
          type="submit"
          class="w-full rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="loading"
        >
          {{ loading ? t('loggingIn') : t('login') }}
        </button>
      </form>

      <p class="mt-4 text-xs text-gray-400">{{ t('defaultHint') }}</p>
    </div>
  </div>
</template>
