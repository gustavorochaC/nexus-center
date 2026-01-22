import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  console.log('--- 🚀 VITE CONFIG LOADED (PROXY ACTIVE) ---');
  return {
    server: {
      host: "::",
      port: 8085,
      proxy: {
        '/api-proxy': {
          target: 'http://192.168.1.220:54321',
          changeOrigin: true,
          rewrite: (path) => {
            const newPath = path.replace('/api-proxy', '');
            console.log('⚡ Proxy:', path, '->', newPath);
            return newPath;
          },
          secure: false,
          timeout: 20000,
          proxyTimeout: 20000,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('❌ Proxy Error:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('📤 Sending to:', req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('📥 Received:', proxyRes.statusCode, req.url);
            });
          },
        },
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
