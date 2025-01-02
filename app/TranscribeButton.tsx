import { MagicWandIcon } from "@radix-ui/react-icons";
import { Box, Button, Progress, Spinner, Tooltip } from "@radix-ui/themes";
import { useEffect } from "react";
import { cueGap, type ICue, type Subtitles } from "./Subtitles";
import type { VideoControl } from "./VideoControl";
import { type Transcriber, type TranscriberData } from "./whisper/useTranscriber";

interface ITranscribeButtonProps {
    video: VideoControl
    subtitles: Subtitles
    transcriber: Transcriber
}

export function TranscribeButton({ video, subtitles, transcriber }: ITranscribeButtonProps) {
    useEffect(() => {
        if (transcriber.output) {
            subtitles.replaceAll(convertTranscriberChunksToCues(transcriber.output, video), false)

            if (!transcriber.isBusy)
                subtitles.commit()
        }
    }, [transcriber.output])

    let progress = transcriber.isModelLoading
        ? modelLoadingProgress(transcriber)
        : 100

    let buttonIcon = transcriber.isBusy
        ? <Spinner loading />
        : <MagicWandIcon />

    let buttonText = transcriber.isModelLoading ? "Loading model..."
        : transcriber.isBusy ? "Transcribing..."
            : "Transcribe video"

    return <Tooltip open={transcriber.isModelLoading} content={<Box p="2" width="200px"><Progress value={progress || null} /></Box>}>
        <Button onClick={transcribe} disabled={!video.file || transcriber.isBusy}>{buttonIcon} {buttonText}</Button>
    </Tooltip>

    async function transcribe() {
        if (!transcriber.isBusy && video.audio)
            transcriber.start(await video.audio)
    }
}

function modelLoadingProgress(transcriber: Transcriber) {
    let totalBytes = transcriber.progressItems.reduce((sum, item) => sum + (item.total ?? 0), 0)
    let totalLoaded = transcriber.progressItems.reduce((sum, item) => sum + (item.loaded ?? 0), 0)
    return totalBytes
        ? totalLoaded / totalBytes * 100
        : 0
}

function convertTranscriberChunksToCues(transcriberData: TranscriberData, video: VideoControl): ICue[] {
    let cues = [] as ICue[]
    for (let i = 0; i < transcriberData.chunks.length; i++) {
        let chunk = transcriberData.chunks[i]!
        cues.push({
            id: `${i + 1}`,
            start: Math.max(chunk.timestamp[0], i && (transcriberData.chunks[i - 1]!.timestamp[1] ?? 0) + cueGap),
            end: chunk.timestamp[1] ?? video.duration,
            text: chunk.text.trim()
        })
    }
    return cues
}

