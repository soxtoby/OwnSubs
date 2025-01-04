import { useMemo, useReducer, useRef } from "react";
import { data, isRouteErrorResponse } from "react-router";
import { useGlobalEventListener } from "../DomUtils";
import { fileNameWithoutExtension, getSubs, getVideo, setSubs } from "../storage";
import { TranscriberProvider } from "../whisper/Transcriber";
import type { Route } from "./+types/EditRoute";
import { MainUI } from "./MainUI";
import { readSubsFile, Subtitles } from "./Subtitles";
import { MissingVideoMessage } from "./SubtitlesPanel";
import { VideoControl } from "./VideoControl";
import { emptyArray } from "../utils";

export async function clientLoader({ params: { fileName } }: Route.ClientLoaderArgs) {
    let videoFile = await getVideo(file => fileNameWithoutExtension(file.name) == fileName)
    if (!videoFile)
        throw data("Video not found", { status: 404 })
    let subsFile = videoFile && await getSubs(fileName)
    let cues = subsFile ? await readSubsFile(subsFile) : emptyArray
    return { videoFile, subsFile, cues } as const
}

export function HydrateFallback({ params: { fileName } }: Route.HydrateFallbackProps) {
    return <MainUI fileName={fileName} loading />
}

export function ErrorBoundary({ error, params: { fileName } }: Route.ErrorBoundaryProps) {
    if (isRouteErrorResponse(error) && error.status == 404)
        return <MainUI><MissingVideoMessage fileName={fileName} /></MainUI>
    else
        throw error
}

export default function Edit({ loaderData: { videoFile, subsFile, cues }, params: { fileName } }: Route.ComponentProps) {
    let videoRef = useRef<HTMLVideoElement>(null)
    let video = useMemo(() => videoFile && new VideoControl(videoFile, videoRef), [videoFile])

    let [, rerender] = useReducer(() => ({}), {})

    let subtitles = useMemo(() => new Subtitles(onCuesUpdated, cues), [cues])

    useGlobalEventListener('keydown', onKeyDown)

    return <TranscriberProvider>
        <MainUI fileName={fileName} videoRef={videoRef} video={video ?? undefined} subtitles={subtitles} />
    </TranscriberProvider>

    function onCuesUpdated(subtitles: Subtitles, committed: boolean) {
        rerender()
        if (subsFile && committed)
            setSubs(new File([subtitles.generateVTT()], subsFile.name), fileName)
    }

    function onKeyDown(event: KeyboardEvent) {
        if (event.ctrlKey && event.key == 'z') {
            event.preventDefault()
            subtitles.undo()
        } else if (event.ctrlKey && event.key == 'Z') {
            event.preventDefault()
            subtitles.redo()
        }
    }
}