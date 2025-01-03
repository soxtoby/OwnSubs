import { Card, Flex, Text } from "@radix-ui/themes";
import { useMemo, useReducer, useRef, useState } from "react";
import type { Route } from "./+types/edit";
import { selectFile, useGlobalEventListener } from "./DomUtils";
import { Subtitles, readSubsFile } from "./Subtitles";
import { SubtitlesPanel } from "./SubtitlesPanel";
import { TimelinePanel } from "./TimelinePanel";
import { Toolbar } from "./Toolbar";
import { VideoControl } from "./VideoControl";
import { VideoPanel } from "./VideoPanel";
import { fileNameWithoutExtension, getSubs, getVideo } from "./storage";
import { useSubsFetcher } from "./subs";
import { useVideoFetcher } from "./video";
import { useTranscriber } from "./whisper/useTranscriber";

export async function clientLoader(args: Route.ClientLoaderArgs) {
    let videoFile = await getVideo(file => fileNameWithoutExtension(file.name) == args.params.fileName)
    let subsFile = videoFile && await getSubs(videoFile.name)
    let cues = subsFile ? await readSubsFile(subsFile) : []
    return { videoFile, subsFile, cues } as const
}

export default function Edit({ loaderData: { videoFile, subsFile, cues } }: Route.ComponentProps) {
    let videoRef = useRef<HTMLVideoElement>(null)
    let video = useMemo(
        () => videoFile
            ? new VideoControl(videoFile, videoRef)
            : new VideoControl(null, videoRef),
        [videoFile])

    let [, rerender] = useReducer(() => ({}), {})

    let subtitles = useMemo(() => new Subtitles(onCuesUpdated, cues), [cues])

    let videoFetcher = useVideoFetcher()
    let subsFetcher = useSubsFetcher()

    let transcriber = useTranscriber()

    useGlobalEventListener('keydown', onKeyDown)
    let [isDraggingOver, setIsDraggingOver] = useState(false);

    return <Flex direction="column" height="100%">
        <Toolbar video={video} subtitles={subtitles} selectVideo={selectVideo} transcriber={transcriber} />
        <Flex flexGrow="1" direction="column" overflow="hidden" onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
            <Flex flexGrow="1" align="stretch" overflow="hidden">
                <SubtitlesPanel video={video} subtitles={subtitles} transcriber={transcriber} selectVideo={selectVideo} subsLoading={subsFetcher.state == 'submitting'} />
                <VideoPanel videoRef={videoRef} video={video} subtitles={subtitles} videoLoading={videoFetcher.state == 'submitting'} />
            </Flex>
            <TimelinePanel subtitles={subtitles} video={video} />
            {isDraggingOver &&
                <Flex align="center" justify="center" className="dragOverlay">
                    <Card>
                        <Text>Drop video or subtitles file here</Text>
                    </Card>
                </Flex>
            }
        </Flex>
    </Flex>

    function onCuesUpdated(subtitles: Subtitles, committed: boolean) {
        rerender()
        if (subsFile && committed)
            subsFetcher.setSubs(new File([subtitles.generateVTT()], subsFile.name), videoFile!.name)
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

    async function selectVideo() {
        let file = await selectFile('video/*')
        if (file)
            videoFetcher.setVideo(file)
    }

    function onDragOver(event: React.DragEvent) {
        let file = event.dataTransfer.files[0]
        if (file?.type == 'text/vtt' || file?.type.startsWith("video/")) {
            event.preventDefault()
            setIsDraggingOver(true)
        }
    }

    function onDragLeave(event: React.DragEvent) {
        if (!event.relatedTarget || !event.currentTarget.contains(event.relatedTarget as Node)) {
            event.preventDefault()
            setIsDraggingOver(false)
        }
    }

    async function onDrop(event: React.DragEvent) {
        event.preventDefault()
        setIsDraggingOver(false)

        let file = event.dataTransfer.files[0]

        if (file?.type == 'text/vtt') {
            subsFetcher.setSubs(file, videoFile!.name) // NOCOMMIT handle no videoFile
        } else if (file?.type.startsWith("video/")) {
            if (video?.src)
                URL.revokeObjectURL(video.src)
            videoFetcher.setVideo(file)
        }
    }
}