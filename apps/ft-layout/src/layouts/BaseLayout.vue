<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MicroPane from '../components/MicroPane.vue'
import { appGroups, flatApps, findApp, findGroupOfApp } from '../config/apps'
import { useAuth } from '../store/auth'

interface MenuItem {
  key: string
  title: string
  icon: string
  closable?: boolean
}

const route = useRoute()
const router = useRouter()
const auth = useAuth()

/** 当前登录用户显示名 */
const userName = computed(
  () => auth.state.userInfo?.nickname || auth.state.userInfo?.username || '',
)
const userRole = computed(() => auth.state.roles.join('、'))
const identity = computed(
  () => `${auth.state.userInfo?.clientCode ?? 'admin'} / 租户 ${auth.state.userInfo?.tenantId ?? '—'}`,
)

/** 退出登录：清本地态并回登录页 */
async function handleLogout() {
  await auth.logout()
  await router.replace({ name: 'login' })
}

const headerHover = ref(false)

// 首页固定标签，其余按注册表生成
const homeTab: MenuItem = { key: 'home', title: '首页', icon: '🏠', closable: false }

const tabMeta: Record<string, MenuItem> = {
  home: homeTab,
  ...Object.fromEntries(
    flatApps.map((app) => [app.key, { key: app.key, title: app.title, icon: app.icon, closable: true }]),
  ),
}

const tabs = ref<MenuItem[]>([homeTab])
const activeTab = ref('home')
const opened = ref<string[]>(['home'])

const closableCount = computed(() => tabs.value.filter((t) => t.closable).length)
const closableTabs = computed(() => tabs.value.filter((t) => t.key !== 'home'))

/** 当前子应用所属分组（顶栏面包屑式提示） */
const currentGroup = computed(() => findGroupOfApp(activeTab.value))

function ensureTab(key: string) {
  if (!tabs.value.find((t) => t.key === key)) {
    tabs.value.push(tabMeta[key])
  }
  if (!opened.value.includes(key)) {
    opened.value.push(key)
  }
  activeTab.value = key
}

ensureTab((route.name as string) || 'home')

watch(
  () => route.name,
  (name) => {
    const key = (name as string) || 'home'
    if (tabMeta[key]) ensureTab(key)
  },
)

