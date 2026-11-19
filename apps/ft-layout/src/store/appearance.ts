/**
 * 基座（ft-layout）统一持有的外观状态：主题 / 语言 / 时区。
 *
 * 子应用是 iframe、与基座不同 origin，localStorage 天然隔离，所以基座只做三件事：
 * 1. 自己持久化到基座 origin 的 localStorage；
 * 2. 切换时 postMessage 给所有已打开的 iframe（子应用监听后改自己的 preferences）；
 * 3. 新 iframe 加载完成后补发一次（见 BaseLayout 的 loaded 事件）。
 */
import { reactive, watch } from 'vue'

export type ThemeMode = 'dark' | 'light'

export interface AppearanceState {
  theme: ThemeMode
  locale: string
  timezone: string
}

const STORAGE_KEY = 'ft-layout:appearance'

const DEFAULTS: AppearanceState = {
  theme: 'light',
  locale: 'zh-CN',
  timezone: 'Asia/Shanghai',
}

const LOCALE_LABELS: Record<string, string> = {
  'zh-CN': '简体中文',
  'en-US': 'English',
}

const TIMEZONES = [
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Asia/Taipei',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Bangkok',
  'Asia/Jakarta',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Europe/London',
  'Europe/Paris',
  'Europe/Moscow',
  'America/New_York',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Australia/Sydney',
  'UTC',
]

function loadFromCache(): AppearanceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { ...DEFAULTS }
    }
    return { ...DEFAULTS, ...JSON.parse(raw) } as AppearanceState
  }
  catch {
    return { ...DEFAULTS }
  }
}

const state = reactive<AppearanceState>(loadFromCache())

/** 基座自己的主题：直接切根节点 class（tailwind 的 dark 模式按 class 生效） */
function applyTheme(mode: ThemeMode) {
  const root = document.documentElement
  root.classList.toggle('dark', mode === 'dark')
  root.style.colorScheme = mode
}

/** 给当前打开的所有 iframe 广播一次外观状态 */
function pushToFrames() {
  const payload = { theme: state.theme, locale: state.locale, timezone: state.timezone }
  document.querySelectorAll('iframe').forEach((frame) => {
    try {
      const target = new URL(frame.src).origin
      frame.contentWindow?.postMessage({ source: 'ft-layout', type: 'appearance', payload }, target)
    }
    catch {
      // src 还没就绪时跳过
    }
  })
}

watch(
  state,
  (value) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    applyTheme(value.theme)
    pushToFrames()
  },
  { deep: true, immediate: true },
)

function setTheme(mode: ThemeMode) {
  state.theme = mode
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark'
}

function setLocale(locale: string) {
  state.locale = locale
}

function setTimezone(timezone: string) {
  state.timezone = timezone
}

/** 恢复到默认（登录页等场景可用） */
function resetAppearance() {
  Object.assign(state, DEFAULTS)
}

export function useAppearance() {
  return {
    state,
    localeLabels: LOCALE_LABELS,
    timezones: TIMEZONES,
    setTheme,
    toggleTheme,
    setLocale,
    setTimezone,
    pushToFrames,
    resetAppearance,
  }
}

export { applyTheme, pushToFrames }
