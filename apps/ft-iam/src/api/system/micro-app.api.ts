import type { CommonResult } from '#/api/types';

import { requestClient } from '#/api/request';

/** 微应用（基座里的一个 Tab），字段与后端 MicroAppRespVO 对齐 */
export interface MicroApp {
  key: string;
  title: string;
  path?: string;
  url?: string;
  icon?: string;
  desc?: string;
  permission?: string;
  sort?: number;
}

export const MicroAppApi = {
  /** 启用状态的微应用列表（不按权限裁剪，供角色授权按应用拉菜单） */
  list() {
    return requestClient.get<CommonResult<MicroApp[]>>('/system/micro-app/list');
  },
};
