<script setup lang="ts">
defineProps<{
  name: string
  url: string
  opened: boolean
  active: boolean
}>()
</script>

<template>
  <div v-if="opened" v-show="active" class="h-full w-full">
    <iframe :src="url" class="h-full w-full border-0"></iframe>
  </div>
</template>
