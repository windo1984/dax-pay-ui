<template>
  <div v-if="tabs.length" class="flex items-end gap-1 border-b border-gray-200 bg-white px-3 pt-2">
    <div
      v-for="tab in tabs"
      :key="tab.key"
      class="flex cursor-pointer items-center gap-1.5 rounded-t-md border border-b-0 px-3.5 py-2 text-sm"
      :class="
        tab.key === activeTab
          ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
          : 'border-gray-200 bg-gray-100 text-gray-500 hover:bg-gray-50'
      "
      @click="$emit('select', tab.key)"
    >
      <span class="w-5 text-center">{{ tab.icon }}</span>
      <span>{{ tab.title }}</span>
      <span
        v-if="tab.closable"
        class="flex h-4 w-4 items-center justify-center rounded-full text-base leading-none hover:bg-emerald-100"
        @click.stop="$emit('close', tab.key)"
      >
        ×
      </span>
    </div>
    <button
      v-if="closableCount"
      class="ml-auto mb-1 rounded border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-500 hover:border-red-200 hover:text-red-600"
      @click="$emit('closeAll')"
    >
      全部关闭
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MenuItem } from './AppHeader.vue'

const props = defineProps<{
  tabs: MenuItem[]
  activeTab: string
}>()

defineEmits<{
  (e: 'select', key: string): void
  (e: 'close', key: string): void
  (e: 'closeAll'): void
}>()

const closableCount = computed(() => props.tabs.filter((t) => t.closable).length)
</script>
