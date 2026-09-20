import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        tailwindcss()
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@infinityhub/types': path.resolve(__dirname, '../../packages/types/src'),
            '@infinityhub/constants': path.resolve(__dirname, '../../packages/constants/src'),
            '@infinityhub/validation': path.resolve(__dirname, '../../packages/validation/src'),
            '@infinityhub/ui': path.resolve(__dirname, '../../packages/ui/src'),
            '@infinityhub/config': path.resolve(__dirname, '../../packages/config/src'),
            '@infinityhub/api-client': path.resolve(__dirname, '../../packages/api-client/src')
        }
    },
    server: {
        port: 3000,
        host: true,
        proxy: {
            '/api': {
                target: 'http://localhost:4000',
                changeOrigin: true
            }
        }
    }
});
//# sourceMappingURL=vite.config.js.map