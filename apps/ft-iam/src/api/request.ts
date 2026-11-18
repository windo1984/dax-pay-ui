/**
 * ft-iam 统一请求客户端
 *
 * - 鉴权头：Accesstoken（与后端 sa-token.token-name 一致，裸 token，不加 Bearer 前缀）
 * - 租户头：tenant-id（后端 TenantContextInterceptor 读取，缺失时回落到默认租户）
 * - 身份域头：clientid（对应后端 ft.iam.clients，与登录时的 clientCode 同源）
 * - 响应体：{ code, msg, data }，code === 0 为成功
 */
import type { RequestClientOptions } from '@vben/request';

import { preferences } from '@vben/preferences';
import {
  authenticateResponseInterceptor,
  defaultResponseInterceptor,
  errorMessageResponseInterceptor,
  RequestClient,
} from '@vben/request';
import { useAccessStore } from '@vben/stores';

import { useAppConfig } from '@vben/hooks';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

/** 当前登录租户（登录成功后由 auth store 写入，刷新页面从 access store 恢复） */
let currentTenantId = '';
let currentClientCode = import.meta.env.VITE_APP_CLIENT_CODE ?? 'admin';

function setRequestIdentity(tenantId?: number | string, clientCode?: string) {
  if (tenantId !== undefined && tenantId !== null && tenantId !== '') {
    currentTenantId = String(tenantId);
  }
  if (clientCode) {
    currentClientCode = clientCode;
  }
}

/** 重新认证：清 token 并回到登录页（由本端注入，避免请求层依赖 router） */
async function doReAuthenticate() {
  const accessStore = useAccessStore();
  accessStore.setAccessToken(null);
  accessStore.setLoginExpired(true);
  accessStore.setIsAccessChecked(false);
}

function makeErrorMessage(error: any): string {
  const data = error?.response?.data;
  if (data && typeof data === 'object') {
    return data.msg || data.message || '请求失败';
  }
  return error?.message || '网络异常，请稍后重试';
}

export { makeErrorMessage };

const clientOptions: RequestClientOptions = {
  baseURL: apiURL,
  responseReturn: 'body',
  timeout: 30_000,
};

const requestClient = new RequestClient(clientOptions);

// 业务响应解析：code === 0 成功，返回 { code, msg, data } 整体交给调用方解构
requestClient.addResponseInterceptor(
  defaultResponseInterceptor({
    codeField: 'code',
    dataField: 'data',
    successCode: 0,
  }),
);

// token 失效 -> 401 兜底
requestClient.addResponseInterceptor(
  authenticateResponseInterceptor({
    client: requestClient,
    doReAuthenticate,
    enableRefreshToken: false,
  }),
);

// 统一错误提示（业务码非 0 时后端已返回 msg）
requestClient.addResponseInterceptor(
  errorMessageResponseInterceptor((msg: string, error) => {
    console.error(`[ft-iam] ${msg}`, error);
  }),
);

// 请求头注入
requestClient.addRequestInterceptor({
  fulfilled: (config) => {
    const accessStore = useAccessStore();
    const token = accessStore.accessToken;
    if (token) {
      config.headers.Accesstoken = token;
    }
    config.headers['Accept-Language'] = preferences.app.locale ?? 'zh-CN';
    config.headers.clientid = currentClientCode;
    if (currentTenantId) {
      config.headers['tenant-id'] = currentTenantId;
    }
    return config;
  },
});

export { requestClient, setRequestIdentity };
