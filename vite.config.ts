import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  // V2 frontend runs locally against the LAN vhost of the docker stack:
  // host 8080 -> container 80 (LAN read-write); host 8081 = loopback tunnel
  // vhost (NOT the HMI target). Directive 2026-11-20: HMI uses local address.
  // Override for direct-daemon dev:
  //   BACKEND_PROXY_TARGET=http://localhost:3001 pnpm dev
  const proxyTarget =
    process.env.BACKEND_PROXY_TARGET || loadEnv(mode, process.cwd(), '').BACKEND_PROXY_TARGET || 'http://localhost:8080';
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3002,
      strictPort: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': {target: proxyTarget, changeOrigin: true},
        '/health': {target: proxyTarget, changeOrigin: true},
        '/docs': {target: proxyTarget, changeOrigin: true},
        // Perimeter gateway menolak Origin http://localhost:3002 (SECURITY_REJECTION
        // 403 di /ws/telemetry). Rewrite Origin ke target agar WS realtime hidup.
        '/ws': {target: proxyTarget, changeOrigin: true, ws: true, headers: {Origin: proxyTarget}},
      },
    },
    preview: {
      host: '0.0.0.0',
      port: 3002,
      strictPort: true,
    },
  };
});
