import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Vite 负责打包 renderer 进程（React 应用）
// 主进程由 tsc + electron-builder 单独处理
export default defineConfig({
  plugins: [react()],
  base: './',
  root: path.resolve(__dirname, 'renderer'),
  build: {
    outDir: path.resolve(__dirname, 'dist/renderer'),
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'renderer/index.html')
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'renderer'),
      '@shared': path.resolve(__dirname, 'shared')
    }
  },
  server: {
    port: 5173,
    strictPort: true
  }
});
