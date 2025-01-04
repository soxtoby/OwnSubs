import { createContext, use, useCallback, useMemo, useState, type PropsWithChildren } from "react";
import { emptyArray } from "../utils";
import * as Constants from "./constants";
import Worker from "./worker.js?worker";

interface ProgressItem {
    file: string;
    loaded: number;
    progress: number;
    total: number;
    name: string;
    status: string;
}

interface TranscriberUpdateData {
    data: {
        text: string;
        chunks: { text: string; timestamp: [number, number | null] }[];
        tps: number;
    };
}

export interface TranscriberData {
    isBusy: boolean;
    tps?: number;
    text: string;
    chunks: { text: string; timestamp: [number, number | null] }[];
}

/** Just the bits I need */
export interface ITranscriber {
    readonly isBusy: boolean;
    readonly isModelLoading: boolean;
    readonly progressItems: readonly ProgressItem[];
    start(audioData: AudioBuffer | undefined): void;
    readonly output?: TranscriberData;
}

/** Everything provided */
export interface Transcriber extends ITranscriber {
    onInputChange: () => void;
    model: string;
    setModel: (model: string) => void;
    multilingual: boolean;
    setMultilingual: (model: boolean) => void;
    subtask: string;
    setSubtask: (subtask: string) => void;
    language?: string;
    setLanguage: (language: string) => void;
}

export function TranscriberProvider({ children }: PropsWithChildren<{}>) {
    const [transcript, setTranscript] = useState<TranscriberData | undefined>(
        undefined,
    );
    const [isBusy, setIsBusy] = useState(false);
    const [isModelLoading, setIsModelLoading] = useState(false);

    const [progressItems, setProgressItems] = useState<readonly ProgressItem[]>(emptyArray);

    let [webWorker, setWebWorker] = useState<Worker | null>(null);

    const [model, setModel] = useState<string>(Constants.defaultModel);
    const [subtask, setSubtask] = useState<string>(Constants.subtask);
    const [multilingual, setMultilingual] = useState<boolean>(
        Constants.multilingual,
    );
    const [language, setLanguage] = useState<string>(
        Constants.language,
    );

    const onInputChange = useCallback(() => {
        setTranscript(undefined);
    }, emptyArray);

    const postRequest = useCallback(
        async (audioData: AudioBuffer | undefined) => {
            if (audioData) {
                setTranscript(undefined);
                setIsBusy(true);

                let audio;
                if (audioData.numberOfChannels === 2) {
                    const SCALING_FACTOR = Math.sqrt(2);

                    const left = audioData.getChannelData(0);
                    const right = audioData.getChannelData(1);

                    audio = new Float32Array(left.length);
                    for (let i = 0; i < audioData.length; ++i) {
                        audio[i] = (SCALING_FACTOR * (left[i]! + right[i]!)) / 2;
                    }
                } else {
                    // If the audio is not stereo, we can just use the first channel:
                    audio = audioData.getChannelData(0);
                }

                setWebWorker(webWorker ??= createWorker());

                webWorker.postMessage({
                    audio,
                    model,
                    multilingual,
                    subtask: multilingual ? subtask : null,
                    language:
                        multilingual && language !== "auto" ? language : null,
                });
            }
        },
        [webWorker, model, multilingual, subtask, language],
    );

    function createWorker() {
        let worker = new Worker({ name: "whisper" })
        worker.onmessage = (event) => {
            const message = event.data;

            // Update the state with the result
            switch (message.status) {
                case "progress":
                    // Model file progress: update one of the progress items.
                    setProgressItems((prev) =>
                        prev.map((item) => {
                            if (item.file === message.file) {
                                return { ...item, progress: message.progress };
                            }
                            return item;
                        }),
                    );
                    break;
                case "update":
                case "complete":
                    const busy = message.status === "update";
                    const updateMessage = message as TranscriberUpdateData;
                    setTranscript({
                        isBusy: busy,
                        text: updateMessage.data.text,
                        tps: updateMessage.data.tps,
                        chunks: updateMessage.data.chunks,
                    });
                    setIsBusy(busy);
                    break;

                case "initiate":
                    // Model file start load: add a new progress item to the list.
                    setIsModelLoading(true);
                    setProgressItems((prev) => [...prev, message]);
                    break;
                case "ready":
                    setIsModelLoading(false);
                    break;
                case "error":
                    setIsBusy(false);
                    console.error(`An error occurred: "${message.data.message}". Please file a bug report.`);
                    break;
                default:
                    // initiate/download/done
                    break;
            }
        }
        return worker
    }

    const transcriber = useMemo(() => {
        return {
            onInputChange,
            isBusy,
            isModelLoading,
            progressItems,
            start: postRequest,
            output: transcript,
            model,
            setModel,
            multilingual,
            setMultilingual,
            subtask,
            setSubtask,
            language,
            setLanguage,
        };
    }, [
        isBusy,
        isModelLoading,
        progressItems,
        postRequest,
        transcript,
        model,
        multilingual,
        subtask,
        language,
    ]);

    return <TranscriberContext value={transcriber}>{children}</TranscriberContext>
}

export function useTranscriber() {
    return use(TranscriberContext)
}

const TranscriberContext = createContext<ITranscriber>({
    isBusy: false,
    isModelLoading: false,
    progressItems: emptyArray,
    start: () => { },
})