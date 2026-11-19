<script lang="ts" setup>
  /**
   * 顶栏用户下拉（对齐 daxpay-admin 的 widgets/user-dropdown）：
   * - 头像 + 昵称
   * - 使用文档、退出登录
   * - 退出登录必须先二次确认，再触发 logout 事件（真正的登出交给 layout 的 authStore.logout）
   */
  import { computed, ref } from 'vue';

  import { BookOpenText, LogOut } from '@vben/icons';
  import { openWindow } from '@vben/utils';

  import { Modal } from 'antdv-next';

  import { $t } from '#/locales';

  interface Props {
    /** 用户名（取首字作为头像字符） */
    text?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    text: '',
  });

  const emit = defineEmits<{ logout: [] }>();

  /** 接口文档地址：ft-common-swagger 注册在 /swagger-ui/index.html */
  const DOC_URL = '/swagger-ui/index.html';

  const dropdownOpen = ref(false);

  const initial = computed(() => (props.text || '?').slice(0, 1).toUpperCase());

  /** 打开接口文档 */
  function openDocs() {
    openWindow(DOC_URL, { target: '_blank' });
  }

  /** 退出登录：二次确认后触发 logout 事件 */
  function handleLogout() {
    Modal.confirm({
      title: $t('common.prompt'),
      content: $t('ui.widgets.logoutTip'),
      okText: $t('common.confirm'),
      cancelText: $t('common.cancel'),
      okType: 'danger',
      onOk: () => {
        emit('logout');
      },
    });
  }

  /** 菜单项点击统一处理 */
  function handleMenuClick(info: { key: string }) {
    if (info.key === 'docs') {
      openDocs();
    } else if (info.key === 'logout') {
      handleLogout();
    }
    dropdownOpen.value = false;
  }
</script>

<template>
  <a-dropdown
    v-model:open="dropdownOpen"
    :trigger="['click']"
    placement="bottomRight"
  >
    <div class="ft-user-trigger">
      <a-avatar :size="32" class="ft-user-avatar">{{ initial }}</a-avatar>
    </div>
    <template #popupRender>
      <a-menu @click="handleMenuClick">
        <a-menu-item key="user-info" disabled class="!cursor-default !text-foreground">
          <div class="ft-menu-user">
            <a-avatar :size="36" class="ft-user-avatar">{{ initial }}</a-avatar>
            <span class="ft-menu-user-name">{{ text }}</span>
          </div>
        </a-menu-item>
        <a-menu-divider />
        <a-menu-item key="docs">
          <div class="ft-menu-item">
            <BookOpenText class="mr-2 size-4" />
            <span>{{ $t('ui.widgets.document') }}</span>
          </div>
        </a-menu-item>
        <a-menu-divider />
        <a-menu-item key="logout">
          <div class="ft-menu-item">
            <LogOut class="mr-2 size-4" />
            <span>{{ $t('common.logout') }}</span>
          </div>
        </a-menu-item>
      </a-menu>
    </template>
  </a-dropdown>
</template>

<style scoped>
  .ft-user-trigger {
    margin-right: 8px;
    margin-left: 4px;
    padding: 4px;
    cursor: pointer;
    border-radius: 9999px;
  }

  .ft-user-trigger:hover {
    background: hsl(var(--accent));
  }

  .ft-user-avatar {
    font-weight: 500;
  }

  .ft-menu-user {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .ft-menu-user-name {
    font-size: 14px;
    font-weight: 500;
  }

  .ft-menu-item {
    display: flex;
    align-items: center;
  }
</style>
