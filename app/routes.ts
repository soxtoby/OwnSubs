import { type RouteConfig, index, route } from "@react-router/dev/routes"

export default [
    index('./index.tsx'),
    route('/edit/:fileName', './edit.tsx'),
    route('/video', './video.ts'),
    route('/subs/:videoFileName', './subs.ts'),
] satisfies RouteConfig