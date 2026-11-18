<script lang="ts" setup>
  defineOptions({ name: 'Forbidden' });
</script>

<template>
  <div class="fallback">
    <a-result status="403" title="403" sub-title="没有访问该页面的权限，请联系管理员分配">
      <template #extra>
        <a-button type="primary" @click="$router.replace('/dashboard')">返回工作台</a-button>
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
