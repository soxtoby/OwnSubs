const directoryName = 'subs'

export async function getVideo(predicate: (file: File) => boolean) {
    try {
        return await (await findVideoFile(predicate))?.getFile() ?? null
    } catch (e) {
        console.error(e)
        return null
    }
}

export async function setVideo(video: File, fileName: string, overwrite = false) {
    let appDirectory = await getOrCreateAppDirectory()

    let existingFile = await findVideoFile(f => fileNameWithoutExtension(f.name) == fileName)
    if (existingFile) {
        if (overwrite)
            appDirectory.removeEntry(existingFile.name) // Avoid name conflicts
        else
            return false
    }

    let videoHandle = await appDirectory.getFileHandle(fileName + extension(video.name), { create: true })
    let writable = await videoHandle.createWritable()
    await writable.write(video)
    await writable.close()
    return true
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

export async function index() {
    let appDirectory = await getOrCreateAppDirectory()

    let videos = new Map<string, File>()
    let subtitles = new Map<string, File>()
    for await (let entry of appDirectory.values()) {
        if (entry.kind == 'file') {
            let fileEntry = entry as FileSystemFileHandle
            let file = await fileEntry.getFile()
            if (file.type.startsWith('video/'))
                videos.set(fileNameWithoutExtension(file.name), file)
            else if (file.type == 'text/vtt')
                subtitles.set(fileNameWithoutExtension(file.name), file)
        }
    }
    return Array.from(videos)
        .map(([name, video]) => ({ name, video, lastModified: new Date(Math.max(video.lastModified, subtitles.get(name)?.lastModified ?? 0)) }))
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

export async function deleteFile(fileName: string) {
    let appDirectory = await getOrCreateAppDirectory()

    for await (let entry of appDirectory.keys()) {
        if (fileNameWithoutExtension(entry) == fileName)
            await appDirectory.removeEntry(entry)
    }
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

function extension(fileName: string): string | undefined {
    return fileName.match(/\.[^.]+$/)![0]
}