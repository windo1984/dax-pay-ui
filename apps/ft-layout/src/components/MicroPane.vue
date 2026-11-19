<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  name: string
  url: string
  opened: boolean
  active: boolean
  /** 基座登录态 token：子应用与基座不同 origin，localStorage 无法共享，只能通过 URL 传过去 */
  token?: string
  /**
   * 统一认证一次性 ticket：需要自己会话的子应用（daxpay / yudao）用它换本应用 token，
   * 而不是直接复用 iam 的 token —— 两套 Sa-Token 会话互不通用
   */
  ticket?: string
  /** 租户 ID：子应用请求头 tenant-id 需要，缺失时后端回落默认租户 */
  tenantId?: number | string
  /** 身份域：子应用请求头 clientid 需要 */
  clientCode?: string
  /**
   * 渲染模式
   * - iframe（默认）：子应用是"整页布局"应用（Vben / daxpay 都用 100vh + fixed 顶栏），
   *   必须放进独立视口才能自适应容器；否则其 100vh 相对主视口，会盖住基座顶栏
   * - micro：子应用已接入 micro-app 协议（window.microApp 生命周期、ESM 也需 umd 兼容）时启用
   */
  mode?: 'iframe' | 'micro'
}>()

/**
 * 子应用真实加载地址
 * - 追加 ?token=&tenantId=&clientCode=（iam 类子应用直接复用 iam token，见 ft-iam/src/bootstrap.ts）
 * - 追加 ?ticket=（自持会话的子应用，如 daxpay-admin / yudao，见各自 adopt-sso-ticket）
 */
const appUrl = computed(() => {
  try {
    const u = new URL(props.url)
    if (props.ticket) {
      u.searchParams.set('ticket', props.ticket)
    }
    if (props.token) {
      u.searchParams.set('token', props.token)
    }
    if (props.tenantId !== undefined && props.tenantId !== null && props.tenantId !== '') {
      u.searchParams.set('tenantId', String(props.tenantId))
    }
    if (props.clientCode) {
      u.searchParams.set('clientCode', props.clientCode)
    }
    return u.toString()
  } catch {
    return props.url
  }
})

const mode = computed(() => props.mode ?? 'iframe')
</script>

<template>
  <div v-if="opened" v-show="active" class="h-full w-full">
    <iframe
      v-if="mode === 'iframe'"
      :src="appUrl"
      class="block h-full w-full border-0"
      :title="name"
    ></iframe>

    <!--
      接入 micro-app 协议的子应用走这里。
      relative 必须保留：micro-app 会把子应用挂到最近的定位祖先，缺了它会相对 body 布局
    -->
    <micro-app
      v-else
      :name="name"
      :url="appUrl"
      class="relative block h-full w-full"
    ></micro-app>
  </div>
</template>
