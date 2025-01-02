import type { Route } from "./+types/index";
import { Home } from "./home";

export function clientLoader(params: Route.ClientLoaderArgs) {
    return <Home />
}

export default function Index(params: Route.ComponentProps) {
    return params.loaderData
}