import { Flex, Skeleton } from "@radix-ui/themes"
import { useEffect, useRef, type Ref } from "react"
import { toVTT, type Subtitles } from "./Subtitles"
import type { VideoControl } from "./VideoControl"

interface IVideoPanelProps {
    videoRef?: Ref<HTMLVideoElement>
    video?: VideoControl
    subtitles?: Subtitles
    loading: boolean
}

export function VideoPanel({ videoRef, video, subtitles, loading }: IVideoPanelProps) {
    let subtitlesRef = useRef<HTMLTrackElement>(null)

    useEffect(() => {
        if (subtitlesRef.current) {
            for (let cue of Array.from(subtitlesRef.current.track.cues ?? []))
                subtitlesRef.current.track.removeCue(cue)
            for (let cue of subtitles!.cues)
                subtitlesRef.current.track.addCue(toVTT(cue))
        }
    })

    return <Flex
        flexGrow="1"
        p="2"
        maxWidth="33vw"
        position="relative"
        align="start"
        justify="center"
        className="videoPanel"
    >
        {video && subtitles &&
            <Skeleton loading={loading}>
                <video ref={videoRef} controls src={video.src}>
                    <track ref={subtitlesRef} id="subtitles" kind="subtitles" label="Subtitles" lang="en" default />
                </video>
            </Skeleton>
        }
    </Flex>
}