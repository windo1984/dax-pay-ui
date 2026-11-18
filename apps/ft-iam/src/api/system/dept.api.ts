import type { CommonResult } from '#/api/types';

import { requestClient } from '#/api/request';

export interface Dept {
  id: number;
  tenantId?: number;
  parentId?: number;
  name: string;
  sort?: number;
  leaderUserId?: null | number;
  phone?: string;
  email?: string;
  status?: number;
  createTime?: string;
  children?: Dept[];
}

export interface DeptSaveParam {
  id?: number;
  parentId?: number;
  name?: string;
  sort?: number;
  leaderUserId?: null | number;
  phone?: string;
  email?: string;
  status?: number;
}

export interface DeptListParam {
  name?: string;
  status?: number;
}

export const DeptApi = {
  /** 部门树（含停用节点） */
  list(params?: DeptListParam) {
    return requestClient.get<CommonResult<Dept[]>>('/system/dept/list', { params });
  },
  simpleList() {
    return requestClient.get<CommonResult<Dept[]>>('/system/dept/simple-list');
  },
  get(id: number) {
    return requestClient.get<CommonResult<Dept>>('/system/dept/get', { params: { id } });
  },
  create(data: DeptSaveParam) {
    return requestClient.post<CommonResult<number>>('/system/dept/create', data);
  },
  update(data: DeptSaveParam) {
    return requestClient.put<CommonResult<boolean>>('/system/dept/update', data);
  },
  delete(id: number) {
    return requestClient.delete<CommonResult<boolean>>('/system/dept/delete', { params: { id } });
  },
};
