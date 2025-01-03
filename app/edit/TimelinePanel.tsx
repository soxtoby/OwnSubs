import { PlusIcon } from "@radix-ui/react-icons"
import { Box, Card, Flex, IconButton, Inset, ScrollArea, Text, Tooltip } from "@radix-ui/themes"
import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { addClass } from "../DomUtils"
import { binarySearch } from "../utils"
import { createCue, cueGap, minDuration, timePrecision, type ICue, type Subtitles } from "./Subtitles"
import { timeSpan } from "./TimeSpanField"
import type { VideoControl } from "./VideoControl"

export interface ITimelinePanelProps {
    video?: VideoControl
    subtitles?: Subtitles
}

export function TimelinePanel({ video, subtitles }: ITimelinePanelProps) {
    let [videoDuration, setVideoDuration] = useState(video?.duration ?? 0)
    let maxTime = Math.max(videoDuration, ...(subtitles?.cues.map(s => s.end) ?? []))
    let raf = useRef(0)

    useEffect(() => {
        if (video) {
            video.addEventListener('durationchange', onDurationChange)
            video.addEventListener('seeked', onSeeked)
            video.addEventListener('playing', onPlaying)
            video.addEventListener('pause', onPause)
            return () => {
                video.removeEventListener('durationchange', onDurationChange)
                video.removeEventListener('seeked', onSeeked)
                video.removeEventListener('playing', onPlaying)
                video.removeEventListener('pause', onPause)
            }
        }
    })

    let playheadRef = useRef<HTMLDivElement>(null)
    let updatePlayheadPosition = useCallback(() => {
        if (video && playheadRef.current) {
            playheadRef.current.style.transform = `translate3d(${video.currentTime * widthPerSecond}px, 0, 0)`
            playheadRef.current.classList.toggle('is-timeline-freeSpace', noCuesAtCurrentTime())
        }
    }, [video, subtitles])

    let seek = useCallback((seconds: number) => {
        if (video)
            video.currentTime = seconds
        updatePlayheadPosition()
    }, [video, subtitles])

    return <Box p="2">
        <Card className="timeline">
            <Inset className="timeline-inner">
                <ScrollArea>
                    <Flex direction="column" width={`${maxTime * widthPerSecond}px`} minWidth="100%" height="100%" position="relative">
                        <TimelineTicks maxTime={maxTime} setTime={seek} />
                        <Box position="relative" py="2">
                            {video && subtitles && subtitles.cues.map((cue, index) =>
                                <TimelineCue key={cue.id} cue={cue} index={index} subtitles={subtitles} video={video} />
                            )}
                        </Box>
                        {video &&
                            <div ref={playheadRef} className={'timeline-playhead' + (noCuesAtCurrentTime() ? ' is-timeline-freeSpace' : '')}>
                                <Tooltip content="Add cue">
                                    <IconButton radius="full" size="1" className="timeline-addButton" onClick={insertCue}><PlusIcon /></IconButton>
                                </Tooltip>
                            </div>
                        }
                    </Flex>
                </ScrollArea>
            </Inset>
        </Card>
    </Box>

    function noCuesAtCurrentTime(): boolean | undefined {
        return !video || !subtitles || !binarySearch(subtitles.cues, c =>
            c.end + cueGap < video.currentTime ? -1
                : c.start - cueGap - minDuration > video.currentTime ? 1
                    : 0)
    }

    function insertCue() {
        if (video && subtitles)
            subtitles.insert(createCue(video.currentTime, video.currentTime + 1, ''))
    }

    function onDurationChange() {
        if (video)
            setVideoDuration(video.duration)
    }

    function onSeeked() {
        updatePlayheadPosition()
        playheadRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center' })
    }

    function onPlaying() {
        updatePlayheadPosition()
        playheadRef.current?.scrollIntoView({ behavior: 'instant', inline: 'center' })
        raf.current = requestAnimationFrame(onPlaying)
    }

    function onPause() {
        cancelAnimationFrame(raf.current)
    }
}

interface ITimelineTicksProps {
    maxTime: number
    setTime: (seconds: number) => void
}

const TimelineTicks = memo(function TimelineTicks({ maxTime, setTime }: ITimelineTicksProps) {
    let ref = useRef<HTMLDivElement>(null!)
    let clientRect = useRef<DOMRect | null>(null)
    let [maxSeconds, setMaxSeconds] = useState(Math.ceil(maxTime))
    let seconds = Array.from({ length: maxSeconds - 1 }).map((_, i) => i + 1)

    useLayoutEffect(() => {
        setMaxSeconds(Math.ceil(Math.max(maxTime, window.innerWidth / widthPerSecond)))
    })

    return <Box ref={ref} className="timeline-ticks" position="relative" onMouseDown={onMouseDown} onMouseMove={onMouseMove}>
        {seconds.map(s =>
            <Text key={s} size="1" as="div" className="timeline-ticks-label" style={{ left: `${s * widthPerSecond}px` }}>{timeSpan(s, false)}</Text>
        )}
    </Box>

    function onMouseDown(event: React.MouseEvent) {
        if (event.button == 0) {
            clientRect.current = ref.current.getBoundingClientRect()
            setTimeFromPosition(event.clientX)
        }
    }

    function onMouseMove(event: React.MouseEvent) {
        if (event.buttons == 1)
            setTimeFromPosition(event.clientX)
    }

    function setTimeFromPosition(clientX: number) {
        if (clientRect.current)
            setTime(+((clientX - clientRect.current.left + ref.current.scrollLeft) / widthPerSecond).toFixed(timePrecision))
    }
})

