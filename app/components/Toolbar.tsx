import { ClipboardCopyIcon, DownloadIcon, UploadIcon } from "@radix-ui/react-icons"
import { Button, DropdownMenu, Flex, Tooltip } from "@radix-ui/themes"
import { useState } from "react"
import type { Transcriber } from "../whisper/useTranscriber"
import { selectFile } from "./DomUtils"
import { type Subtitles } from "./Subtitles"
import { TranscribeButton } from "./TranscribeButton"
import type { VideoControl } from "./VideoControl"
import { subtitlesFileName } from "./storage"

interface IToolbarProps {
    video: VideoControl
    subtitles: Subtitles
    selectVideo: () => void
    setSubsFile: (file: File) => void
    transcriber: Transcriber
}

export function Toolbar({ subtitles, video, selectVideo, setSubsFile, transcriber }: IToolbarProps) {
    let [copied, setCopied] = useState(false)

    return <Flex gap="4" pt="2" px="2">
        {video.file
            ? <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                    <Button variant="soft">
                        {video.file!.name.replace(/\.[^.]+$/, '')}
                        <DropdownMenu.TriggerIcon />
                    </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content>
                    <DropdownMenu.Item onClick={selectVideo}>Load new video&hellip;</DropdownMenu.Item>
                    <DropdownMenu.Item onClick={uploadSubtitles}>Load subtitles&hellip;</DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu.Root>
            : <Button onClick={selectVideo}><UploadIcon /> Load a video</Button>
        }
        <Tooltip content={copied ? "Copied!" : null} open={copied}>
            <Button onClick={copyTranscript} disabled={!video.file}><ClipboardCopyIcon /> Copy transcript</Button>
        </Tooltip>
        <Button onClick={downloadSubtitles} disabled={!video.file}><DownloadIcon /> Download subtitles</Button>
        <TranscribeButton subtitles={subtitles} video={video} transcriber={transcriber} />
    </Flex>

    async function copyTranscript() {
        try {
            await navigator.clipboard.writeText(subtitles.generateTranscript())
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch { }
    }

    async function uploadSubtitles() {
        let file = await selectFile('text/vtt')
        if (file && file.type == 'text/vtt')
            setSubsFile(file)
    }

    function downloadSubtitles() {
        let blob = new Blob([subtitles.generateVTT()], { type: 'text/vtt' })
        let url = URL.createObjectURL(blob)
        let a = document.createElement('a')
        a.href = url
        a.download = subtitlesFileName(video.file!.name)
        a.click()
        URL.revokeObjectURL(url)
    }
}