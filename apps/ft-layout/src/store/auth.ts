import { reactive } from 'vue';

import { AuthApi, type LoginParam, type UserInfo } from '../api/auth';
import {
  getStoredIdentity,
  getStoredToken,
  setStoredIdentity,
  setStoredToken,
} from '../api/request';

/**
 * 登录态（不引 pinia，保持基座依赖最小化）
 * - token 与身份域落 localStorage，刷新后免登录
 * - userInfo / permissions 只在内存，页面刷新由守卫重新拉取
 */
interface AuthState {
  token: string;
  userInfo: null | UserInfo;
  roles: string[];
  permissions: string[];
  /** 是否已尝试过用本地 token 拉用户信息 */
  loaded: boolean;
}

const state = reactive<AuthState>({
  token: getStoredToken(),
  userInfo: null,
  roles: [],
  permissions: [],
  loaded: false,
});

function setToken(token: string) {
  state.token = token;
  setStoredToken(token);
}

async function login(payload: LoginParam): Promise<UserInfo> {
  const resp = await AuthApi.login(payload);
  if (!resp?.token) {
    throw new Error('登录失败：未获取到 token');
  }
  setToken(resp.token);
  setStoredIdentity({ clientCode: payload.clientCode, tenantCode: payload.tenantCode });
  return await loadUserInfo();
}

/** 拉取用户信息 + 权限码；401 会清空 token 并抛出 */
async function loadUserInfo(): Promise<UserInfo> {
  const info = await AuthApi.getUserInfo();
  state.userInfo = info;
  state.roles = info.roles ?? [];
  state.loaded = true;
  // 服务端回填真实租户，保证后续请求头一致
  setStoredIdentity({
    clientCode: info.clientCode ?? getStoredIdentity().clientCode,
    tenantCode: getStoredIdentity().tenantCode,
    tenantId: info.tenantId,
  });

  try {
    const permission = await AuthApi.getPermissionInfo();
    state.permissions = permission?.permissions ?? [];
    if (permission?.roles?.length) {
      state.roles = permission.roles;
    }
  } catch {
    // 权限拉取失败不阻断进入基座，按钮级控制按角色兜底
    state.permissions = [];
  }
  return info;
}

async function logout(notifyServer = true) {
  if (notifyServer && state.token) {
    try {
      await AuthApi.logout();
    } catch {
      // 服务端登出失败不影响本地清理
    }
  }
  setToken('');
  setStoredIdentity({});
  state.userInfo = null;
  state.roles = [];
  state.permissions = [];
  state.loaded = false;
}

function hasPermission(code?: string): boolean {
  if (!code) {
    return true;
  }
  if (state.userInfo?.administrator || state.roles.includes('super_admin')) {
    return true;
  }
  return state.permissions.includes(code);
}

export function useAuth() {
  return {
    state,
    login,
    logout,
    loadUserInfo,
    hasPermission,
  };
}
