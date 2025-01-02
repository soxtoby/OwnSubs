import type { Route } from "./+types/index";
import { Home } from "./home";

export default function Index(params: Route.ComponentProps) {
    return <Home />
}