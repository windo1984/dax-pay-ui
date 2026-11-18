# ft-layout（Fighter 微前端基座）

由 `fighter-micro-app/fighter-layout` 迁移而来：应用位置从独立工作区 `fighter-micro-app/*` 迁到主仓库 `apps/ft-layout`，
源码、依赖组合、端口与交互保持不变，仅把版本来源接到主仓库的 `catalog:`（版本目录）。
在此基础上**新增登录**：未登录只能停在登录页，无法访问任何子应用模块。

## 迁移对照

| 项 | 原 fighter-layout | 现 apps/ft-layout |
| --- | --- | --- |
| 工作区 | `fighter-micro-app/pnpm-workspace.yaml` 独立工作区 | 主仓库 `pnpm-workspace.yaml` 的 `apps/*` |
| 版本来源 | 独立 `catalog` | 主仓库 `catalog:`（已存在 `@micro-zoe/micro-app` / `@tailwindcss/vite` / `tailwindcss` / `vite` / `vue` / `vue-router`） |
| 依赖 | `@micro-zoe/micro-app`、`vue`、`vue-router` + dev `@tailwindcss/vite`、`@vitejs/plugin-vue`、`tailwindcss`、`vite` | 完全一致（登录用原生 `fetch`，未新增任何依赖） |
| 端口 | 18999（host 127.0.0.1） | 18999（host 127.0.0.1） |
| 启动 | `pnpm -F fighter-layout run dev` | `pnpm dev:layout`（等价 `pnpm -F ft-layout run dev`） |

## 登录与鉴权

基座复用 **ft-iam**（端口 19310，Sa-Token）的鉴权接口：

| 用途 | 接口 | 说明 |
| --- | --- | --- |
| 登录 | `POST /auth/login` | body `{ tenantCode, clientCode, username, password }`，返回 `{ token, tokenName, expiresIn }` |
| 用户信息 | `GET /auth/user-info` | 请求头 `Accesstoken`；401 表示 token 缺失/失效 |
| 权限信息 | `GET /auth/permission-info` | 返回 `permissions / roles / menus` |
| 登出 | `POST /auth/logout` | 清服务端会话 |

前端行为：

- **登录页** `/login`：租户编码、身份域（admin/merchant/app/gateway）、账号、密码；登录成功后按 `?redirect=` 回到原目标路径。
- **路由守卫**（`src/router/guard.ts`）：除 `login` 外的所有路由（`/`、`/admin`、`/merchant`）都必须有 token；无 token 直接跳登录页并带 `redirect`；有 token 但用户信息未加载时先拉 `/auth/user-info`，遇到 401 自动清 token 回登录页。
- **登录态存储**：token 存 `localStorage`（`ft-layout-token`），身份域存 `ft-layout-identity`，刷新页面免登录。
- **请求头**：`Accesstoken`（裸 token）、`clientid`（身份域）、`tenant-id`（登录后由 `/auth/user-info` 回填）。
- **顶栏**：显示当前用户、身份域/租户、角色，以及「退出登录」（调用 `/auth/logout` 后回登录页）。

> 说明：子应用（daxpay-admin / daxpay-merchant）在各自 iframe 内独立登录，基座登录只控制「能否进入基座与打开模块」，不会把子应用会话代持。

## 目录

```
apps/ft-layout
├── index.html               # 标题：Fighter 微前端基座
├── package.json             # 依赖同原工程，版本走 catalog:
├── tsconfig.json            # 原 standalone tsconfig
├── vite.config.ts           # micro-app 自定义元素 + tailwind；端口 18999；/api 代理到 ft-iam 19310
└── src
    ├── main.ts              # microApp.start() + createApp
    ├── App.vue              # 登录页独立渲染，其余渲染 BaseLayout
    ├── api
    │   ├── request.ts       # fetch 封装：/api 前缀、Accesstoken/clientid/tenant-id 头、code!=0 抛错
    │   └── auth.ts          # 登录/登出/用户信息/权限信息
    ├── store/auth.ts        # 登录态（reactive + localStorage，不引 pinia）
    ├── router
    │   ├── index.ts         # /login、/、/admin、/merchant
    │   └── guard.ts         # 登录守卫（白名单 + token 校验）
    ├── views/LoginPage.vue  # 登录页（tailwind）
    ├── layouts/BaseLayout.vue   # 顶栏（☰ 悬浮菜单 + 首页 + Tab 栏 + 用户/退出）与子应用容器
    ├── components
    │   ├── AppHeader.vue    # 抽出的顶栏组件（AppMenu / 刷新）
    │   ├── TabBar.vue       # 抽出的 Tab 栏组件
    │   └── MicroPane.vue    # 子应用 iframe 容器（opened / active 双开关）
    └── styles/index.css     # tailwind 入口 + micro-app/iframe 撑满
```

## 启动

```bash
# 仓库根目录
corepack pnpm install
corepack pnpm dev:layout
# 访问 http://127.0.0.1:18999 → 未登录会跳到 /login
```

登录账号：`admin / admin123`（租户 `fighter`，身份域 `admin`），需先启动 ft-iam（19310）。

基座加载的子应用（`src/layouts/BaseLayout.vue` 内配置）：

| 名称 | 地址 | 基座路径 |
| --- | --- | --- |
| 运营端 daxpay-admin | http://localhost:6999/ | `/admin` |
| 商户端 daxpay-merchant | http://localhost:7999/ | `/merchant` |

```bash
corepack pnpm dev:admin      # 6999
corepack pnpm dev:merchant   # 7999
```

## 部署要点

- 开发期 `/api` 由 `vite.config.ts` 代理到 `http://localhost:19310`（可用环境变量 `VITE_LAYOUT_API_TARGET` 覆盖）。
- 生产期需在 Nginx 把 `/api` 反代到 ft-iam，例如：

```nginx
location /api/ {
  proxy_pass http://ft-iam:19310/;
}
```

- 若接口不在同域，可构建时注入 `VITE_API_BASE_URL`（默认 `/api`）。
- 本应用**不**接入 `@vben/*` 体系：它是独立的微前端基座（micro-app + Tailwind），与 `apps/daxpay-admin`、`apps/daxpay-merchant`、`apps/ft-iam` 这些 Vben 应用在技术栈上并列，只共享同一个 pnpm 工作区与 `catalog:` 管理版本。
