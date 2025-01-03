import { reactRouter } from "@react-router/dev/vite";
import autoprefixer from "autoprefixer";
import { safeRoutes } from "safe-routes/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
    css: {
        postcss: {
            plugins: [autoprefixer],
        },
    },
    plugins: [
        reactRouter(),
        safeRoutes(),
        tsconfigPaths()
    ]
});
