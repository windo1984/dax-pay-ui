import type { CommonResult } from '#/api/types';
import type { MenuItem } from '#/api/auth.api';

import { requestClient } from '#/api/request';

export interface MenuSaveParam {
  id?: number;
  parentId?: number;
  name?: string;
  i18nKey?: string;
  permission?: string;
  /** 1 目录 / 2 菜单 / 3 按钮 */
  type?: number;
  sort?: number;
  path?: string;
  component?: string;
  componentName?: string;
  redirect?: string;
  icon?: string;
  status?: number;
  visible?: boolean;
  keepAlive?: boolean;
  alwaysShow?: boolean;
  badge?: string;
  link?: string;
  remark?: string;
  clientCode?: string;
}

export interface MenuListParam {
  name?: string;
  status?: number;
  clientCode?: string;
}

export const MenuApi = {
  /** 完整菜单树（含按钮），用于菜单管理 */
  list(params?: MenuListParam) {
    return requestClient.get<CommonResult<MenuItem[]>>('/system/menu/list', { params });
  },
  /** 精简菜单树（下发路由用） */
  simpleList(params?: MenuListParam) {
    return requestClient.get<CommonResult<MenuItem[]>>('/system/menu/simple-list', { params });
  },
  get(id: number) {
    return requestClient.get<CommonResult<MenuItem>>('/system/menu/get', { params: { id } });
  },
  create(data: MenuSaveParam) {
    return requestClient.post<CommonResult<number>>('/system/menu/create', data);
  },
  update(data: MenuSaveParam) {
    return requestClient.put<CommonResult<boolean>>('/system/menu/update', data);
  },
  delete(id: number) {
    return requestClient.delete<CommonResult<boolean>>('/system/menu/delete', { params: { id } });
  },
};
