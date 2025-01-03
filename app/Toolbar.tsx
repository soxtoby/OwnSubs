import { ClipboardCopyIcon, DownloadIcon, UploadIcon } from "@radix-ui/react-icons"
import { Button, DropdownMenu, Flex, Tooltip } from "@radix-ui/themes"
import { useState } from "react"
import { selectFile } from "./DomUtils"
import { type Subtitles } from "./Subtitles"
import { TranscribeButton } from "./TranscribeButton"
import type { VideoControl } from "./VideoControl"
import { subtitlesFileName } from "./storage"
import { useSubsFetcher } from "./subs"
import { useVideoFetcher } from "./video"

interface IToolbarProps {
    fileName?: string
    video?: VideoControl
    subtitles?: Subtitles
}

export function Toolbar({ fileName, subtitles, video }: IToolbarProps) {
    let [copied, setCopied] = useState(false)

    let videoFetcher = useVideoFetcher()
    let subsFetcher = useSubsFetcher()

    return <Flex gap="4" pt="2" px="2">
        {fileName
            ? <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                    <Button variant="soft">
                        {fileName}
                        <DropdownMenu.TriggerIcon />
                    </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content>
                    <DropdownMenu.Item onClick={() => videoFetcher.selectVideo()}>Load new video&hellip;</DropdownMenu.Item>
                    {video && <DropdownMenu.Item onClick={uploadSubtitles}>Load subtitles&hellip;</DropdownMenu.Item>}
                </DropdownMenu.Content>
            </DropdownMenu.Root>
            : <Button onClick={() => videoFetcher.selectVideo()}><UploadIcon /> Load a video</Button>
        }
        <Tooltip content={copied ? "Copied!" : null} open={copied}>
            <Button onClick={copyTranscript} disabled={!video}><ClipboardCopyIcon /> Copy transcript</Button>
        </Tooltip>
        <Button onClick={downloadSubtitles} disabled={!video}><DownloadIcon /> Download subtitles</Button>
        <TranscribeButton subtitles={subtitles} video={video} />
    </Flex>

    async function copyTranscript() {
        try {
            await navigator.clipboard.writeText(subtitles!.generateTranscript())
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch { }
    }

    async function uploadSubtitles() {
        let file = await selectFile('text/vtt')
        if (file && file.type == 'text/vtt')
            subsFetcher.setSubs(file, video!.file.name)
    }

    function downloadSubtitles() {
        let blob = new Blob([subtitles!.generateVTT()], { type: 'text/vtt' })
        let url = URL.createObjectURL(blob)
        let a = document.createElement('a')
        a.href = url
        a.download = subtitlesFileName(video!.file.name)
        a.click()
        URL.revokeObjectURL(url)
    }
}