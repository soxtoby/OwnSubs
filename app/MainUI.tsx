import { Card, Flex, Text } from "@radix-ui/themes";
import { useState, type Ref } from "react";
import { useMessageBox } from "./MessageBox";
import { useSubsFetcher } from "./subs";
import type { Subtitles } from "./Subtitles";
import { SubtitlesPanel } from "./SubtitlesPanel";
import { TimelinePanel } from "./TimelinePanel";
import { Toolbar } from "./Toolbar";
import { useVideoFetcher } from "./video";
import type { VideoControl } from "./VideoControl";
import { VideoPanel } from "./VideoPanel";

export interface IMainUIProps {
    fileName: string
    videoRef?: Ref<HTMLVideoElement>
    video?: VideoControl
    subtitles?: Subtitles
    loading?: boolean
}

export function MainUI({ fileName, videoRef, video, subtitles, loading }: IMainUIProps) {
    let [isDraggingOver, setIsDraggingOver] = useState(false)

    let videoFetcher = useVideoFetcher()
    let subsFetcher = useSubsFetcher()
    let { alert } = useMessageBox()

    return <Flex direction="column" height="100%">
        <Toolbar fileName={fileName} video={video} subtitles={subtitles} />
        <Flex flexGrow="1" direction="column" overflow="hidden" onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
            <Flex flexGrow="1" align="stretch" overflow="hidden">
                <SubtitlesPanel video={video} subtitles={subtitles} />
                <VideoPanel videoRef={videoRef} video={video} subtitles={subtitles} loading={loading || videoFetcher.state == 'submitting'} />
            </Flex>
            <TimelinePanel video={video} subtitles={subtitles} />
            {isDraggingOver &&
                <Flex align="center" justify="center" className="dragOverlay">
                    <Card>
                        <Text>Drop video or subtitles file here</Text>
                    </Card>
                </Flex>
            }
        </Flex>
    </Flex>

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

        if (file?.type.startsWith("video/")) {
            if (video?.src)
                URL.revokeObjectURL(video.src)
            videoFetcher.setVideo(file)
        } else if (file?.type == 'text/vtt') {
            if (video)
                subsFetcher.setSubs(file, video.file.name)
            else
                alert({ title: "No video", message: "Please load a video before loading any subtitles." })
        } else {
            alert({ title: "Invalid file", message: "Please drop a video or subtitles file." })
        }
    }
}