import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Configuration Vite pour le projet Éroz
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            // Alias @ pour pointer vers le dossier src
            '@': path.resolve(__dirname, './src'),
        },
    },
    build: {
        // Optimisations pour la production
        outDir: 'dist',
        sourcemap: false,
        minify: 'esbuild',
    },
    server: {
        port: 5173,
        host: true,
    },
})
