<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import { useLocale } from '../locales'
import { useAppearance } from '../store/appearance'

const props = defineProps<{
  userAccount: string
  userName: string
  userRole: string
  identity: string
}>()

const emit = defineEmits<{ logout: [] }>()

const appearance = useAppearance()
const { locale, t } = useLocale()
const openMenu = ref<null | string>(null)

/** 英文界面显示账号（昵称通常是中文），中文界面显示昵称 */
const displayName = computed(() => {
  if (locale.value === 'en-US') {
    return props.userAccount || props.userName
  }
  return props.userName || props.userAccount
})

const avatarText = computed(() => (displayName.value || 'U').slice(0, 1).toUpperCase())
const isDark = computed(() => appearance.state.theme === 'dark')

function toggleMenu(name: string, event: MouseEvent) {
  event.stopPropagation()
  openMenu.value = openMenu.value === name ? null : name
}

function closeAll() {
  openMenu.value = null
}

function pickTheme(mode: 'dark' | 'light') {
  appearance.setTheme(mode)
  openMenu.value = null
}

function pickLocale(locale: string) {
  appearance.setLocale(locale)
  openMenu.value = null
}

function pickTimezone(timezone: string) {
  appearance.setTimezone(timezone)
  openMenu.value = null
}

async function toggleFullscreen() {
  if (document.fullscreenElement) {
    await document.exitFullscreen()
  }
  else {
    await document.documentElement.requestFullscreen()
  }
}

onMounted(() => document.addEventListener('click', closeAll))
onBeforeUnmount(() => document.removeEventListener('click', closeAll))
</script>

<template>
  <div class="relative flex h-full items-center gap-0.5 pr-1" @click.stop>
    <!-- 设置 -->
    <button
      class="flex h-8 w-8 items-center justify-center rounded text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
      :title="t('settings')"
      @click="toggleMenu('settings', $event)"
    >
      <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="1.6">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
      </svg>
    </button>

    <!-- 主题 -->
    <button
      class="flex h-8 w-8 items-center justify-center rounded text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
      :title="isDark ? t('toLight') : t('toDark')"
      @click="appearance.toggleTheme()"
    >
      <svg v-if="isDark" viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="1.6">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4" />
      </svg>
      <svg v-else viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="1.6">
        <path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9Z" />
      </svg>
    </button>

    <!-- 语言 -->
    <div class="relative">
      <button
        class="flex h-8 items-center gap-1 rounded px-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        :title="t('language')"
        @click="toggleMenu('locale', $event)"
      >
        <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="1.6">
          <path d="m5 8 6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6" />
        </svg>
        <span class="text-xs">{{ appearance.localeLabels[appearance.state.locale] ?? appearance.state.locale }}</span>
      </button>
      <div
        v-if="openMenu === 'locale'"
        class="absolute right-0 top-9 z-50 w-36 rounded border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
      >
        <div
          v-for="(label, value) in appearance.localeLabels"
          :key="value"
          class="flex cursor-pointer items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
          @click="pickLocale(value)"
        >
          <span>{{ label }}</span>
          <span v-if="appearance.state.locale === value" class="text-emerald-600">✓</span>
        </div>
      </div>
    </div>

    <!-- 时区 -->
    <div class="relative">
      <button
        class="flex h-8 items-center gap-1 rounded px-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        :title="t('timezoneLabel', { tz: appearance.state.timezone })"
        @click="toggleMenu('timezone', $event)"
      >
        <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="1.6">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2M3 12h18" />
        </svg>
      </button>
      <div
        v-if="openMenu === 'timezone'"
        class="absolute right-0 top-9 z-50 max-h-72 w-48 overflow-auto rounded border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
      >
        <div
          v-for="tz in appearance.timezones"
          :key="tz"
          class="flex cursor-pointer items-center justify-between px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
          @click="pickTimezone(tz)"
        >
          <span>{{ tz }}</span>
          <span v-if="appearance.state.timezone === tz" class="text-emerald-600">✓</span>
        </div>
      </div>
    </div>

    <!-- 全屏 -->
    <button
      class="flex h-8 w-8 items-center justify-center rounded text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
      :title="t('fullscreen')"
      @click="toggleFullscreen"
    >
      <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="1.6">
        <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
      </svg>
    </button>

    <!-- 头像 -->
    <div class="relative ml-1">
      <button
        class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-sm font-medium text-gray-700 dark:bg-gray-600 dark:text-gray-100"
        :title="displayName"
        @click="toggleMenu('user', $event)"
      >
        {{ avatarText }}
      </button>
      <div
        v-if="openMenu === 'user'"
        class="absolute right-0 top-10 z-50 w-52 rounded border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800"
      >
        <div class="border-b border-gray-100 px-2 pb-2 dark:border-gray-700">
          <div class="text-sm font-medium text-gray-800 dark:text-gray-100">{{ displayName }}</div>
          <div class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ userRole || '—' }}</div>
          <div class="text-xs text-gray-400 dark:text-gray-500">{{ identity }}</div>
        </div>
        <button
          class="mt-1 flex w-full items-center gap-2 rounded px-2 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
          @click="emit('logout')"
        >
          {{ t('logout') }}
        </button>
      </div>
    </div>

    <!-- 设置面板 -->
    <div
      v-if="openMenu === 'settings'"
      class="absolute right-0 top-9 z-50 w-64 rounded border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800"
    >
      <div class="mb-2 text-sm font-medium text-gray-800 dark:text-gray-100">{{ t('appearance') }}</div>

      <div class="mb-1 text-xs text-gray-500 dark:text-gray-400">{{ t('theme') }}</div>
      <div class="mb-3 flex gap-2">
        <button
          class="flex-1 rounded border px-2 py-1.5 text-xs"
          :class="!isDark ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-300'"
          @click="pickTheme('light')"
        >
          {{ t('light') }}
        </button>
        <button
          class="flex-1 rounded border px-2 py-1.5 text-xs"
          :class="isDark ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-300'"
          @click="pickTheme('dark')"
        >
          {{ t('dark') }}
        </button>
      </div>

      <div class="mb-1 text-xs text-gray-500 dark:text-gray-400">{{ t('language') }}</div>
      <div class="mb-3 flex gap-2">
        <button
          v-for="(label, value) in appearance.localeLabels"
          :key="value"
          class="flex-1 rounded border px-2 py-1.5 text-xs"
          :class="appearance.state.locale === value ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-300'"
          @click="pickLocale(value)"
        >
          {{ label }}
        </button>
      </div>

      <div class="mb-1 text-xs text-gray-500 dark:text-gray-400">{{ t('timezone') }}</div>
      <select
        :value="appearance.state.timezone"
        class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
        @change="pickTimezone(($event.target as HTMLSelectElement).value)"
      >
        <option v-for="tz in appearance.timezones" :key="tz" :value="tz">{{ tz }}</option>
      </select>

      <div class="mt-3 text-[11px] leading-4 text-gray-400 dark:text-gray-500">
        {{ t('syncHint') }}
      </div>
    </div>
  </div>
</template>
