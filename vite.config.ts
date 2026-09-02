import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
    plugins: [react()],
    base: './',
    resolve: {
        alias: {
            '@AppDeploy/client': fileURLToPath(new URL('./src/api.js', import.meta.url)),
        },
    },
    build: {
        outDir: process.env.APPDEPLOY_VITE_OUT_DIR || 'dist',
        sourcemap: process.env.APPDEPLOY_VITE_SOURCEMAP === 'hidden' ? 'hidden' : false,
        rollupOptions: { maxParallelFileOps: 128 },
    },
});
