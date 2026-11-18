import { request } from './request';

/** 基座主菜单的一个应用（后端 iam_micro_app 的一行） */
export interface MicroAppResp {
  key: string;
  title: string;
  path: string;
  url: string;
  icon: string;
  desc: string;
  permission: string;
  sort: number;
}

/** 基座主菜单的一个分组（后端 iam_micro_app_group 的一行，按产品线聚合） */
export interface MicroAppGroupResp {
  key: string;
  title: string;
  icon: string;
  sort: number;
  apps: MicroAppResp[];
}

/**
 * 微前端模块注册表接口。
 *
 * 菜单不再写死在 config/apps.ts 里：登录后由 ft-iam 按当前用户权限裁剪后下发，
 * 无权限的应用根本不会出现在返回结果中。
 */
export const AppApi = {
  /** GET /auth/app-tree：当前用户可见的模块树 */
  getAppTree() {
    return request<MicroAppGroupResp[]>('/auth/app-tree');
  },
};
