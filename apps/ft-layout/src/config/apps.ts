/**
 * 微前端子应用注册表：按产品线分组（IAM / DaxPay / Yudao）
 * - key   路由 name，同时作为标签页标识
 * - path  基座内访问路径
 * - url   子应用地址，默认取环境变量，未配置时回退到本地开发端口
 */
export interface AppDef {
  /** 路由 name（标签页 key） */
  key: string;
  /** 菜单标题 */
  title: string;
  /** 基座内路径 */
  path: string;
  /** 菜单图标（emoji，保持与原基座风格一致） */
  icon: string;
  /** 子应用地址 */
  url: string;
  /** 菜单说明 */
  desc: string;
}

export interface AppGroup {
  key: string;
  title: string;
  icon: string;
  apps: AppDef[];
}

function resolveUrl(value: string | undefined, fallback: string): string {
  const url = (value ?? '').trim() || fallback;
  return url.endsWith('/') ? url : `${url}/`;
}

export const appGroups: AppGroup[] = [
  {
    key: 'iam',
    title: 'IAM 统一认证',
    icon: '🛡️',
    apps: [
      {
        key: 'iam',
        title: '统一认证',
        path: '/iam',
        icon: '🛡️',
        url: resolveUrl(import.meta.env.VITE_APP_IAM_URL, 'http://localhost:7001/'),
        desc: 'ft-iam：用户、角色、菜单、部门、岗位、租户',
      },
    ],
  },
  {
    key: 'daxpay',
    title: 'DaxPay 支付',
    icon: '💳',
    apps: [
      {
        key: 'admin',
        title: '运营端',
        path: '/admin',
        icon: '🏛️',
        url: resolveUrl(import.meta.env.VITE_APP_ADMIN_URL, 'http://localhost:6999/'),
        desc: 'daxpay-admin：平台运营后台',
      },
      {
        key: 'merchant',
        title: '商户端',
        path: '/merchant',
        icon: '🏪',
        url: resolveUrl(import.meta.env.VITE_APP_MERCHANT_URL, 'http://localhost:7999/'),
        desc: 'daxpay-merchant：商户自助后台',
      },
    ],
  },
  {
    key: 'yudao',
    title: 'Yudao 芋道',
    icon: '🧩',
    apps: [
      {
        key: 'yudao',
        title: '芋道管理端',
        path: '/yudao',
        icon: '🧩',
        url: resolveUrl(import.meta.env.VITE_APP_YUDAO_URL, 'http://localhost/'),
        desc: 'yudao-ui-admin-vue3：系统管理 / 基础设施 / 工作流',
      },
    ],
  },
];

/** 拍平后的全部子应用（路由、标签页、容器都按它循环生成） */
export const flatApps: AppDef[] = appGroups.flatMap((group) => group.apps);

export function findApp(key: string): AppDef | undefined {
  return flatApps.find((app) => app.key === key);
}

export function findGroupOfApp(key: string): AppGroup | undefined {
  return appGroups.find((group) => group.apps.some((app) => app.key === key));
}
