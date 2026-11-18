# ft-iam 前端（Fighter IAM 控制台）

统一用户与权限管理平台的前端应用，基于本仓库（Vben 5 / Vue3 / pnpm-turbo monorepo）既有架构，
与 `apps/daxpay-admin`、`apps/daxpay-merchant` 平级，通过 `@vben/*` 工作区包复用布局、路由、权限、请求等能力。

## 技术栈

| 项 | 说明 |
| --- | --- |
| 框架 | Vue 3 + TypeScript + Vite |
| 脚手架 | `@vben/vite-config`、`@vben/layouts`、`@vben/access`、`@vben/request`、`@vben/stores` |
| UI | `antdv-next`（Ant Design Vue，按需加载） |
| 路由 | `vue-router`，**后端菜单驱动动态路由**（`accessMode: 'backend'`） |
| 状态 | Pinia（`@vben/stores` + 本地 `useAuthStore`） |
| 后端 | ft-iam 服务，端口 **19310**，Sa-Token 鉴权（请求头 `Accesstoken`） |

## 启动

```bash
# 仓库根目录执行（pnpm 由 corepack 提供）
corepack pnpm install
corepack pnpm -F ft-iam run dev
# 或
corepack pnpm dev:ft-iam
```

- 开发端口：**7001**（`.env.development` 的 `VITE_PORT`）
- 访问：http://localhost:7001
- 开发代理：`/api` → `http://localhost:19310`（`vite.config.ts` 内 `server.proxy`，自动去掉 `/api` 前缀）

## 账号

| 租户 | 身份域 | 账号 | 密码 |
| --- | --- | --- | --- |
| fighter | admin | admin | admin123 |
| fighter | admin | demo | admin123 |

登录页可切换身份域（`admin` / `merchant` / `app` / `gateway`），对应请求头 `clientid`。

## 目录结构

```
apps/ft-iam
├── docs/api-docs.json        # ft-iam 后端 OpenAPI 快照（45 个接口，联调对照用）
├── public/                   # favicon、logo、loading
├── src
│   ├── api
│   │   ├── request.ts        # 精简 RequestClient：注入 Accesstoken / clientid / tenant-id
│   │   ├── types.ts          # CommonResult / PageResult / PageParam 等
│   │   ├── auth.api.ts       # 登录、登出、用户信息、权限信息
│   │   ├── menu-to-routes.ts # 后端菜单树 → Vben 动态路由
│   │   └── system/           # user / role / menu / dept / post / tenant（含套餐）
│   ├── layouts
│   │   ├── basic.vue         # 基础布局（含用户下拉、登录过期提示）
│   │   └── auth.vue          # 登录页布局
│   ├── router
│   │   ├── routes/core.ts    # Root、登录页、404、工作台
│   │   ├── access.ts         # generateAccessible('backend') 接线
│   │   └── guard.ts          # 通用守卫 + 权限守卫
│   ├── store/auth.ts         # 登录 / 登出 / 用户信息 / 角色
│   └── views
│       ├── _core/authentication/login.vue
│       ├── _core/fallback/{not-found,forbidden}.vue
│       ├── dashboard/index.vue
│       └── system/{user,role,menu,dept,post,tenant}/index.vue
├── .env / .env.development / .env.production
├── vite.config.ts
└── package.json
```

## 页面与功能

| 菜单 | 路径 | 能力 |
| --- | --- | --- |
| 工作台 | `/dashboard` | 当前用户、角色、权限码与菜单统计 |
| 用户管理 | `/system/user` | 分页查询、新增/编辑、启停、重置密码、删除、角色/岗位绑定 |
| 角色管理 | `/system/role` | 分页查询、新增/编辑、启停、删除、菜单授权（树形勾选） |
| 菜单管理 | `/system/menu` | 树表、新增目录/菜单/按钮、编辑、删除 |
| 部门管理 | `/system/dept` | 树表、新增子部门、编辑、删除 |
| 岗位管理 | `/system/post` | 列表查询、新增/编辑、删除 |
| 租户管理 | `/system/tenant` | 分页查询、新增/编辑、删除、租户套餐维护 |

## 权限与路由机制

1. 登录 `POST /auth/login` 返回 `{ token }`，前端写入 AccessStore，后续请求头带 `Accesstoken`（裸 token，无 `Bearer`）。
2. 守卫首次进入时调 `GET /auth/user-info` 与 `GET /auth/permission-info`：
   - `permissions` → `accessStore.setPermCodes`，页面按钮用 `useAccess().hasAccessByCodes(['system:user:create'])` 控权；
   - `menus` → `convertMenuListToRoutes` → `generateAccessible('backend')`，生成侧边栏与动态路由。
3. 菜单 `type`：`1` 目录（`path` 为绝对路径，如 `/system`）、`2` 菜单（`path` 相对，`component` 为 `system/user/index` 形式的视图路径）、`3` 按钮（只作权限码）。
4. `component` 字符串在 `import.meta.glob('../views/**/*.vue')` 中按 `/system/user/index.vue` 命中，未命中回落 404 页——新增页面时路径必须与后端菜单的 `component` 一致。

## 环境变量

```ini
# .env
VITE_APP_TITLE=Fighter IAM
VITE_APP_NAMESPACE=ft-iam-web
VITE_APP_CLIENT_CODE=admin      # 登录页默认身份域
VITE_APP_TENANT_CODE=fighter    # 登录页默认租户

# .env.development
VITE_PORT=7001
VITE_BASE=/
VITE_GLOB_API_URL=/api          # 走 vite 代理到 19310
```

生产部署时 `VITE_GLOB_API_URL=/api` 由 Nginx / 网关反代到 ft-iam（如 `http://ft-iam:19310`）。

## 构建

```bash
corepack pnpm -F ft-iam run build       # 产物在 apps/ft-iam/dist
corepack pnpm -F ft-iam run typecheck   # vue-tsc 类型校验
```

## 与 daxpay-admin 的差异

- 未引入 `@daxpay/ui-biz` 与 `vxe-table`，表格统一用 `antdv-next` 的 `a-table`，避免 IAM 应用耦合支付业务包；
- 未引入 DaxPay 的 `createDaxRequestClient`（其 nonce / RSA 加密逻辑不适用），改用自写精简客户端；
- 登录为明文 `{ tenantCode, clientCode, username, password }`，无二次验证与密码过期分支。
