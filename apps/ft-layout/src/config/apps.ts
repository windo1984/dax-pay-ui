import { reactive } from 'vue';

import { AppApi, type MicroAppGroupResp } from '../api/apps';

/**
 * 微前端子应用注册表 —— 运行期从 ft-iam 加载，不再写死在代码里。
 *
 * 数据流：
 *   iam_micro_app_group / iam_micro_app（库）
 *     → GET /auth/app-tree（按当前用户权限码裁剪）
 *       → 本注册表（groups / flat）
 *         → 基座动态注册路由 + 渲染 ☰ 主菜单 + 首页卡片
 *
 * 接口没返回的应用不会注册路由，直接输地址也进不去 —— 权限控制在"数据是否下发"这一层，
 * 而不是"下发了再隐藏"。
 */

export interface AppDef {
  /** 路由 name（标签页 key） */
  key: string;
  /** 菜单标题 */
  title: string;
  /** 基座内路径 */
  path: string;
  /** 菜单图标（emoji） */
  icon: string;
  /** 子应用地址 */
  url: string;
  /** 菜单说明 */
  desc: string;
  /** 访问所需权限码（后端已裁剪，这里仅用于展示/排查） */
  permission: string;
}

export interface AppGroup {
  key: string;
  title: string;
  icon: string;
  apps: AppDef[];
}

interface RegistryState {
  groups: AppGroup[];
  flat: AppDef[];
  /** 是否已经拉过并注册过路由 */
  loaded: boolean;
  /** 接口失败时的原因，用于首页提示 */
  error: string;
}

const state = reactive<RegistryState>({
  groups: [],
  flat: [],
  loaded: false,
  error: '',
});

/**
 * 环境变量覆盖：开发期子应用可能跑在别的端口，允许 .env 里的 VITE_APP_<KEY>_URL 覆盖库里的 url，
 * 但**只覆盖地址，不覆盖可见性**（没权限的应用压根不在返回结果里）。
 */
const URL_OVERRIDES: Record<string, string | undefined> = {
  iam: import.meta.env.VITE_APP_IAM_URL,
  admin: import.meta.env.VITE_APP_ADMIN_URL,
  merchant: import.meta.env.VITE_APP_MERCHANT_URL,
  yudao: import.meta.env.VITE_APP_YUDAO_URL,
};

function resolveUrl(key: string, value: string): string {
  const override = (URL_OVERRIDES[key] ?? '').trim();
  const url = override || (value ?? '').trim();
  if (!url) {
    return '';
  }
  return url.endsWith('/') ? url : `${url}/`;
}

function normalize(groups: MicroAppGroupResp[]): AppGroup[] {
  return (groups ?? [])
    .filter((group) => (group.apps ?? []).length > 0)
    .map((group) => ({
      key: group.key,
      title: group.title,
      icon: group.icon,
      apps: group.apps.map((app) => ({
        key: app.key,
        title: app.title,
        path: app.path,
        icon: app.icon || group.icon,
        url: resolveUrl(app.key, app.url),
        desc: app.desc ?? '',
        permission: app.permission ?? '',
      })),
    }));
}

/**
 * 拉取模块树并写入注册表。
 *
 * @param force 为 true 时重新请求（例如权限变更后刷新菜单）
 */
async function load(force = false): Promise<AppGroup[]> {
  if (state.loaded && !force) {
    return state.groups;
  }
  try {
    const tree = await AppApi.getAppTree();
    const groups = normalize(tree);
    state.groups = groups;
    state.flat = groups.flatMap((group) => group.apps);
    state.error = '';
  } catch (e) {
    // 接口失败时保持空菜单，并在首页提示；不做静态兜底 —— 兜底会绕过权限判断
    state.groups = [];
    state.flat = [];
    state.error = e instanceof Error ? e.message : String(e);
    throw e;
  } finally {
    state.loaded = true;
  }
  return state.groups;
}

/** 退出登录：清空注册表，下次登录重新按权限拉取 */
function reset() {
  state.groups = [];
  state.flat = [];
  state.loaded = false;
  state.error = '';
}

function findApp(key: string): AppDef | undefined {
  return state.flat.find((app) => app.key === key);
}

function findGroupOfApp(key: string): AppGroup | undefined {
  return state.groups.find((group) => group.apps.some((app) => app.key === key));
}

function findByPath(path: string): AppDef | undefined {
  const normalized = path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;
  return state.flat.find((app) => app.path === normalized);
}

export function useAppRegistry() {
  return {
    state,
    load,
    reset,
    findApp,
    findGroupOfApp,
    findByPath,
  };
}
