import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === 'micro-app',
        },
      },
    }),
    tailwindcss(),
  ],
  server: {
    port: 18999,
    host: '127.0.0.1',
    open: false,
    proxy: {
      // 基座登录/鉴权统一走 /api，开发期代理到 ft-iam（19310），路径前缀去掉
      '/api': {
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        target: process.env.VITE_LAYOUT_API_TARGET || 'http://localhost:19310',
        ws: true,
      },
    },
  },
})
