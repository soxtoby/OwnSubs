import { Card, Flex, Text } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useReducer, useRef, useState } from "react";
import type { Route } from "./+types/home";
import { selectFile, useGlobalEventListener } from "./DomUtils";
import { Subtitles, readSubsFile } from "./Subtitles";
import { SubtitlesPanel } from "./SubtitlesPanel";
import { TimelinePanel } from "./TimelinePanel";
import { Toolbar } from "./Toolbar";
import { VideoControl } from "./VideoControl";
import { VideoPanel } from "./VideoPanel";
import { useFileStorage } from "./storage";
import { useTranscriber } from "./whisper/useTranscriber";

export default function Home(params: Route.ComponentProps) {
    let videoRef = useRef<HTMLVideoElement>(null)
    let { videoFile, setVideoFile, subsFile, setSubsFile, videoLoading, subsLoading } = useFileStorage()
    let video = useMemo(
        () => videoFile
            ? new VideoControl(videoFile, videoRef)
            : new VideoControl(null, videoRef),
        [videoFile])

    let [, rerender] = useReducer(() => ({}), {})
    let { data: subtitles, isFetching: cuesLoading } = useQuery({
        queryKey: ['subtitles', subsFile?.name],
        initialData: new Subtitles(onCuesUpdated, []),
        queryFn: async () => new Subtitles(onCuesUpdated, await readSubsFile(subsFile!)),
        enabled: !!subsFile,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    })

    let transcriber = useTranscriber()

    useGlobalEventListener('keydown', onKeyDown)
    let [isDraggingOver, setIsDraggingOver] = useState(false);

    return <Flex direction="column" height="100%">
        <Toolbar video={video} subtitles={subtitles} selectVideo={selectVideo} setSubsFile={setSubsFile} transcriber={transcriber} />
        <Flex flexGrow="1" direction="column" overflow="hidden" onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
            <Flex flexGrow="1" align="stretch" overflow="hidden">
                <SubtitlesPanel video={video} subtitles={subtitles} transcriber={transcriber} selectVideo={selectVideo} subsLoading={subsLoading || cuesLoading} />
                <VideoPanel videoRef={videoRef} video={video} subtitles={subtitles} videoLoading={videoLoading} />
            </Flex>
            <TimelinePanel subtitles={subtitles} video={video} />
            {isDraggingOver &&
                <Flex align="center" justify="center" className="video-dragOverlay">
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
            setSubsFile(new File([subtitles.generateVTT()], subsFile.name))
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
            setVideoFile(file)
    }

    function onDragOver(event: React.DragEvent) {
        event.preventDefault()
        setIsDraggingOver(true)
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
            setSubsFile(file)
        } else if (file?.type.startsWith("video/")) {
            if (video?.src)
                URL.revokeObjectURL(video.src)
            setVideoFile(file)
        }
    }
}