interface ITimelineCueProps {
    cue: ICue
    index: number
    subtitles: Subtitles
    video: VideoControl
}

const TimelineCue = memo(function TimelineCue({ cue, index, subtitles, video }: ITimelineCueProps) {
    let ref = useRef<HTMLDivElement>(null!)
    let left = cue.start * widthPerSecond
    let width = (cue.end - cue.start) * widthPerSecond

    let move = useRef<IMoveOperation>(null!)
    let resize = useRef<IResizeOperation>(null!)

    return <Card ref={ref} size="1" style={{ left: `${left}px`, width: `${width}px` }} className="timeline-cue" onClick={() => video.activeCue = cue}>
        <Inset>
            <Flex direction="column" align="stretch">
                <Flex width="100%" px="2" gap="4" className="timeline-cue-header" onMouseDown={e => startMoving(e)}>
                    <Text size="1">{index + 1}</Text>
                </Flex>
                <Flex direction="row">
                    <Box className="timeline-cue-edgeHandle" onMouseDown={e => startResizing(e, 'start')} />
                    <Text size="1" className="timeline-cue-text">{cue.text}</Text>
                    <Box className="timeline-cue-edgeHandle" onMouseDown={e => startResizing(e, 'end')} />
                </Flex>
            </Flex>
        </Inset>
    </Card>

    function startMoving(event: React.MouseEvent<HTMLElement>) {
        if (event.button == 0) {
            let moving = new AbortController()
            move.current = {
                initialX: event.clientX,
                initialStart: cue.start,
                initialEnd: cue.end
            }

            let signal = moving.signal
            addClass(document.body, 'is-timeline-cue-moveDragging', signal)
            addClass(event.currentTarget, 'is-timeline-cue-header-dragging', signal)
            document.addEventListener('mousemove', onMove, { signal })
            document.addEventListener('mouseup', () => {
                moving.abort()
                subtitles.commit()
            }, { signal })
            document.addEventListener('keydown', e => {
                if (e.key == 'Escape') {
                    moving.abort()
                    subtitles.revert()
                }
            }, { signal })
        }
    }

    function onMove(event: MouseEvent) {
        let distance = event.clientX - move.current.initialX
        let timeDiff = distance / widthPerSecond
        let start = +(move.current.initialStart + timeDiff).toFixed(timePrecision)
        if (Math.abs(start - video.currentTime) < snapDistance)
            start = +video.currentTime.toFixed(timePrecision)
        else if (Math.abs(start + cue.end - cue.start - video.currentTime) < snapDistance)
            start = +(video.currentTime - (cue.end - cue.start)).toFixed(timePrecision)
        subtitles.move(cue.id, start, false)
    }

    function startResizing(event: React.MouseEvent<HTMLElement>, edge: 'start' | 'end') {
        if (event.button == 0) {
            let resizing = new AbortController()
            resize.current = {
                edge,
                initialX: event.clientX,
                initialTime: edge == 'start' ? cue.start : cue.end
            }

            let signal = resizing.signal
            addClass(document.body, 'is-timeline-cue-resizeDragging', signal)
            addClass(event.currentTarget, 'is-timeline-cue-edgeHandle-dragging', signal)
            document.addEventListener('mousemove', onResize, { signal })
            document.addEventListener('mouseup', () => {
                resizing.abort()
                subtitles.commit()
            }, { signal })
            document.addEventListener('keydown', e => {
                if (e.key == 'Escape') {
                    resizing.abort()
                    subtitles.revert()
                }
            }, { signal })
        }
    }

    function onResize(event: MouseEvent) {
        let distance = event.clientX - resize.current.initialX
        let newTime = +(resize.current.initialTime + distance / widthPerSecond).toFixed(timePrecision)
        if (Math.abs(newTime - video.currentTime) < snapDistance)
            newTime = +video.currentTime.toFixed(timePrecision)
        if (resize.current.edge == 'start')
            subtitles.setStart(cue.id, newTime, false)
        else
            subtitles.setEnd(cue.id, newTime, false)
    }
})

interface IMoveOperation {
    initialX: number
    initialStart: number
    initialEnd: number
}

interface IResizeOperation {
    edge: 'start' | 'end'
    initialX: number
    initialTime: number
}

const widthPerSecond = 100
const snapDistance = 0.1