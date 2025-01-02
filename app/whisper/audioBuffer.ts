import * as Constants from "./constants"

export function readAudioBuffer(file: File) {
    return new Promise<AudioBuffer>((resolve, reject) => {
        let reader = new FileReader()
        reader.onload = async () => {
            let audioContext = new AudioContext({ sampleRate: Constants.sampleRate })
            let buffer = await audioContext.decodeAudioData(reader.result as ArrayBuffer)
            resolve(buffer)
        }
        reader.onerror = reject
        reader.readAsArrayBuffer(file)
    })
}