import type { CommonResult, PageParam, PageResult } from '#/api/types';

import { requestClient } from '#/api/request';

export interface Tenant {
  id: number;
  code: string;
  name: string;
  contactUserId?: null | number;
  contactName?: string;
  contactMobile?: string;
  status?: number;
  websites?: string;
  packageId?: null | number;
  expireTime?: null | string;
  accountCount?: number;
  remark?: string;
  createTime?: string;
}

export interface TenantPageParam extends PageParam {
  name?: string;
  code?: string;
  status?: number;
}

export interface TenantSaveParam {
  id?: number;
  code?: string;
  name?: string;
  contactUserId?: null | number;
  contactName?: string;
  contactMobile?: string;
  status?: number;
  websites?: string;
  packageId?: null | number;
  expireTime?: string;
  accountCount?: number;
  remark?: string;
}

export interface TenantPackage {
  id: number;
  code: string;
  name: string;
  status?: number;
  remark?: string;
  menuIds?: number[];
}

export interface TenantPackageSaveParam {
  id?: number;
  code?: string;
  name?: string;
  status?: number;
  remark?: string;
  menuIds?: number[];
}

export const TenantApi = {
  page(params: TenantPageParam) {
    return requestClient.get<CommonResult<PageResult<Tenant>>>('/system/tenant/page', { params });
  },
  get(id: number) {
    return requestClient.get<CommonResult<Tenant>>('/system/tenant/get', { params: { id } });
  },
  create(data: TenantSaveParam) {
    return requestClient.post<CommonResult<number>>('/system/tenant/create', data);
  },
  update(data: TenantSaveParam) {
    return requestClient.put<CommonResult<boolean>>('/system/tenant/update', data);
  },
  delete(id: number) {
    return requestClient.delete<CommonResult<boolean>>('/system/tenant/delete', { params: { id } });
  },
};

export const TenantPackageApi = {
  list(status?: number) {
    return requestClient.get<CommonResult<TenantPackage[]>>('/system/tenant/package/list', {
      params: { status },
    });
  },
  create(data: TenantPackageSaveParam) {
    return requestClient.post<CommonResult<number>>('/system/tenant/package/create', data);
  },
  update(data: TenantPackageSaveParam) {
    return requestClient.put<CommonResult<boolean>>('/system/tenant/package/update', data);
  },
  delete(id: number) {
    return requestClient.delete<CommonResult<boolean>>('/system/tenant/package/delete', {
      params: { id },
    });
  },
};
