import { ArrowRightIcon, MagicWandIcon, PlusIcon, TrashIcon, UploadIcon } from "@radix-ui/react-icons"
import { Badge, Box, Button, Card, Flex, IconButton, ScrollArea, Skeleton, TextArea, Tooltip } from "@radix-ui/themes"
import { memo, useEffect, useRef, type PropsWithChildren } from "react"
import { flushSync } from "react-dom"
import { useVideoFetcher } from "../video/VideoFetcher"
import { useTranscriber } from "../whisper/Transcriber"
import { createCue, cueGap, Subtitles, timePrecision, type ICue } from "./Subtitles"
import { TimeSpanField } from "./TimeSpanField"
import type { VideoControl } from "./VideoControl"

export interface ISubtitlesPanelProps {
    video?: VideoControl
    subtitles?: Subtitles
}

export function SubtitlesPanel({ video, subtitles, children }: PropsWithChildren<ISubtitlesPanelProps>) {
    let lastActiveCueId = useRef(video?.activeCue?.id)

    useEffect(() => {
        if (video) {
            video.addEventListener('play', focusActiveCueText)
            video.addSubtitlesEventListener('cuechange', onCueChange)
            return () => {
                video.removeEventListener('play', focusActiveCueText)
                video.removeSubtitlesEventListener('cuechange', onCueChange)
            }
        }
    })

    return <Box p="2" flexGrow="2">
        <Card variant="classic" style={{ height: '100%', '--card-padding': '0px' }}>
            {children ? children
                : !subtitles ? <Cues />
                    : !video ? <UploadVideoMessage />
                        : subtitles.cues.length == 0 ? <NoSubsMessage video={video} subtitles={subtitles} />
                            : <Cues video={video} subtitles={subtitles} />
            }
        </Card>
    </Box>

    function onCueChange() {
        if (video && video.activeCue && video.activeCue.id != lastActiveCueId.current) {
            lastActiveCueId.current = video.activeCue.id
            focusActiveCueText()
        }
    }

    function focusActiveCueText() {
        let cueText = video?.activeCue && document.getElementById(cueElementId(video.activeCue))?.querySelector('textarea')
        if (cueText) {
            cueText.focus()
            cueText.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
    }
}

export function MissingVideoMessage({ fileName }: { fileName: string }) {
    let videoFetcher = useVideoFetcher()

    return <Flex align="center" justify="center" height="100%">
        <Flex gap="2" align="center">No video found with name "{fileName}". <Button onClick={() => videoFetcher.selectVideo()}><UploadIcon /> Load a new video</Button> to get started.</Flex>
    </Flex>
}

function UploadVideoMessage() {
    let videoFetcher = useVideoFetcher()

    return <Flex align="center" justify="center" height="100%">
        <Flex gap="2" align="center"><Button onClick={() => videoFetcher.selectVideo()}><UploadIcon /> Load a video</Button> to get started.</Flex>
    </Flex>
}

interface INoSubsMessageProps {
    video: VideoControl
    subtitles: Subtitles
}

function NoSubsMessage({ video, subtitles }: INoSubsMessageProps) {
    let transcriber = useTranscriber()

    return <Flex align="center" justify="center" height="100%">
        <Flex align="center" gap="2">
            No subtitles yet. You can
            {video.audio &&
                <>
                    <Button onClick={async () => transcriber.start(await video.audio!)}><MagicWandIcon /> Transcribe</Button>
                    the video automatically, or
                </>}
            <Button onClick={() => subtitles.insert(createCue(0, 1, 'Your text here'))}><PlusIcon /> Add a cue</Button>
            to get started.
        </Flex>
    </Flex>
}

interface ICuesProps {
    video?: VideoControl
    subtitles?: Subtitles
}

function Cues({ video, subtitles }: ICuesProps) {
    return <ScrollArea scrollbars="vertical" size="3">
        <Box p="2">
            <Flex direction="column">
                {(subtitles?.cues ?? skeletonCues).map((cue, i) =>
                    <Cue key={cue.id} cue={cue} index={i} subtitles={subtitles} video={video} />
                )}
            </Flex>
        </Box>
    </ScrollArea>
}

interface ICueProps {
    cue: ICue
    index: number
    video?: VideoControl
    subtitles?: Subtitles
}

const Cue = memo(function Cue({ cue, index, video, subtitles }: ICueProps) {
    let loading = !video || !subtitles
    return <Flex id={cueElementId(cue)} gap="2" p="2" align="stretch" className="cue">
        <Flex direction="column" justify="between">
            <Flex justify="between" align="center">
                <Skeleton loading={loading}>
                    <Badge variant="solid">{index + 1}</Badge>
                </Skeleton>
                <Flex gap="2" className="cue-actions">
                    <Tooltip content="Remove">
                        <Skeleton loading={loading}>
                            <IconButton size="1" color="gray" variant="soft" onClick={() => subtitles?.remove(cue.id)} >
                                <TrashIcon />
                            </IconButton>
                        </Skeleton>
                    </Tooltip>
                </Flex>
            </Flex>
            <Flex gap="2" align="center">
                <Box width="70px">
                    <Skeleton loading={loading}>
                        <TimeSpanField size="1" variant="soft" seconds={cue.start} onChange={onStartTimeChange} />
                    </Skeleton>
                </Box>
                <Skeleton loading={loading}>
                    <ArrowRightIcon />
                </Skeleton>
                <Box width="70px">
                    <Skeleton loading={loading}>
                        <TimeSpanField size="1" variant="soft" seconds={cue.end} onChange={onEndTimeChange} />
                    </Skeleton>
                </Box>
            </Flex>
        </Flex>
        <Skeleton loading={loading}>
            <Box asChild flexGrow="1">
                <TextArea
                    className={cueTextClass}
                    value={cue.text}
                    onKeyDown={onTextKeyDown}
                    onChange={onTextChange}
                    onFocus={() => video!.activeCue = cue}
                />
            </Box>
        </Skeleton>
    </Flex>

    function onTextKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (video && subtitles && !event.shiftKey) {
            if (event.key == ' ' && event.ctrlKey) {
                event.preventDefault()
                video.isPlaying = !video.isPlaying
            } else if (event.key == 'Enter') {
                event.preventDefault()

                let newText = event.currentTarget.value.slice(event.currentTarget.selectionStart)
                let newCueSeconds = 1
                let replacementCue = cue
                if (newText) {
                    newCueSeconds = +((cue.end - cue.start) * (newText.length / cue.text.length)).toFixed(timePrecision)
                    replacementCue = {
                        ...cue,
                        end: cue.end - newCueSeconds,
                        text: cue.text.slice(0, event.currentTarget.selectionStart)
                    }
                }

                let nextCue = subtitles.next(cue.id)
                let newCue = createCue(replacementCue.end + cueGap, Math.min(replacementCue.end + cueGap + newCueSeconds, nextCue?.start ?? Infinity), newText)

                flushSync(() => subtitles.splice(cue.id, 1, [replacementCue, newCue]))

                nextTextArea(event.currentTarget)?.focus();
            } else if (event.key == 'Delete' && event.currentTarget.selectionStart == event.currentTarget.value.length) {
                event.preventDefault()

                let nextCue = subtitles.next(cue.id)
                if (nextCue) {
                    flushSync(() =>
                        subtitles.splice(cue.id, 2, [{
                            ...cue,
                            end: nextCue.end,
                            text: cue.text + nextCue.text
                        }]))
                    event.currentTarget.setSelectionRange(cue.text.length, cue.text.length)
                }
            } else if (event.key == 'Backspace' && event.currentTarget.selectionEnd == 0) {
                event.preventDefault()

                let previousCue = subtitles.previous(cue.id)
                if (previousCue) {
                    flushSync(() =>
                        subtitles.splice(previousCue.id, 2, [{
                            ...cue,
                            start: previousCue.start,
                            text: previousCue.text + cue.text
                        }]))
                    event.currentTarget.setSelectionRange(previousCue.text.length, previousCue.text.length)
                }
            } else if (event.key == 'ArrowUp' && event.currentTarget.selectionStart <= event.currentTarget.value.split('\n')[0]!.length) {
                event.preventDefault()

                previousTextArea(event.currentTarget)?.focus()
            } else if (event.key == 'ArrowDown' && event.currentTarget.selectionEnd >= event.currentTarget.value.length - event.currentTarget.value.split('\n')!.slice(-1)![0]!.length) {
                event.preventDefault()

                nextTextArea(event.currentTarget)?.focus()
            }
        }
    }

    function onTextChange(event: React.FormEvent<HTMLTextAreaElement>) {
        if (video && subtitles) {
            video.isPlaying = false
            subtitles.setText(cue.id, event.currentTarget.value)
        }
    }

    function onStartTimeChange(seconds: number) {
        if (video && subtitles) {
            video.isPlaying = false
            subtitles.setStart(cue.id, seconds)
        }
    }

    function onEndTimeChange(seconds: number) {
        if (video && subtitles) {
            video.isPlaying = false
            subtitles.setEnd(cue.id, seconds)
        }
    }

    function nextTextArea(textArea: HTMLTextAreaElement) {
        let cueTextAreas = Array.from(document.querySelectorAll(`.${cueTextClass} textarea`)) as HTMLTextAreaElement[]
        return cueTextAreas.find(el => textArea.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)
    }

    function previousTextArea(textArea: HTMLTextAreaElement) {
        let cueTextAreas = Array.from(document.querySelectorAll(`.${cueTextClass} textarea`)) as HTMLTextAreaElement[]
        return cueTextAreas.findLast(el => textArea.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING)
    }
})

const cueTextClass = 'cue-text'

export function cueElementId(cue: ICue) {
    return `cue-${cue.id}`
}

const skeletonCues: ICue[] = Array.from({ length: 10 }, (_, i) => ({ id: `skele-${i}`, start: i, end: i + 0.9, text: '' }))