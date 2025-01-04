import { useMemo } from "react"
import { useFetcher } from "react-router"
import { $path } from "safe-routes"

export function useSubsFetcher() {
    let fetcher = useFetcher({ key: 'subsFile' })

    return useMemo(() => ({
        setSubsFile(file: File, fileName: string) {
            let form = new FormData()
            form.set(fileKey, file)
            fetcher.submit(form, { flushSync: true, method: 'POST', action: $path('/subs/:fileName', { fileName }), encType: 'multipart/form-data' })
        },
        state: fetcher.state
    }), [fetcher])
}

export const fileKey = 'file'