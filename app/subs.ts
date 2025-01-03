import { useMemo } from "react";
import { useFetcher } from "react-router";
import { $path } from "safe-routes";
import type { Route } from "./+types/subs";
import { setSubs } from "./storage";

export async function clientAction({ request, params: { videoFileName } }: Route.ClientActionArgs) {
    let formData = await request.formData()
    let file = formData.get(fileKey)
    if (file instanceof File)
        await setSubs(file, videoFileName)
    else
        throw new Error('No file uploaded')
}

export function useSubsFetcher() {
    let fetcher = useFetcher({ key: 'subsFile' })

    return useMemo(() => ({
        setSubs(file: File, videoFileName: string) {
            let form = new FormData()
            form.set(fileKey, file)
            fetcher.submit(form, { method: 'POST', action: $path('/subs/:videoFileName', { videoFileName }), encType: 'multipart/form-data' })
        },
        state: fetcher.state
    }), [fetcher])
}

const fileKey = 'file'