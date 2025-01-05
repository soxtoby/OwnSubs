import { reactRouter } from "@react-router/dev/vite"
import autoprefixer from "autoprefixer"
import { safeRoutes } from "safe-routes/vite"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
    css: {
        postcss: {
            plugins: [autoprefixer],
        },
    },
    plugins: [
        reactRouter(),
        safeRoutes(),
        tsconfigPaths(),
        VitePWA({
            registerType: 'autoUpdate',
            workbox: { globPatterns: ['**/*.{js,css,html,png,jpg,svg,avif}'] },
            manifest: {
                name: 'OwnSubs',
                short_name: 'OwnSubs',
                description: 'Free web-based subtitle editor',
                theme_color: '#3458d4',
                background_color: '#f7f9ff',
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'maskable'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable'
                    }
                ],
            },
        })
    ]
})
