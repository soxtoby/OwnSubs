import { useMemo, useReducer, useRef } from "react";
import { useGlobalEventListener } from "../DomUtils";
import { MainUI } from "./MainUI";
import { fileNameWithoutExtension, getSubs, getVideo, setSubs } from "../storage";
import { TranscriberProvider } from "../whisper/Transcriber";
import type { Route } from "./+types/EditRoute";
import { readSubsFile, Subtitles } from "./Subtitles";
import { VideoControl } from "./VideoControl";

export async function clientLoader(args: Route.ClientLoaderArgs) {
    let videoFile = await getVideo(file => fileNameWithoutExtension(file.name) == args.params.fileName)
    let subsFile = videoFile && await getSubs(videoFile.name)
    let cues = subsFile ? await readSubsFile(subsFile) : []
    return { videoFile, subsFile, cues } as const
}

export function HydrateFallback({ params: { fileName } }: Route.HydrateFallbackProps) {
    return <MainUI fileName={fileName} loading />
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
            setSubs(new File([subtitles.generateVTT()], subsFile.name), videoFile!.name)
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