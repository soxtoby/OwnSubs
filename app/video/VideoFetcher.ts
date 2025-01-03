import { useMemo } from "react"
import { useFetcher } from "react-router"
import { $path } from "safe-routes"
import { selectFile } from "../DomUtils"

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

export const fileKey = 'file'