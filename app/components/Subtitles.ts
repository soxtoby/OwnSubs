import { timeSpan } from "./TimeSpanField"

export interface ICue {
    readonly id: string
    readonly start: number
    readonly end: number
    readonly text: string
}

export class Subtitles {
    private _pendingCues: ICue[] | undefined
    private _history: ICue[][] = []
    private _currentHistoryIndex = 0

    constructor(
        private _onCuesUpdated: (subtitles: Subtitles, committed: boolean) => void,
        initialCues: ICue[] = []
    ) {
        this._history.push(initialCues)
    }

    get cues() {
        return this._pendingCues
            ?? this._history.at(this._currentHistoryIndex)
            ?? []
    }

    get(cueId: string) {
        return this.cues.find(c => c.id == cueId)
    }

    previous(cueId: string) {
        return this.cues[this.cues.findIndex(c => c.id == cueId) - 1]
    }

    next(cueId: string) {
        return this.cues[this.cues.findIndex(c => c.id == cueId) + 1]
    }

    setText(cueId: string, text: string) {
        this.update(cues => cues.map(c => c.id == cueId ? { ...c, text } : c))
    }

    move(cueId: string, start: number, commit = true) {
        let cue = this.get(cueId)
        if (cue) {
            let previousCue = this.previous(cueId)
            let nextCue = this.next(cueId)
            start = Math.max(previousCue ? previousCue.end + cueGap : 0, start)
            let end = cue.end + start - cue.start
            if (nextCue && end > nextCue.start) {
                end = nextCue.start
                start = end - (cue.end - cue.start)
            }
            this.replace(cueId, { ...cue, start, end }, commit)
        }
    }

    setStart(cueId: string, start: number, commit = true) {
        let cue = this.get(cueId)
        if (cue) {
            let previousCue = this.previous(cueId)
            start = Math.min(cue.end - minDuration, Math.max(previousCue ? previousCue.end + cueGap : 0, start))
            this.replace(cueId, { ...cue, start }, commit)
        }
    }

    setEnd(cueId: string, end: number, commit = true) {
        let cue = this.get(cueId)
        if (cue) {
            let nextCue = this.next(cueId)
            end = Math.max(cue.start + minDuration, Math.min(nextCue ? nextCue.start - cueGap : Infinity, end))
            this.replace(cueId, { ...cue, end }, commit)
        }
    }

    remove(cueId: string) {
        this.splice(cueId, 1)
    }

    replace(cueId: string, replacement: ICue, commit = true) {
        this.splice(cueId, 1, [replacement], commit)
    }

    splice(cueId: string, deleteCount: number, replacements: ICue[] = [], commit = true) {
        this.update(cues => {
            let index = cues.findIndex(c => c.id == cueId)
            return index >= 0
                ? cues.toSpliced(index, deleteCount, ...replacements)
                : cues
        }, commit)
    }

    replaceAll(cues: ICue[], commit = true) {
        this.update(() => cues, commit)
    }

    insert(cue: ICue, commit = true) {
        this.update(cues => {
            let index = cues.findLastIndex(c => c.end < cue.start) + 1
            let previousCue = cues[index - 1]
            let nextCue = cues[index]
            let cueToFit: ICue = {
                ...cue,
                start: +Math.max(previousCue ? previousCue.end + cueGap : 0, cue.start).toFixed(timePrecision),
                end: +Math.min(nextCue ? nextCue.start - cueGap : Infinity, cue.end).toFixed(timePrecision)
            }
            return cueToFit.end > cueToFit.start
                ? cues.toSpliced(index, 0, cueToFit)
                : cues
        }, commit)
    }

    private update(update: (cues: ICue[]) => ICue[], commit = true) {
        this._pendingCues = update(this.cues)
        if (commit)
            this.commit()
        else
            this._onCuesUpdated(this, false)
    }

    commit() {
        if (this._pendingCues) {
            this._history.length = this._currentHistoryIndex + 1
            this._currentHistoryIndex = this._history.push(this._pendingCues) - 1
            delete this._pendingCues
            this._onCuesUpdated(this, true)
        }
    }

    revert() {
        delete this._pendingCues
        this._onCuesUpdated(this, false)
    }

    undo() {
        if (this._currentHistoryIndex > 0) {
            delete this._pendingCues
            this._currentHistoryIndex--
            this._onCuesUpdated(this, true)
        }
    }

    redo() {
        if (this._currentHistoryIndex < this._history.length - 1) {
            delete this._pendingCues
            this._currentHistoryIndex++
            this._onCuesUpdated(this, true)
        }
    }

    generateTranscript() {
        return this.cues
            .map(cue => `${timeSpan(cue.start, false)} - ${cue.text.replaceAll('\n', ' ')}`)
            .join('\n')
    }

    generateVTT() {
        return "WEBVTT\n\n"
            + this.cues.map(vttCue)
                .join('\n\n')

        function vttCue(cue: ICue, index: number) {
            return `${index + 1}\n${timeSpan(cue.start)} --> ${timeSpan(cue.end)}\n${cue.text}`
        }
    }
}

export function createCue(start: number, end: number, text: string): ICue {
    return {
        id: `${Date.now()}`,
        start,
        end,
        text
    }
}

export function readSubsFile(file: File): Promise<ICue[]> {
    return new Promise((resolve, reject) => {
        let video = document.createElement('video')
        video.style.display = 'none'
        let track = document.createElement('track')
        track.default = true
        video.appendChild(track)
        track.src = URL.createObjectURL(file)
        track.onload = () => {
            let cues = (Array.from(track.track.cues ?? []) as VTTCue[]).map(fromVTT)
            URL.revokeObjectURL(track.src)
            video.remove()
            resolve(cues)
        }
        track.onerror = () => resolve([])
    })
}

export function fromVTT(vttCue: VTTCue): ICue {
    return {
        id: vttCue.id,
        start: vttCue.startTime,
        end: vttCue.endTime,
        text: vttCue.text
    }
}

export function toVTT(cue: ICue): VTTCue {
    let vttCue = new VTTCue(cue.start, cue.end, cue.text)
    vttCue.id = cue.id
    return vttCue
}

export const timePrecision = 3
export const cueGap = 0.001
export const minDuration = 0.5