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

/** 统一认证一次性凭证：子系统凭它换自己的登录态，避免共享 Sa-Token 会话 */
export interface SsoTicket {
  ticket: string;
  expiresIn: number;
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
  /** 为当前登录用户签发一次性 ticket（打开子系统时现场申请，120 秒内有效且只能用一次） */
  createSsoTicket() {
    return request<SsoTicket>('/auth/sso/ticket', { method: 'POST' });
  },
};
