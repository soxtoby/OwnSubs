import * as Constants from "./constants"

export function readAudioBuffer(file: File) {
    return new Promise<AudioBuffer>((resolve, reject) => {
        let reader = new FileReader()
        reader.onload = () => {
            let audioContext = new AudioContext({ sampleRate: Constants.sampleRate })
            audioContext.decodeAudioData(reader.result as ArrayBuffer, resolve, reject)
        }
        reader.onerror = reject
        reader.readAsArrayBuffer(file)
    })
}