import type { CommonResult } from '#/api/types';

import { requestClient } from '#/api/request';

export interface Post {
  id: number;
  tenantId?: number;
  code: string;
  name: string;
  sort?: number;
  status?: number;
  remark?: string;
  createTime?: string;
}

export interface PostSaveParam {
  id?: number;
  code?: string;
  name?: string;
  sort?: number;
  status?: number;
  remark?: string;
}

export interface PostListParam {
  name?: string;
  code?: string;
  status?: number;
}

export const PostApi = {
  list(params?: PostListParam) {
    return requestClient.get<CommonResult<Post[]>>('/system/post/list', { params });
  },
  get(id: number) {
    return requestClient.get<CommonResult<Post>>('/system/post/get', { params: { id } });
  },
  create(data: PostSaveParam) {
    return requestClient.post<CommonResult<number>>('/system/post/create', data);
  },
  update(data: PostSaveParam) {
    return requestClient.put<CommonResult<boolean>>('/system/post/update', data);
  },
  delete(id: number) {
    return requestClient.delete<CommonResult<boolean>>('/system/post/delete', { params: { id } });
  },
};
