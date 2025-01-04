import { Card, Flex, Slot, Slottable, Text } from "@radix-ui/themes"
import { useState, type PropsWithChildren } from "react"
import { useMessageBox } from "./MessageBox"
import { useSubsFetcher } from "./subs/SubsFetcher"
import { useVideoFetcher } from "./video/VideoFetcher"

export interface IDropAreaProps {
    videoFileName?: string
}

export function DropArea({ videoFileName, children }: PropsWithChildren<IDropAreaProps>) {
    let [isDraggingOver, setIsDraggingOver] = useState(false)

    let videoFetcher = useVideoFetcher()
    let subsFetcher = useSubsFetcher()
    let { alert } = useMessageBox()

    return <Slot onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
        <Slottable>{children}</Slottable>
        {isDraggingOver &&
            <Flex align="center" justify="center" className="dragOverlay">
                <Card>
                    <Text>Drop video or subtitles file here</Text>
                </Card>
            </Flex>
        }
    </Slot>

    function onDragOver(event: React.DragEvent) {
        let item = event.dataTransfer.items[0]
        if (item?.kind == 'file'
            && (item?.type.startsWith("video/")
                || item?.type == 'text/vtt')
        ) {
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

        if (file?.type.startsWith("video/")) {
            videoFetcher.setVideo(file)
        } else if (file?.type == 'text/vtt') {
            if (videoFileName)
                subsFetcher.setSubsFile(file, videoFileName)
            else
                alert({ title: "No video", message: "Please load a video before loading any subtitles." })
        } else {
            alert({ title: "Invalid file", message: "Please drop a video or subtitles file." })
        }
    }
}