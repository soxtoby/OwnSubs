import { useEffect, useMemo } from "react"
import { useFetcher } from "react-router"
import { $path } from "safe-routes"
import { selectFile } from "../DomUtils"
import { useMessageBox } from "../MessageBox"
import { fileNameWithoutExtension } from "../storage"
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
            fetcher.submit(form, {
                method: 'POST',
                action: $path('/video/:fileName',
                    { fileName: fileNameWithoutExtension(file.name) },
                    { overwrite }),
                encType: 'multipart/form-data'
            })
        },
        async deleteVideo(fileName: string) {
            await prompt({ title: "Delete video", message: `Are you sure you want to delete the "${fileName}" video and subtitles?`, confirm: "Delete" })
            fetcher.submit(null, { method: 'DELETE', action: $path('/video/:fileName', { fileName }) })
        }
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