const directoryName = 'subs'

export async function getVideo(predicate: (file: File) => boolean) {
    try {
        return await (await findVideoFile(predicate))?.getFile() ?? null
    } catch (e) {
        console.error(e)
        return null
    }
}

export async function setVideo(video: File) {
    let appDirectory = await getOrCreateAppDirectory()

    let existingFile = await findVideoFile(() => true)
    if (existingFile)
        appDirectory.removeEntry(existingFile.name) // Only store 1 video at a time

    let videoHandle = await appDirectory.getFileHandle(video.name, { create: true })
    let writable = await videoHandle.createWritable()
    await writable.write(video)
    await writable.close()
}

async function findVideoFile(predicate: (file: File) => boolean) {
    try {
        let appDirectory = await getOrCreateAppDirectory()

        for await (let entry of appDirectory.values()) {
            if (entry.kind == 'file') {
                let fileEntry = entry as FileSystemFileHandle
                let file = await fileEntry.getFile()
                if (file.type.startsWith('video/') && predicate(file))
                    return fileEntry
            }
        }
    } catch (e) {
        console.error(e)
    }
}

export async function getSubs(videoFileName: string) {
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

export async function setSubs(subs: File, videoFileName: string) {
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
    return fileNameWithoutExtension(videoFileName) + '.vtt'
}

export function fileNameWithoutExtension(fileName: string) {
    return fileName.replace(/\.[^.]+$/, '')
}