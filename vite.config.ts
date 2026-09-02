import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

const apiClient = fileURLToPath(new URL('./src/api.js', import.meta.url));

export default defineConfig({
    plugins: [react()],
    // Vercel serves the SPA from the domain root. Absolute asset URLs keep
    // JS/CSS/images working after client-side navigation and hard refreshes
    // on routes such as /login and /dashboard.
    base: '/',
    resolve: {
        alias: {
            '@appdeploy/client': apiClient,
            '@AppDeploy/client': apiClient,
        },
    },
    build: {
        outDir: process.env.APPDEPLOY_VITE_OUT_DIR || 'dist',
        sourcemap: process.env.APPDEPLOY_VITE_SOURCEMAP === 'hidden' ? 'hidden' : false,
        rollupOptions: { maxParallelFileOps: 128 },
    },
});
