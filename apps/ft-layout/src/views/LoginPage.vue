<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../store/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuth()

const loading = ref(false)
const errorMsg = ref('')

const form = reactive({
  tenantCode: 'fighter',
  clientCode: 'admin',
  username: 'admin',
  password: '',
})

const clientOptions = [
  { value: 'admin', label: '运营端（admin）' },
  { value: 'merchant', label: '商户端（merchant）' },
  { value: 'app', label: '应用端（app）' },
  { value: 'gateway', label: '网关（gateway）' },
]

async function onSubmit() {
  errorMsg.value = ''
  if (!form.username || !form.password) {
    errorMsg.value = '请输入账号和密码'
    return
  }
  loading.value = true
  try {
    await auth.login({ ...form })
    const redirect = route.query.redirect as string | undefined
    await router.replace(redirect ? decodeURIComponent(redirect) : '/')
  } catch (error: any) {
    errorMsg.value = error?.message || '登录失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-100 px-4">
    <div class="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
      <h1 class="mb-1 text-xl font-bold text-gray-800">Fighter 微前端基座</h1>
      <p class="mb-6 text-sm text-gray-500">登录后可访问各业务端模块</p>

      <form class="space-y-3" @submit.prevent="onSubmit">
        <div>
          <label class="mb-1 block text-sm text-gray-600">租户编码</label>
          <input
            v-model="form.tenantCode"
            class="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            placeholder="如 fighter"
          />
        </div>

        <div>
          <label class="mb-1 block text-sm text-gray-600">身份域</label>
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
          <label class="mb-1 block text-sm text-gray-600">账号</label>
          <input
            v-model="form.username"
            class="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            placeholder="请输入账号"
          />
        </div>

        <div>
          <label class="mb-1 block text-sm text-gray-600">密码</label>
          <input
            v-model="form.password"
            type="password"
            class="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            placeholder="请输入密码"
            @keyup.enter="onSubmit"
          />
        </div>

        <p v-if="errorMsg" class="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{{ errorMsg }}</p>

        <button
          type="submit"
          class="w-full rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="loading"
        >
          {{ loading ? '登录中…' : '登录' }}
        </button>
      </form>

      <p class="mt-4 text-xs text-gray-400">默认账号 admin / admin123，租户 fighter，身份域 admin</p>
    </div>
  </div>
</template>
