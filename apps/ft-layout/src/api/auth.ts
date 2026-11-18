import { request } from './request';

export interface LoginParam {
  tenantCode: string;
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
  tenantId?: number;
  clientCode?: string;
  username: string;
  nickname?: string;
  avatar?: string;
  email?: string;
  mobile?: string;
  administrator?: boolean;
  roles?: string[];
}

export interface PermissionInfo {
  permissions: string[];
  roles: string[];
  menus: any[];
}

/** ft-iam 鉴权接口（端口 19310，Sa-Token） */
export const AuthApi = {
  login(data: LoginParam) {
    return request<LoginResp>('/auth/login', { auth: false, body: data, method: 'POST' });
  },
  logout() {
    return request<boolean>('/auth/logout', { method: 'POST' });
  },
  getUserInfo() {
    return request<UserInfo>('/auth/user-info');
  },
  getPermissionInfo() {
    return request<PermissionInfo>('/auth/permission-info');
  },
};
