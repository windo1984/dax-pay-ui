<script lang="ts" setup>
  defineOptions({ name: 'Forbidden' });
</script>

<template>
  <div class="fallback">
    <a-result status="403" title="403" :sub-title="$t('_core.fallback.forbidden')">
      <template #extra>
        <a-button type="primary" @click="$router.replace('/dashboard')">{{ $t('_core.fallback.backToDashboard') }}</a-button>
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
