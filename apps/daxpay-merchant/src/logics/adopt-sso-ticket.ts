import { useAccessStore } from '@vben/stores';

import { AuthApi } from '#/api/core/auth.api';

/**
 * 统一认证（SSO）免登引导
 *
 * 基座 ft-layout 以 ft-iam 为唯一登录入口，打开本应用时在地址上挂一次性 ticket。
 * 这里读一次 ticket，向本应用后端（/token/sso/iam-login）换本应用自己的 token，
 * 写入 access store 后立即把 ticket 从地址栏抹掉（ticket 只能用一次，也不该留在
 * 书签/截图/Referer 里）。
 *
 * 换取失败（ticket 过期/已被消费/本地没有对应账号）时不阻断启动，
 * 交给路由守卫按未登录处理，用户会看到本应用自己的登录页。
 */
export async function adoptSsoTicketFromHost() {
  if (typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);
  const ticket = url.searchParams.get('ticket');
  if (!ticket) {
    return;
  }

  url.searchParams.delete('ticket');
  window.history.replaceState(window.history.state, '', url.toString());

  try {
    const result = await AuthApi.ssoIamLogin(ticket);
    const token = typeof result.data === 'string' ? result.data : '';
    if (!token) {
      console.warn('[daxpay-merchant] 统一认证未返回 token，退回本应用登录页');
      return;
    }
    useAccessStore().setAccessToken(token);
  } catch (error) {
    console.warn('[daxpay-merchant] 统一认证 ticket 换取失败，退回本应用登录页', error);
  }
}
