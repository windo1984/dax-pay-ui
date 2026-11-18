/**
 * 极简 fetch 封装：基座不引 axios（依赖按原工程保持最小集）。
 * - 统一拼接 VITE_API_BASE_URL（默认 /api，开发期由 vite 代理到 ft-iam 19310）
 * - 自动带上 Sa-Token 头 Accesstoken，以及身份域 clientid / tenant-id
 * - 后端统一返回 { code, msg, data }，code=0 视为成功，其余抛出携带 code/msg 的错误
 */
export interface ApiResult<T> {
  code: number;
  msg: string;
  data: T;
}

export interface RequestOptions {
  method?: 'DELETE' | 'GET' | 'POST' | 'PUT';
  body?: unknown;
  params?: Record<string, number | string | undefined>;
  /** 是否携带登录态，默认 true */
  auth?: boolean;
}

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '');

/** 登录态读取（避免 request 与 store 循环依赖，这里直接读 localStorage） */
const TOKEN_KEY = 'ft-layout-token';
const IDENTITY_KEY = 'ft-layout-identity';

export interface RequestIdentity {
  tenantId?: number;
  tenantCode?: string;
  clientCode?: string;
}

export function getStoredToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? '';
}

export function setStoredToken(token: string) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getStoredIdentity(): RequestIdentity {
  try {
    return JSON.parse(localStorage.getItem(IDENTITY_KEY) ?? '{}') as RequestIdentity;
  } catch {
    return {};
  }
}

export function setStoredIdentity(identity: RequestIdentity) {
  localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity ?? {}));
}

/** 业务异常：带上后端 code，方便页面按错误码提示 */
export class ApiError extends Error {
  code: number;
  constructor(code: number, msg: string) {
    super(msg);
    this.code = code;
  }
}

function buildQuery(params?: Record<string, number | string | undefined>): string {
  if (!params) {
    return '';
  }
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && `${value}` !== '') {
      search.append(key, `${value}`);
    }
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

export async function request<T = unknown>(url: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params, auth = true } = options;
  const headers: Record<string, string> = {
    'Accept-Language': 'zh-CN',
    'Content-Type': 'application/json;charset=UTF-8',
  };

  const identity = getStoredIdentity();
  if (identity.clientCode) {
    headers['clientid'] = identity.clientCode;
  }
  if (identity.tenantId !== undefined) {
    headers['tenant-id'] = String(identity.tenantId);
  }
  if (auth) {
    const token = getStoredToken();
    if (token) {
      headers['Accesstoken'] = token;
    }
  }

  const response = await fetch(`${BASE_URL}${url}${buildQuery(params)}`, {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers,
    method,
  });

  // 401：token 缺失/失效，交由调用方（守卫）跳登录页
  if (response.status === 401) {
    setStoredToken('');
    throw new ApiError(401, '登录已过期，请重新登录');
  }

  const text = await response.text();
  if (!text) {
    return null as unknown as T;
  }

  let payload: ApiResult<T>;
  try {
    payload = JSON.parse(text) as ApiResult<T>;
  } catch {
    throw new ApiError(response.status, `响应解析失败（HTTP ${response.status}）`);
  }

  if (payload.code !== 0) {
    if (payload.code === 401) {
      setStoredToken('');
    }
    throw new ApiError(payload.code, payload.msg || '请求失败');
  }

  return payload.data;
}
