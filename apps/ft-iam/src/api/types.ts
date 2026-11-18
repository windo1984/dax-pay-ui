/** 后端统一响应包装：code=0 成功 */
export interface CommonResult<T = any> {
  code: number;
  data: T;
  msg: string;
}

/** 分页数据包装 */
export interface PageResult<T = any> {
  list: T[];
  total: number;
}

/** 分页请求基类 */
export interface PageParam {
  pageNo: number;
  pageSize: number;
}

/** 通用状态：0 开启 / 1 停用 */
export type CommonStatus = 0 | 1;

/** 身份证域（对应后端 ft.iam.clients） */
export type ClientCode = 'admin' | 'app' | 'gateway' | 'merchant';
