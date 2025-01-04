import { Flex } from "@radix-ui/themes";
import { type PropsWithChildren, type Ref } from "react";
import { DropArea } from "../DropArea";
import type { Subtitles } from "./Subtitles";
import { SubtitlesPanel } from "./SubtitlesPanel";
import { TimelinePanel } from "./TimelinePanel";
import { Toolbar } from "./Toolbar";
import type { VideoControl } from "./VideoControl";
import { VideoPanel } from "./VideoPanel";

export interface IMainUIProps {
    fileName?: string
    videoRef?: Ref<HTMLVideoElement>
    video?: VideoControl
    subtitles?: Subtitles
    loading?: boolean
}

export function MainUI({ fileName, videoRef, video, subtitles, loading, children }: PropsWithChildren<IMainUIProps>) {
    return <Flex direction="column" height="100%">
        <Toolbar fileName={fileName} video={video} subtitles={subtitles} />
        <DropArea videoFileName={video?.file.name}>
            <Flex flexGrow="1" direction="column" overflow="hidden">
                <Flex flexGrow="1" align="stretch" overflow="hidden">
                    <SubtitlesPanel video={video} subtitles={subtitles}>{children}</SubtitlesPanel>
                    <VideoPanel videoRef={videoRef} video={video} subtitles={subtitles} loading={!!loading} />
                </Flex>
                <TimelinePanel video={video} subtitles={subtitles} />
            </Flex>
        </DropArea>
    </Flex>
}