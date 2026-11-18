import type { CommonResult, PageParam, PageResult } from '#/api/types';

import { requestClient } from '#/api/request';

export interface Role {
  id: number;
  tenantId?: number;
  clientCode?: string;
  name: string;
  code: string;
  sort?: number;
  /** 1 全部 / 2 本部门及子部门 / 3 本部门 / 4 仅本人 / 5 自定义 */
  dataScope?: number;
  dataScopeDeptIds?: number[];
  status?: number;
  /** 1 内置 / 2 自定义 */
  type?: number;
  internal?: boolean;
  remark?: string;
  createTime?: string;
  menuIds?: number[];
}

export interface RolePageParam extends PageParam {
  name?: string;
  code?: string;
  status?: number;
  clientCode?: string;
}

export interface RoleSaveParam {
  id?: number;
  name?: string;
  code?: string;
  sort?: number;
  dataScope?: number;
  dataScopeDeptIds?: number[];
  status?: number;
  type?: number;
  remark?: string;
  clientCode?: string;
  menuIds?: number[];
}

export const RoleApi = {
  page(params: RolePageParam) {
    return requestClient.get<CommonResult<PageResult<Role>>>('/system/role/page', { params });
  },
  get(id: number) {
    return requestClient.get<CommonResult<Role>>('/system/role/get', { params: { id } });
  },
  simpleList() {
    return requestClient.get<CommonResult<Role[]>>('/system/role/simple-list');
  },
  create(data: RoleSaveParam) {
    return requestClient.post<CommonResult<number>>('/system/role/create', data);
  },
  update(data: RoleSaveParam) {
    return requestClient.put<CommonResult<boolean>>('/system/role/update', data);
  },
  updateStatus(id: number, status: number) {
    return requestClient.put<CommonResult<boolean>>('/system/role/update-status', null, {
      params: { id, status },
    });
  },
  /** 菜单授权：body 为菜单 ID 数组 */
  assignMenu(roleId: number, menuIds: number[]) {
    return requestClient.put<CommonResult<boolean>>('/system/role/assign-menu', menuIds, {
      params: { roleId },
    });
  },
  delete(id: number) {
    return requestClient.delete<CommonResult<boolean>>('/system/role/delete', { params: { id } });
  },
};
