import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { defineConfig } from '@vben/vite-config';

// 通行密钥(WebAuthn)要求安全上下文, 移动端真机测试需 dev server 开启 HTTPS。
// 证书放在仓库根 certs/ 下(已 gitignore), 证书文件存在即启用 HTTPS, 不存在则维持 HTTP, 不影响其他协作者。
// 证书用 mkcert 签发(本地 CA 模式, CA 装好后重签叶子证书无需再动系统信任存储), SAN 含 localhost、localhost.test 与本机 LAN IP:
//   mkcert -install
//   mkcert -cert-file certs/dev-cert.pem -key-file certs/dev-key.pem localhost localhost.test 127.0.0.1 192.168.1.220 192.168.188.4
const devCertFile = fileURLToPath(new URL('../../certs/dev-cert.pem', import.meta.url));
const devKeyFile = fileURLToPath(new URL('../../certs/dev-key.pem', import.meta.url));

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      server: {
        open: false,
        // 允许 nginx 反代的自定义域名访问(Google OAuth 本地调试用)
        allowedHosts: true,
        // 自签证书存在时启用 HTTPS(Passkey 真机调试用; 注意 WebAuthn 的 rpId 不能是 IP, 手机须以 localhost 或域名访问)
        https:
          existsSync(devCertFile) && existsSync(devKeyFile)
            ? {
                cert: readFileSync(devCertFile),
                key: readFileSync(devKeyFile),
              }
            : undefined,
        proxy: {
          // 前端统一走 /api，开发期转发到 ft-iam，路径前缀去掉。
          //
          // 两种联调方式，用环境变量切换（重启 dev server 生效）：
          //   1) 直连服务（默认）  target = http://localhost:19310
          //   2) 走网关            设 FT_IAM_PROXY_TARGET=http://localhost:19200
          //     网关侧已配 /auth/**、/system/** → lb://ft-iam 的路由，
          //     且这两个前缀原样转发（网关不做 StripPrefix），所以 rewrite 依然只去 /api。
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            target: process.env.VITE_APP_GATEWAY_URL,
            ws: true,
          },
        },
      },
    },
  };
});
