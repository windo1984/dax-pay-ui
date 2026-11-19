import type { CommonResult } from '#/api/types';

import { requestClient } from '#/api/request';

export interface LoginParam {
  /** 租户 ID（与 tenantCode 二选一，传 code 更直观） */
  tenantId?: number;
  tenantCode?: string;
  /** 身份域：admin / merchant / app / gateway */
  clientCode: string;
  username: string;
  password: string;
}

export interface LoginResp {
  token: string;
  tokenName: string;
  expiresIn: number;
}

export interface UserInfo {
  id: number;
  tenantId: number;
  clientCode: string;
  username: string;
  nickname: string;
  avatar?: string;
  email?: string;
  mobile?: string;
  sex?: number;
  deptId?: number;
  administrator?: boolean;
  roles?: string[];
}

export interface MenuItem {
  id: number;
  tenantId?: number;
  clientCode?: string;
  /** 归属的微应用（iam_micro_app.app_key）；老版本后端不下发该字段 */
  appKey?: string;
  parentId?: number;
  name: string;
  i18nKey?: null | string;
  permission?: string;
  /** 1 目录 / 2 菜单 / 3 按钮 */
  type: number;
  sort?: number;
  path?: null | string;
  component?: null | string;
  componentName?: null | string;
  redirect?: null | string;
  icon?: null | string;
  status?: number;
  visible?: boolean;
  keepAlive?: boolean;
  alwaysShow?: boolean;
  badge?: null | string;
  link?: null | string;
  remark?: null | string;
  createTime?: string;
  children?: MenuItem[];
}

export interface PermissionInfo {
  permissions: string[];
  roles: string[];
  menus: MenuItem[];
}

export const AuthApi = {
  login(data: LoginParam) {
    return requestClient.post<CommonResult<LoginResp>>('/auth/login', data);
  },
  logout() {
    return requestClient.post<CommonResult<void>>('/auth/logout');
  },
  getUserInfo() {
    return requestClient.get<CommonResult<UserInfo>>('/auth/user-info');
  },
  /**
   * 当前用户的权限上下文（权限码 + 角色 + 菜单树）。
   *
   * @param appKey 微应用标识：菜单按 iam_menu.app_key 归属，iam 只取自己那套，
   *               不会把 daxpay / yudao 的内部菜单混进侧边栏。
   */
  getPermissionInfo(appKey = 'iam') {
    return requestClient.get<CommonResult<PermissionInfo>>('/auth/permission-info', {
      params: { appKey },
    });
  },
};
