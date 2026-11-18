import type { CommonResult, PageParam, PageResult } from '#/api/types';

import { requestClient } from '#/api/request';

export interface User {
  id: number;
  tenantId?: number;
  clientCode?: string;
  username: string;
  nickname?: string;
  deptId?: null | number;
  email?: string;
  mobile?: string;
  sex?: number;
  avatar?: string;
  /** 0 开启 / 1 停用 */
  status?: number;
  administrator?: boolean;
  remark?: string;
  loginIp?: string;
  loginDate?: string;
  loginCount?: number;
  createTime?: string;
  roleIds?: number[];
  postIds?: number[];
}

export interface UserPageParam extends PageParam {
  username?: string;
  mobile?: string;
  status?: number;
  deptId?: number;
  clientCode?: string;
}

export interface UserSaveParam {
  id?: number;
  username?: string;
  /** 新增必填；不填则用后端默认初始密码 */
  password?: string;
  nickname?: string;
  deptId?: null | number;
  email?: string;
  mobile?: string;
  sex?: number;
  avatar?: string;
  status?: number;
  remark?: string;
  clientCode?: string;
  roleIds?: number[];
  postIds?: number[];
}

export const UserApi = {
  page(params: UserPageParam) {
    return requestClient.get<CommonResult<PageResult<User>>>('/system/user/page', { params });
  },
  get(id: number) {
    return requestClient.get<CommonResult<User>>('/system/user/get', { params: { id } });
  },
  create(data: UserSaveParam) {
    return requestClient.post<CommonResult<number>>('/system/user/create', data);
  },
  update(data: UserSaveParam) {
    return requestClient.put<CommonResult<boolean>>('/system/user/update', data);
  },
  updateStatus(id: number, status: number) {
    return requestClient.put<CommonResult<boolean>>('/system/user/update-status', null, {
      params: { id, status },
    });
  },
  resetPassword(id: number, password: string) {
    return requestClient.put<CommonResult<boolean>>('/system/user/reset-password', null, {
      params: { id, password },
    });
  },
  delete(id: number) {
    return requestClient.delete<CommonResult<boolean>>('/system/user/delete', { params: { id } });
  },
};
