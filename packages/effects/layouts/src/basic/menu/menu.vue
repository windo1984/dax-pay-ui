<script lang="ts" setup>
import type { MenuRecordRaw } from '@vben/types';

import type { MenuProps } from '@vben-core/menu-ui';

import { computed } from 'vue';

import { Menu } from '@vben-core/menu-ui';

interface Props extends MenuProps {
  menus?: MenuRecordRaw[];
}

const props = withDefaults(defineProps<Props>(), {
  accordion: true,
  menus: () => [],
});

/**
 * 默认展开一级菜单：把带子菜单的顶层项交给 Menu 作为初始 openedMenus。
 * 折叠态与水平（顶部）菜单不展开，避免出现弹层。
 */
const defaultOpeneds = computed(() => {
  if (props.collapse || props.mode === 'horizontal') {
    return [];
  }
  return (props.menus ?? [])
    .filter((menu) => (menu.children?.length ?? 0) > 0)
    .map((menu) => menu.path);
});

const emit = defineEmits<{
  open: [string, string[]];
  select: [string, string?];
}>();

function handleMenuSelect(key: string) {
  emit('select', key, props.mode);
}

function handleMenuOpen(key: string, path: string[]) {
  emit('open', key, path);
}
</script>

<template>
  <Menu
    :accordion="accordion"
    :collapse="collapse"
    :collapse-show-title="collapseShowTitle"
    :default-active="defaultActive"
    :default-openeds="defaultOpeneds"
    :menus="menus"
    :mode="mode"
    :rounded="rounded"
    scroll-to-active
    :theme="theme"
    @open="handleMenuOpen"
    @select="handleMenuSelect"
  />
</template>
