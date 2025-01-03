import { useMemo } from "react";
import { redirect, useFetcher } from "react-router";
import { $path } from "safe-routes";
import type { Route } from "./+types/video";
import { selectFile } from "./DomUtils";
import { fileNameWithoutExtension, setVideo } from "./storage";

export async function clientAction({ request }: Route.ClientActionArgs) {
    let formData = await request.formData()
    let file = formData.get(fileKey)
    if (file instanceof File) {
        await setVideo(file)
        return redirect($path('/edit/:fileName', { fileName: fileNameWithoutExtension(file.name) }))
    } else {
        throw new Error('No file uploaded')
    }
}

export function useVideoFetcher() {
    let fetcher = useFetcher({ key: 'videoFile' })

    return useMemo(() => ({
        async selectVideo() {
            let file = await selectFile('video/*')
            if (file)
                this.setVideo(file)
        },
        setVideo(file: File) {
            let form = new FormData()
            form.set(fileKey, file)
            fetcher.submit(form, { method: 'POST', action: $path('/video'), encType: 'multipart/form-data' })
        },
        state: fetcher.state
    }), [fetcher])
}

const fileKey = 'file'