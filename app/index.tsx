import { redirect } from "react-router";
import type { Route } from "./+types/index";
import { Text } from "@radix-ui/themes";

export function clientLoader(args: Route.ClientLoaderArgs) {
    return redirect('/edit/Analysis Consume')
}

export default function Index() {
    return <Text>Loading&hellip;</Text>
}