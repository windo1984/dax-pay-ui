# ft-layout（Fighter 微前端基座）

由 `fighter-micro-app/fighter-layout` 迁移而来：应用位置从独立工作区 `fighter-micro-app/*` 迁到主仓库 `apps/ft-layout`，
源码、依赖组合、端口与交互保持不变，仅把版本来源接到主仓库的 `catalog:`（版本目录）。
在此基础上完成两件事：**新增登录**（未登录只能停在登录页）与**按 IAM / DaxPay / Yudao 三条产品线编排菜单导航**。

## 迁移对照

| 项 | 原 fighter-layout | 现 apps/ft-layout |
| --- | --- | --- |
| 工作区 | `fighter-micro-app/pnpm-workspace.yaml` 独立工作区 | 主仓库 `pnpm-workspace.yaml` 的 `apps/*` |
| 版本来源 | 独立 `catalog` | 主仓库 `catalog:`（已存在 `@micro-zoe/micro-app` / `@tailwindcss/vite` / `tailwindcss` / `vite` / `vue` / `vue-router`） |
| 依赖 | `@micro-zoe/micro-app`、`vue`、`vue-router` + dev `@tailwindcss/vite`、`@vitejs/plugin-vue`、`tailwindcss`、`vite` | 完全一致（登录用原生 `fetch`，未新增任何依赖） |
| 端口 | 18999（host 127.0.0.1） | 19000（host 127.0.0.1，`strictPort` 防止被占后漂移） |
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

> 说明：ft-iam 是例外——它和基座共用同一套 Sa-Token 会话，基座登录后会把 token 传给子应用（见下节）。
> DaxPay / Yudao 各自独立登录，基座只控制「能否进入基座与打开模块」，不代持它们的会话。

## 子应用登录态透传（ft-iam）

基座在 `:19000`，ft-iam 在 `:7002`，两者 **origin 不同**，浏览器 localStorage 天然隔离，
所以 `apps/ft-iam` 打开时默认是「未登录」——表现为白屏或跳它自己的登录页。

做法：基座在 `MicroPane.vue` 里把登录态挂到子应用地址上，子应用启动时接管。

| 环节 | 位置 | 行为 |
| --- | --- | --- |
| 基座拼参数 | `components/MicroPane.vue` | `?token=<基座 token>&tenantId=<租户>&clientCode=<身份域>` |
| 子应用接管 | `apps/ft-iam/src/bootstrap.ts` 的 `adoptTokenFromHost()` | `initStores` 之后读参数 → `accessStore.setAccessToken()` + `setRequestIdentity()` → `history.replaceState` 把参数从地址栏抹掉 |

- 直连 `http://localhost:7002` 时没有这些参数，走 iam 原有登录流程，行为不变。
- 基座**退出登录**时会销毁所有子应用容器（`opened=[]`），否则 iframe 内还留着各自域的登录态。
- token 只走一次 URL、随即被抹除；生产期若把 `ft-layout` 与 `ft-iam` 反代到同一域，就同源共享登录态，这条传参链路会自动变成无操作。

## 目录

```
apps/ft-layout
├── .env                     # 四个子应用地址（VITE_APP_*_URL）
├── index.html               # 标题：Fighter 微前端基座
├── package.json             # 依赖同原工程，版本走 catalog:
├── tsconfig.json            # 原 standalone tsconfig
├── vite.config.ts           # micro-app 自定义元素 + tailwind；端口 19000；/api 代理到 ft-iam 19310
└── src
    ├── main.ts              # microApp.start() + createApp
    ├── App.vue              # 登录页独立渲染，其余渲染 BaseLayout
    ├── api
    │   ├── request.ts       # fetch 封装：/api 前缀、Accesstoken/clientid/tenant-id 头、code!=0 抛错
    │   ├── auth.ts          # 登录/登出/用户信息/权限信息
    │   └── apps.ts          # GET /auth/app-tree：按当前用户权限裁剪的模块树
    ├── config/apps.ts       # 子应用注册表（运行时）：从 /auth/app-tree 加载，不写死
    ├── store/auth.ts        # 登录态（reactive + localStorage，不引 pinia）
    ├── router
    │   ├── index.ts         # 只声明 /login 与 /；子应用路由由注册表动态注册
    │   ├── dynamic.ts       # registerAppRoutes / removeAppRoutes（动态路由的注册与卸载）
    │   └── guard.ts         # 登录守卫（token 校验 + 拉模块树 + 注册路由 + 无权限回落首页）
    ├── views/LoginPage.vue  # 登录页（tailwind）
    ├── layouts/BaseLayout.vue   # 顶栏（☰ 分组菜单 + 首页 + Tab 栏 + 用户/退出）与子应用容器
    ├── components
    │   ├── AppHeader.vue    # 抽出的顶栏组件（AppMenu / 刷新）
    │   ├── TabBar.vue       # 抽出的 Tab 栏组件
    │   └── MicroPane.vue    # 子应用容器：默认 iframe 承载（opened/active 双开关），mode=micro 走 <micro-app>
    └── styles/index.css     # tailwind 入口 + micro-app/iframe 撑满
```

