import { useEffect, useMemo } from "react"
import { useFetcher } from "react-router"
import { $path } from "safe-routes"
import { selectFile } from "../DomUtils"
import { useMessageBox } from "../MessageBox"
import type { clientAction } from "./VideoRoute"

export function useVideoFetcher() {
    let fetcher = useFetcher<typeof clientAction>({ key: 'videoFile' })

    let helper = useMemo(() => ({
        async selectVideo() {
            let file = await selectFile('video/*')
            if (file)
                this.setVideo(file)
        },
        setVideo(file: File, overwrite = false) {
            let form = new FormData()
            form.set(fileKey, file)
            fetcher.submit(form, { method: 'POST', action: $path('/video', { overwrite }), encType: 'multipart/form-data' })
        },
        state: fetcher.state
    }), [fetcher])

    let { prompt } = useMessageBox()
    useEffect(() => {
        if (fetcher.data?.alreadyExists) {
            prompt({
                title: "Video already exists",
                message: "Video with the same name already exists. Do you want to overwrite it?",
                confirm: "Overwrite",
            }).then(() => helper.setVideo(fetcher.formData!.get('file') as File, true))
        }
    }, [fetcher.data])

    return helper
}

export const fileKey = 'file'