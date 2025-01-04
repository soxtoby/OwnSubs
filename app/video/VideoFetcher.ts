import { useEffect, useMemo, useState } from "react"
import { useFetcher } from "react-router"
import { $path } from "safe-routes"
import { selectFile } from "../DomUtils"
import { useMessageBox } from "../MessageBox"
import { fileNameWithoutExtension } from "../storage"
import type { clientAction } from "./VideoRoute"

export function useVideoFetcher() {
    let fetcher = useFetcher<typeof clientAction>({ key: 'videoFile' })
    let [saving, setSaving] = useState(null as null | { file: File, fileName: string })

    let helper = useMemo(() => ({
        async selectVideo(fileName?: string) {
            let file = await selectFile('video/*')
            if (file)
                this.setVideo(file, fileName, !!fileName)
        },
        setVideo(file: File, fileName?: string, overwrite = false) {
            let form = new FormData()
            form.set(fileKey, file)
            fileName ??= fileNameWithoutExtension(file.name)
            setSaving({ file, fileName })
            fetcher.submit(form, {
                method: 'POST',
                action: $path('/video/:fileName', { fileName }, { overwrite }),
                encType: 'multipart/form-data'
            })
        },
        async deleteVideo(fileName: string) {
            await prompt({
                title: "Delete video",
                message: `Are you sure you want to delete the "${fileName}" video and subtitles?`,
                options: { confirm: "Delete" }
            })
            fetcher.submit(null, { method: 'DELETE', action: $path('/video/:fileName', { fileName }) })
        }
    }), [fetcher])

    let { prompt } = useMessageBox()
    useEffect(() => {
        if (saving) {
            if (fetcher.data?.alreadyExists) {
                prompt({
                    title: "Video already exists",
                    message: "Video with the same name already exists. Do you want to overwrite it?",
                    options: { confirm: "Overwrite" },
                }).then(() => {
                    helper.setVideo(saving.file, saving.fileName, true)
                    setSaving(null)
                })
            } else {
                setSaving(null)
            }
        }
    }, [fetcher.data])

    return helper
}

export const fileKey = 'file'