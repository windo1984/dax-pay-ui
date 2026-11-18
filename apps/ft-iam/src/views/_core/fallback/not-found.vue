<script lang="ts" setup>
  import { useRouter } from 'vue-router';

  defineOptions({ name: 'NotFound' });

  const router = useRouter();
</script>

<template>
  <div class="fallback">
    <a-result status="404" title="404" :sub-title="$t('_core.fallback.notFound')">
      <template #extra>
        <a-button type="primary" @click="router.replace('/dashboard')">{{ $t('_core.fallback.backToDashboard') }}</a-button>
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
