import type { UserInfo } from '#/api/auth.api';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { defineStore } from 'pinia';

import { AuthApi } from '#/api/auth.api';
import { setRequestIdentity } from '#/api/request';
import { HOME_PATH } from '#/router/routes';

export interface LoginPayload {
  tenantCode: string;
  clientCode: string;
  username: string;
  password: string;
}

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();

  const loginLoading = ref(false);
  /** 当前用户角色码（后端 /auth/permission-info 下发） */
  const roles = ref<string[]>([]);

  function setRoles(value: string[]) {
    roles.value = value ?? [];
  }

  /**
   * 登录：拿 token → 拉用户信息 → 进首页
   * 后端返回 { code, msg, data: { token, tokenName, expiresIn } }
   */
  async function authLogin(payload: LoginPayload, onSuccess?: () => Promise<void> | void) {
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;
      const { data } = await AuthApi.login({
        clientCode: payload.clientCode,
        tenantCode: payload.tenantCode,
        username: payload.username,
        password: payload.password,
      });
      const token = data?.token;
      if (!token) {
        throw new Error('登录失败：未获取到 token');
      }
      accessStore.setAccessToken(token);
      // 身份域与租户随请求头下发
      setRequestIdentity(undefined, payload.clientCode);

      userInfo = await fetchUserInfo();
      accessStore.setIsAccessChecked(false);

      await (onSuccess ? onSuccess() : router.push(HOME_PATH));
    } finally {
      loginLoading.value = false;
    }
    return { userInfo };
  }

  async function logout(redirect = true) {
    try {
      await AuthApi.logout();
    } catch {
      // 退出失败不阻断本地清理
    }
    accessStore.clearTokenFromStorage();
    roles.value = [];
    resetAllStores();
    accessStore.setLoginExpired(false);
    accessStore.setIsAccessChecked(false);

    await router.replace({
      path: LOGIN_PATH,
      query: redirect ? { redirect: encodeURIComponent(router.currentRoute.value.fullPath) } : {},
    });
  }

  async function fetchUserInfo(): Promise<UserInfo> {
    const { data } = await AuthApi.getUserInfo();
    const info: UserInfo = {
      id: data?.id,
      tenantId: data?.tenantId,
      clientCode: data?.clientCode,
      username: data?.username,
      nickname: data?.nickname || data?.username,
      avatar: data?.avatar,
      email: data?.email,
      mobile: data?.mobile,
      sex: data?.sex,
      deptId: data?.deptId,
      administrator: data?.administrator,
      roles: data?.roles,
    };
    setRoles(info.roles ?? []);
    // 还原租户上下文（刷新页面后请求头仍带 tenant-id / clientid）
    setRequestIdentity(info.tenantId, info.clientCode);

    userStore.setUserInfo({
      account: info.username,
      avatar: info.avatar ?? '',
      id: String(info.id),
      name: info.nickname ?? info.username,
    });
    return info;
  }

  function $reset() {
    loginLoading.value = false;
    roles.value = [];
  }

  return {
    $reset,
    authLogin,
    fetchUserInfo,
    loginLoading,
    logout,
    roles,
    setRoles,
  };
});
