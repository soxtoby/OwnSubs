import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback, useMemo } from "react"

const directoryName = 'titleist'

export function useFileStorage() {
    let queryClient = useQueryClient()

    let { data: videoFile, isLoading: videoLoading } = useQuery({
        queryKey: ['videoFile'],
        queryFn: () => getVideo(),
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    })

    let { data: subsFile, isLoading: subsLoading } = useQuery({
        queryKey: ['subs', videoFile?.name],
        queryFn: () => getSubs(videoFile!.name),
        enabled: !!videoFile,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
    })

    let setVideoFile = useCallback(async (videoFile: File) => {
        await setVideo(videoFile)
        queryClient.setQueryData(['videoFile'], videoFile)
    }, [queryClient])

    let setSubsFile = useCallback(async (subsFile: File) => {
        if (videoFile) {
            await setSubs(subsFile, videoFile.name)
            queryClient.setQueryData(['subs', videoFile.name], subsFile)
        }
    }, [queryClient, videoFile])

    return useMemo(() => ({
        videoFile,
        setVideoFile,
        subsFile,
        setSubsFile,
        videoLoading,
        subsLoading
    }), [videoFile, setVideoFile, subsFile, setSubsFile, videoLoading, subsLoading])
}

async function getVideo() {
    try {
        return await (await findVideoFile())?.getFile() ?? null
    } catch (e) {
        console.error(e)
        return null
    }
}

async function setVideo(video: File) {
    let appDirectory = await getOrCreateAppDirectory()

    let existingFile = await findVideoFile()
    if (existingFile)
        appDirectory.removeEntry(existingFile.name) // Only store 1 video at a time

    let videoHandle = await appDirectory.getFileHandle(video.name, { create: true })
    let writable = await videoHandle.createWritable()
    await writable.write(video)
    await writable.close()
}

async function findVideoFile() {
    try {
        let appDirectory = await getOrCreateAppDirectory()

        for await (let entry of appDirectory.values()) {
            if (entry.kind == 'file') {
                let file = await entry.getFile()
                if (file.type.startsWith('video/'))
                    return entry
            }
        }
    } catch (e) {
        console.error(e)
    }
}

async function getSubs(videoFileName: string) {
    try {
        let appDirectory = await getOrCreateAppDirectory()
        let subsFileHandle = await appDirectory.getFileHandle(subtitlesFileName(videoFileName), { create: true })
        let file = await subsFileHandle.getFile()
        return file
    } catch (e) {
        console.error(e)
        return null
    }
}

async function setSubs(subs: File, videoFileName: string) {
    let appDirectory = await getOrCreateAppDirectory()
    let subsFileHandle = await appDirectory.getFileHandle(subtitlesFileName(videoFileName), { create: true })
    let writable = await subsFileHandle.createWritable()
    await writable.write(subs)
    await writable.close()
}

async function getOrCreateAppDirectory() {
    let root = await navigator.storage.getDirectory()
    return await root.getDirectoryHandle(directoryName, { create: true })
}

export function subtitlesFileName(videoFileName: string) {
    return videoFileName.replace(/\.[^.]+$/, '.vtt')
}