## 菜单导航（库驱动 + 权限驱动）

顶部 `☰` hover 弹出的菜单、Tab 栏、首页卡片，全部来自 **ft-iam 的数据库**，不再写死在代码里：

```
iam_micro_app_group / iam_micro_app（库，schema ft_iam）
   → GET /auth/app-tree（后端按当前用户权限码裁剪，无权限的应用不下发）
      → src/config/apps.ts（运行时注册表）
         → router/dynamic.ts（动态注册路由） + BaseLayout.vue（渲染 ☰ 菜单 / Tab / 首页卡片）
```

| 分组（group_key） | 应用（app_key） | 基座路径 | 子应用地址（默认） | 访问权限码 |
| --- | --- | --- | --- | --- |
| 🛡️ iam | 统一认证 | `/iam` | http://localhost:7002/ | `app:iam:access` |
| 💳 daxpay | 运营端 | `/admin` | http://localhost:6999/ | `app:daxpay:admin:access` |
| 💳 daxpay | 商户端 | `/merchant` | http://localhost:7999/ | `app:daxpay:merchant:access` |
| 🧩 yudao | 芋道管理端 | `/yudao` | http://localhost/ | `app:yudao:access` |

**增删模块改库，不改代码**：往上面两张表插/改一行即可（脚本见 `fighter-cloud/ft-iam/script/sql/{pgsql,mysql}/05-micro-app-*.sql`）。

### 权限控制怎么生效

- 后端 `MicroAppService#getTreeForUser`：权限码为空 → 登录即可访问；`administrator = true` → 全部可见；
  否则必须命中用户的权限码集合，才把应用下发。某个分组下的应用被裁空，该分组整组不返回。
- 前端 `router/dynamic.ts` **只注册下发的模块**：没权限的模块连路由都不存在，直接输 `http://127.0.0.1:19000/admin`
  也会被守卫送回首页（首页提示「当前账号没有可访问的模块」）。
- 授权走 iam 的「角色管理 → 分配菜单」：4 个 `app:*:access` 权限码已作为 `type=3` 的按钮节点登记在 `iam_menu`，
  可直接勾选。平台管理员（`administrator=true`）自动拥有全部权限码，无需额外授权。
- 退出登录时 `removeAppRoutes()` 卸载动态路由、注册表清空，换账号不会残留上一个用户的模块入口。
- 新增 `app:xxx` 权限码时，记得同时在 `iam_menu` 里插入一条 `type=3` 记录，否则在角色分配里勾不到。

### 地址与端口

- 地址优先读 `.env` 的 `VITE_APP_IAM_URL` / `VITE_APP_ADMIN_URL` / `VITE_APP_MERCHANT_URL` / `VITE_APP_YUDAO_URL`，
  未配置时用库里 `iam_micro_app.url` 的值。**只覆盖地址，不覆盖可见性** —— 没权限的应用压根不在返回结果里。
- **端口以各子应用 dev server 实际端口为准**：ft-iam = 7002（不是 7001，7001 没有服务，基座加载会报「localhost 拒绝了我们的连接请求」）。
- `.env` 里的 host 要和基座访问地址一致（都用 `localhost` 或都用 `127.0.0.1`），混用会让浏览器判成两个站点。

### 容器渲染方式（为什么是 iframe）

`components/MicroPane.vue` 默认用 **iframe** 承载子应用，`mode="micro"` 时才走 `<micro-app>`：

- iam / daxpay / yudao 都是「整页布局」应用（Vben 布局用 `100vh` + `fixed` 顶栏）。
  实测把 iam 放进 `<micro-app>`（默认沙箱）时，它的 `100vh` 相对**主视口**，会直接盖住基座的顶栏与 Tab 栏。
- micro-app 1.0.0-rc.32 的 `iframe` 属性只在 umd 老项目下生效（源码 `this.iframe && !this.umdMode`），
  而 iam 是 Vite/ESM 产物，用不了这条分支，所以隔离只能靠普通 iframe。
- iframe 内 `100vh` 等于 iframe 视口高度，容器高度一变子应用自动适配；`microApp.start()` 与依赖继续保留，
  将来某个子应用接入 micro-app 协议时把 `mode` 改成 `micro` 即可。

## 启动

```bash
# 仓库根目录
corepack pnpm install
corepack pnpm dev:layout
# 访问 http://127.0.0.1:19000 → 未登录会跳到 /login
```

登录账号：`admin / admin123`（租户 `fighter`，身份域 `admin`），需先启动 ft-iam（19310）。

按需启动对应子应用：

```bash
corepack pnpm dev:iam         # ft-iam，7002（7002 才是实际端口）
corepack pnpm dev:admin       # daxpay-admin，6999
corepack pnpm dev:merchant    # daxpay-merchant，7999
# yudao：在 D:\z390_svn\fighter-github\yudao\yudao-ui-admin-vue3-fork 下 pnpm dev（其 .env 里 VITE_PORT=80）
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
