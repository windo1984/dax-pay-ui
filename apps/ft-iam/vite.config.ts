import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      server: {
        open: false,
        port: 7001,
        proxy: {
          // 前端统一走 /api，开发期直连 ft-iam（19310），路径前缀去掉
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            target: 'http://localhost:19310',
            ws: true,
          },
        },
      },
    },
  };
});
