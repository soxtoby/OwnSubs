import { Container, Theme } from "@radix-ui/themes"
import radixThemes from "@radix-ui/themes/styles.css?url"
import { posthog } from "posthog-js"
import { useEffect } from "react"
import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration, } from "react-router"
import { registerSW } from "virtual:pwa-register"
import type { Route } from "./+types/root"
import stylesheet from "./app.css?url"
import { IndexContent } from "./IndexContent"
import { MessageBoxProvider } from "./MessageBox"
import { emptyArray } from "./utils"
import favicon from "/favicon.svg"

export const meta: Route.MetaFunction = () => [
    { title: "OwnSubs" },
]

export const links: Route.LinksFunction = () => [
    { rel: 'manifest', href: '/manifest.webmanifest' },
    { rel: 'icon', type: 'image/svg+xml', href: favicon },
    { rel: 'apple-touch-icon', href: favicon, sizes: '180x180' },
    { rel: 'stylesheet', href: radixThemes },
    { rel: 'stylesheet', href: stylesheet },
]

export function HydrateFallback(props: Route.HydrateFallbackProps) {
    return <Layout><IndexContent videos={emptyArray} /></Layout>
}

export function Layout({ children }: { children: React.ReactNode }) {
    return <html lang="en">
        <head>
            <meta charSet="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <meta name="description" content="Free web-based subtitle editor" />
            <meta name="theme-color" content="#3458d4" />
            <Meta />
            <Links />
        </head>
        <body>
            <Theme hasBackground>
                <MessageBoxProvider>
                    {children}
                </MessageBoxProvider>
            </Theme>
            <ScrollRestoration />
            <Scripts />
        </body>
    </html>
}

export default function App() {
    useEffect(() => {
        registerSW({
            immediate: true,
            onRegisterError: (error) => console.error('Service worker registration failed:', error),
            onRegisteredSW: () => console.log('Service worker has been registered!'),
            onNeedRefresh: () => console.log('App needs to be refreshed!'),
            onOfflineReady: () => alert('App is ready to work offline!')
        })
        posthog.init((globalThis as any).__PUBLIC_POSTHOG_KEY, { api_host: (globalThis as any).__PUBLIC_POSTHOG_HOST })
    }, [])

    return <Outlet />
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
    let message = "Oops!"
    let details = "An unexpected error occurred."
    let stack: string | undefined

    if (isRouteErrorResponse(error)) {
        message = error.status === 404 ? "404" : "Error"
        details =
            error.status === 404
                ? "The requested page could not be found."
                : error.statusText || details
    } else if (import.meta.env.DEV && error && error instanceof Error) {
        details = error.message
        stack = error.stack
    }

    return <Container p="4" asChild>
        <main>
            <h1>{message}</h1>
            <p>{details}</p>
            {stack && (
                <pre className="w-full p-4 overflow-x-auto">
                    <code>{stack}</code>
                </pre>
            )}
        </main>
    </Container>
}
