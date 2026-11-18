<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BaseLayout from './layouts/BaseLayout.vue'

const route = useRoute()
// 登录页独立渲染，不套基座外壳
const isLoginPage = computed(() => route.name === 'login')
</script>

<template>
  <RouterView v-if="isLoginPage" />
  <BaseLayout v-else />
</template>
