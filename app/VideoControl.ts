import type { RefObject } from "react"
import { fromVTT, type ICue } from "./Subtitles"
import { readAudioBuffer } from "./whisper/audioBuffer"

export class VideoControl {
    constructor(
        public readonly file: File | null,
        private _videoElement: RefObject<HTMLVideoElement | null>
    ) {
        this.src = file ? URL.createObjectURL(file) : null
        this.audio = file
            ? readAudioBuffer(file)
            : null
    }

    readonly src: string | null

    readonly audio: Promise<AudioBuffer> | null

    get isPlaying() { return this.video?.paused === false }
    set isPlaying(value: boolean) {
        if (this.video) {
            if (value)
                this.video.play()
            else
                this.video.pause()
        }
    }

    get currentTime() { return this.video?.currentTime ?? 0 }
    set currentTime(value: number) {
        if (this.video) {
            this.isPlaying = false
            this.video.currentTime = value
        }
    }

    get duration() {
        let duration = this.video?.duration
        return isNaN(duration!) ? 0 : duration!
    }

    get playbackRate() {
        return this.video?.playbackRate ?? 1
    }

    get activeCue() {
        let activeCues = Array.from(this.video?.textTracks[0]?.activeCues ?? [])
        let lastActiveCue = activeCues.at(-1) as VTTCue | undefined
        return lastActiveCue && fromVTT(lastActiveCue)
    }
    set activeCue(value: ICue | undefined) {
        if (value && value.id != this.activeCue?.id)
            this.currentTime = value.start
    }

    addEventListener<K extends keyof HTMLVideoElementEventMap>(type: K, listener: (this: HTMLVideoElement, ev: HTMLVideoElementEventMap[K]) => any, options?: boolean | AddEventListenerOptions) {
        this.video?.addEventListener(type, listener, options)
    }
    removeEventListener<K extends keyof HTMLVideoElementEventMap>(type: K, listener: (this: HTMLVideoElement, ev: HTMLVideoElementEventMap[K]) => any, options?: boolean | EventListenerOptions) {
        this.video?.removeEventListener(type, listener, options)
    }

    addSubtitlesEventListener<K extends keyof TextTrackEventMap>(type: K, listener: (this: TextTrack, ev: TextTrackEventMap[K]) => any, options?: boolean | AddEventListenerOptions) {
        this.video?.querySelector('track')?.addEventListener(type, listener, options)
    }
    removeSubtitlesEventListener<K extends keyof TextTrackEventMap>(type: K, listener: (this: TextTrack, ev: TextTrackEventMap[K]) => any, options?: boolean | EventListenerOptions) {
        this.video?.querySelector('track')?.removeEventListener(type, listener, options)
    }

    private get video() { return this._videoElement.current }
}