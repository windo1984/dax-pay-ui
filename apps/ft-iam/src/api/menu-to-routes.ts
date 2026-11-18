import type { MenuItem } from '#/api/auth.api';
import type { RouteRecordStringComponent } from '@vben/types';

/**
 * 把后端菜单树转换成 Vben 的「字符串组件路由」，供 generateAccessible('backend') 使用。
 *
 * 后端约定（ft-iam iam_menu）：
 * - type=1 目录：path 已是绝对路径（如 /system），无 component，子节点是菜单
 * - type=2 菜单：path 为相对路径（如 user），component 为视图相对路径（如 system/user/index）
 * - type=3 按钮：只作权限标识，不生成路由
 */
const BUTTON_TYPE = 3;
const DIRECTORY_TYPE = 1;

function toMeta(menu: MenuItem) {
  return {
    title: menu.name,
    icon: menu.icon || undefined,
    order: menu.sort ?? 0,
    hideInMenu: menu.visible === false,
    // 目录默认展开
    hideChildrenInMenu: false,
    keepAlive: menu.keepAlive !== false,
    activePath: menu.path || undefined,
    badge: menu.badge || undefined,
    link: menu.link || undefined,
  };
}

function convertNode(menu: MenuItem, isRoot: boolean): null | RouteRecordStringComponent {
  if (menu.type === BUTTON_TYPE || menu.status === 1) {
    return null;
  }

  const children = (menu.children ?? [])
    .map((child) => convertNode(child, false))
    .filter((item): item is RouteRecordStringComponent => item !== null);

  const isDirectory = menu.type === DIRECTORY_TYPE;

  // 目录：必须带绝对 path，作为布局下的一级路由
  if (isDirectory) {
    if (!menu.path) {
      return null;
    }
    const dirPath = menu.path.startsWith('/') ? menu.path : `/${menu.path}`;
    const firstChild = children[0];
    const redirect =
      menu.redirect ||
      (firstChild?.path
        ? firstChild.path.startsWith('/')
          ? firstChild.path
          : `${dirPath}/${firstChild.path}`
        : undefined);

    return {
      name: menu.componentName || `Dir${menu.id}`,
      path: dirPath,
      component: 'BasicLayout',
      redirect,
      meta: toMeta(menu),
      children,
    } as RouteRecordStringComponent;
  }

  // 菜单：必须有 component 才能被解析成页面
  if (!menu.component || !menu.path) {
    return null;
  }
  return {
    name: menu.componentName || `Menu${menu.id}`,
    path: isRoot ? `/${menu.path}` : menu.path,
    component: menu.component,
    meta: toMeta(menu),
    children: children.length > 0 ? children : undefined,
  } as RouteRecordStringComponent;
}

/** 菜单树 → 路由数组（顶层只保留目录/一级菜单） */
export function convertMenuListToRoutes(menus: MenuItem[]): RouteRecordStringComponent[] {
  return (menus ?? [])
    .map((menu) => convertNode(menu, true))
    .filter((item): item is RouteRecordStringComponent => item !== null);
}

/** 从菜单树里提取所有按钮权限码（后端已单独下发 permissions，这里仅作兜底） */
export function collectMenuPermissions(menus: MenuItem[]): string[] {
  const codes: string[] = [];
  const walk = (nodes: MenuItem[]) => {
    for (const node of nodes) {
      if (node.permission) {
        codes.push(node.permission);
      }
      if (node.children?.length) {
        walk(node.children);
      }
    }
  };
  walk(menus ?? []);
  return codes;
}
