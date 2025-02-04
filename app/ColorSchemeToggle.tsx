import { SunIcon } from "@radix-ui/react-icons";
import { Flex, IconButton, Tooltip } from "@radix-ui/themes";
import { useEffect, useState } from "react";

export function ColorSchemeToggle() {
    let [colorScheme, setColorScheme] = useState(() => globalThis.localStorage?.getItem(storageKey) ?? browserColorScheme())

    useEffect(() => {
        document.body.classList.remove('light', 'dark')
        document.body.classList.add(colorScheme)
    }, [colorScheme])

    return <Flex p="2">
        <Tooltip content="Toggle light/dark mode">
            <IconButton aria-label="Toggle light/dark mode" size="3" variant="ghost" onClick={() => toggleColorScheme()}>
                <SunIcon />
            </IconButton>
        </Tooltip>
    </Flex>

    function toggleColorScheme() {
        let newScheme = colorScheme == 'light' ? 'dark' : 'light'

        if (newScheme == browserColorScheme())
            localStorage.removeItem(storageKey)
        else
            localStorage.setItem(storageKey, newScheme)

        setColorScheme(newScheme)
    }
}

function browserColorScheme(): ColorScheme {
    return !!globalThis.window?.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
}

type ColorScheme = 'light' | 'dark'

const storageKey = 'ownsubs:color-scheme'