import { type RouteConfig, index, route } from "@react-router/dev/routes"

export default [
    index('./index.tsx'),
    route('/edit/:fileName', './edit/EditRoute.tsx'),
    route('/video', './video/VideoRoute.ts'),
    route('/subs/:videoFileName', './subs/SubsRoute.ts'),
] satisfies RouteConfig