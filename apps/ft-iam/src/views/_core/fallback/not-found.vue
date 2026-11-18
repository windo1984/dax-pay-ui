<script lang="ts" setup>
  import { useRouter } from 'vue-router';

  defineOptions({ name: 'NotFound' });

  const router = useRouter();
</script>

<template>
  <div class="fallback">
    <a-result status="404" title="404" sub-title="抱歉，你访问的页面不存在">
      <template #extra>
        <a-button type="primary" @click="router.replace('/dashboard')">返回工作台</a-button>
      </template>
    </a-result>
  </div>
</template>

<style scoped>
  .fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
  }
</style>