function openTab(path: string) {
  const key = path.replace(/^\//, '')
  const target = key === '' ? 'home' : key
  if (tabMeta[target]) ensureTab(target)
  router.push({ path: key === '' ? '/' : `/${key}` })
}

function switchTab(key: string) {
  activeTab.value = key
  router.push({ path: key === 'home' ? '/' : `/${key}` })
}

function closeTab(key: string) {
  const idx = tabs.value.findIndex((t) => t.key === key)
  tabs.value = tabs.value.filter((t) => t.key !== key)
  if (activeTab.value === key) {
    const next = tabs.value[idx - 1]?.key || tabs.value[tabs.value.length - 1]?.key || 'home'
    activeTab.value = next
    router.replace({ path: next === 'home' ? '/' : `/${next}` })
  }
}

function closeAll() {
  tabs.value = tabs.value.filter((t) => !t.closable)
  activeTab.value = 'home'
  router.replace({ path: '/' })
}

function reloadActive() {
  const iframes = Array.from(document.querySelectorAll('iframe'))
  const current = iframes.find((f) => f.offsetParent !== null)
  if (current?.contentWindow) current.contentWindow.location.reload()
}
</script>

<template>
  <div class="flex h-screen flex-col">
    <header class="flex items-center gap-3 border-b border-gray-200 bg-white px-4 shadow-sm">
      <button
        class="flex h-8 w-8 items-center justify-center rounded text-lg text-gray-600 hover:bg-gray-100"
        title="刷新当前页"
        @click="reloadActive"
      >
        ⟳
      </button>

      <nav class="flex h-12 items-center">
        <!-- 分组菜单：hover ☰ 弹出，按 IAM / DaxPay / Yudao 分组 -->
        <div
          class="relative flex h-full items-center"
          @mouseenter="headerHover = true"
          @mouseleave="headerHover = false"
        >
          <button
            class="flex h-full items-center gap-2 px-3 text-base text-gray-700 hover:bg-gray-100"
            :class="headerHover ? 'bg-emerald-50 text-emerald-600' : ''"
          >
            <span>☰</span>
            <span class="text-sm">{{ currentGroup?.title ?? '全部应用' }}</span>
          </button>
          <transition
            enter-active-class="transition duration-150"
            enter-from-class="opacity-0"
            leave-active-class="transition duration-150"
            leave-to-class="opacity-0"
          >
            <div
              v-if="headerHover"
              class="absolute left-0 top-12 z-50 w-64 rounded border border-gray-200 bg-white py-1 shadow-lg"
            >
              <div v-for="group in appGroups" :key="group.key" class="py-1">
                <div
                  class="flex items-center gap-2 border-b border-gray-100 px-4 pb-1 text-xs font-medium uppercase tracking-wide text-gray-400"
                >
                  <span>{{ group.icon }}</span>
                  <span>{{ group.title }}</span>
                </div>
                <div
                  v-for="app in group.apps"
                  :key="app.key"
                  class="flex cursor-pointer items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  :class="app.key === activeTab ? 'text-emerald-600' : ''"
                  @click="openTab(app.path)"
                >
                  <span class="w-5 text-center">{{ app.icon }}</span>
                  <span class="flex-1">{{ app.title }}</span>
                  <span v-if="app.key === activeTab" class="text-[11px] text-emerald-600">当前</span>
                </div>
              </div>
            </div>
          </transition>
        </div>

        <!-- 首页 -->
        <button
          class="flex h-full items-center gap-1.5 px-3 text-sm text-gray-700 hover:bg-gray-100"
          :class="activeTab === 'home' ? 'bg-emerald-50 text-emerald-600' : ''"
          @click="openTab('/')"
        >
          <span>🏠</span>
          <span>首页</span>
        </button>
      </nav>

      <!-- Tab 栏 -->
      <div class="ml-3 flex h-12 flex-1 items-center gap-1.5 overflow-x-auto border-l-2 border-gray-300 pl-3">
        <div
          v-for="tab in closableTabs"
          :key="tab.key"
          class="flex shrink-0 cursor-pointer items-center gap-1.5 rounded border px-3 py-1 text-sm"
          :class="
            tab.key === activeTab
              ? 'border-emerald-300 bg-emerald-50 text-emerald-600'
              : 'border-gray-200 bg-gray-100 text-gray-500 hover:bg-gray-50'
          "
          @click="switchTab(tab.key)"
        >
          <span class="w-5 text-center">{{ tab.icon }}</span>
          <span>{{ tab.title }}</span>
          <span
            v-if="tab.closable"
            class="flex h-4 w-4 items-center justify-center rounded-full text-base leading-none hover:bg-emerald-100"
            @click.stop="closeTab(tab.key)"
          >
            ×
          </span>
        </div>
      </div>

      <button
        v-if="closableCount"
        class="ml-2 shrink-0 rounded border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-500 hover:border-red-200 hover:text-red-600"
        @click="closeAll"
      >
        全部关闭
      </button>

      <!-- 登录用户与退出 -->
      <div class="ml-auto flex shrink-0 items-center gap-3 border-l-2 border-gray-300 pl-3">
        <div class="text-right leading-tight">
          <div class="text-sm font-medium text-gray-800">{{ userName || '已登录' }}</div>
          <div class="text-[11px] text-gray-400">
            {{ identity }}<span v-if="userRole"> · {{ userRole }}</span>
          </div>
        </div>
        <button
          class="rounded border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-500 hover:border-red-200 hover:text-red-600"
          @click="handleLogout"
        >
          退出登录
        </button>
      </div>
    </header>

    <main class="flex flex-1 flex-col overflow-hidden">
      <div class="flex-1 overflow-hidden bg-white">
        <!-- 首页：按分组展示应用入口 -->
        <div v-show="activeTab === 'home'" class="h-full overflow-auto p-6">
          <h2 class="mb-1 text-xl font-bold">欢迎使用 Fighter 微前端基座</h2>
          <p class="text-gray-600">
            顶部 ☰ hover 按产品线展开子应用，点击后以 Tab 形式打开，多 Tab 可并存；未登录仅能停留在登录页。
          </p>

          <div v-for="group in appGroups" :key="group.key" class="mt-6">
            <div class="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
              <span>{{ group.icon }}</span>
              <span>{{ group.title }}</span>
              <span class="text-xs font-normal text-gray-400">{{ group.apps.length }} 个应用</span>
            </div>
            <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              <div
                v-for="app in group.apps"
                :key="app.key"
                class="cursor-pointer rounded border border-gray-200 bg-white p-4 hover:border-emerald-300 hover:shadow-sm"
                @click="openTab(app.path)"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 text-sm font-medium text-gray-800">
                    <span>{{ app.icon }}</span>
                    <span>{{ app.title }}</span>
                  </div>
                  <span class="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500">{{ app.path }}</span>
                </div>
                <div class="mt-2 text-xs text-gray-500">{{ app.desc }}</div>
                <div class="mt-1 break-all text-[11px] text-gray-400">{{ app.url }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 子应用容器：全部常驻，按 opened/active 控制显示 -->
        <MicroPane
          v-for="app in flatApps"
          :key="app.key"
          :name="app.key"
          :url="app.url"
          :opened="opened.includes(app.key)"
          :active="activeTab === app.key"
        />
      </div>
    </main>
  </div>
</template>
