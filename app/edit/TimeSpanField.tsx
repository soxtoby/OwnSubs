import { Slot, TextField } from "@radix-ui/themes";
import { useEffect, useState } from "react";

export interface ITimeSpanFieldProps extends Omit<TextField.RootProps & React.RefAttributes<HTMLInputElement>, 'value' | 'onChange'> {
    seconds: number
    onChange(seconds: number): void
}

export function TimeSpanField({ seconds, onChange, ...textFieldProps }: ITimeSpanFieldProps) {
    let [text, setText] = useState('')

    useEffect(() => {
        if (parseTimeSpan(text) != seconds)
            setText(timeSpan(seconds))
    }, [seconds])

    return <Slot {...textFieldProps}>
        <TextField.Root value={text} onChange={onTextChange} onBlur={onBlur} />
    </Slot>

    function onTextChange(event: React.ChangeEvent<HTMLInputElement>) {
        setText(event.target.value)
        let seconds = parseTimeSpan(event.target.value)
        if (seconds != null)
            onChange(seconds)
    }

    function onBlur() {
        setText(timeSpan(seconds))
    }
}

export function timeSpan(totalSeconds: number, includeMilliseconds = true) {
    let hours = Math.floor(totalSeconds / 3600)
    let minutes = Math.floor(totalSeconds % 3600 / 60)
    let seconds = Math.floor(totalSeconds % 60)
    let milliseconds = Math.floor(totalSeconds % 1 * 1000)

    let timeSpan = ''
    if (hours)
        timeSpan += `${hours.toString().padStart(2, '0')}:`
    timeSpan += `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    if (includeMilliseconds)
        timeSpan += `.${milliseconds.toString().padStart(3, '0')}`
    return timeSpan
}

function parseTimeSpan(timeSpan: string) {
    let parts = timeSpan.split(':')
    let minutes = parseInt(parts[0] ?? '', 10)
    let seconds = parseFloat(parts[1] ?? '')
    if (!Number.isNaN(minutes) && !Number.isNaN(seconds))
        return minutes * 60 + seconds
}