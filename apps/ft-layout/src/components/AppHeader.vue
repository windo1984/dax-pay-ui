<template>
  <header class="flex h-12 items-center border-b border-gray-200 bg-white px-4 shadow-sm">
    <button
      class="mr-4 flex h-8 w-8 items-center justify-center rounded text-lg text-gray-600 hover:bg-gray-100"
      title="刷新当前页"
      @click="$emit('refresh')"
    >
      ⟳
    </button>

    <nav class="flex h-full items-center">
      <div
        class="relative flex h-full items-center"
        @mouseenter="hover = true"
        @mouseleave="hover = false"
      >
        <button
          class="flex h-full items-center px-4 text-base text-gray-700 hover:bg-gray-100"
          :class="hover ? 'bg-emerald-50 text-emerald-600' : ''"
        >
          ☰
        </button>
        <transition
          enter-active-class="transition duration-150"
          enter-from-class="opacity-0"
          leave-active-class="transition duration-150"
          leave-to-class="opacity-0"
        >
          <div
            v-if="hover"
            class="absolute left-0 top-12 z-50 min-w-48 rounded border border-gray-200 bg-white py-1 shadow-lg"
          >
            <div
              v-for="item in appMenu"
              :key="item.key"
              class="flex cursor-pointer items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100"
              :class="item.key === activeTab ? 'text-emerald-600' : ''"
              @click="$emit('select', item)"
            >
              <span class="w-5 text-center">{{ item.icon }}</span>
              <span>{{ item.title }}</span>
            </div>
          </div>
        </transition>
      </div>

      <div class="flex h-full items-center">
        <button
          class="flex h-full items-center gap-1.5 px-4 text-sm text-gray-700 hover:bg-gray-100"
          :class="activeTab === 'home' ? 'bg-emerald-50 text-emerald-600' : ''"
          @click="$emit('select', { key: 'home', title: '首页', icon: '🏠' })"
        >
          <span>🏠</span>
          <span>首页</span>
        </button>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'

export interface MenuItem {
  key: string
  title: string
  icon: string
  closable?: boolean
}

defineProps<{
  appMenu: MenuItem[]
  activeTab: string
}>()

defineEmits<{
  (e: 'select', item: MenuItem): void
  (e: 'refresh'): void
}>()

const hover = ref(false)
</script>
