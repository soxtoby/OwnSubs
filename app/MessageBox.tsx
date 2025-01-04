import { AlertDialog, Button, Flex } from "@radix-ui/themes"
import { createContext, use, useMemo, useState, type PropsWithChildren } from "react"

export interface IMessageBoxContext {
    alert(message: IMessage): void
    prompt(message: IPrompt): Promise<void>
}

export interface IMessage {
    title: string
    message: string
}

export interface IPrompt extends IMessage {
    confirm?: string
    cancel?: string
}

interface IMessageBoxState extends IPrompt {
    isPrompt: boolean
    resolve(): void
    reject(): void
    closed?: boolean
}

export function MessageBoxProvider({ children }: PropsWithChildren<{}>) {
    let [current, setCurrent] = useState<IMessageBoxState | null>(null)
    let context = useMemo(() => ({
        alert: (message: IMessage) => setCurrent({ ...message, isPrompt: false, resolve() { }, reject() { } }),
        prompt: (message: IMessage) => new Promise<void>((resolve, reject) => setCurrent({ ...message, isPrompt: true, resolve, reject }))
    }), [setCurrent])

    return <MessageBoxContext value={context}>
        {children}
        <AlertDialog.Root open={!!current && !current.closed} onOpenChange={cancel}>
            <AlertDialog.Content maxWidth="450px">
                <AlertDialog.Title>{current?.title}</AlertDialog.Title>
                <AlertDialog.Description size="2">{current?.message}</AlertDialog.Description>
                <Flex gap="2" mt="4" justify="end">
                    {current?.isPrompt
                        ? <>
                            <AlertDialog.Action>
                                <Button onClick={confirm}>{current.confirm ?? "OK"}</Button>
                            </AlertDialog.Action>
                            <AlertDialog.Cancel>
                                <Button variant="soft">{current.cancel ?? "Cancel"}</Button>
                            </AlertDialog.Cancel>
                        </>
                        : <AlertDialog.Cancel>
                            <Button>OK</Button>
                        </AlertDialog.Cancel>
                    }
                </Flex>
            </AlertDialog.Content>
        </AlertDialog.Root>
    </MessageBoxContext>

    function confirm() {
        if (current) {
            current.resolve()
            setCurrent({ ...current, closed: true })
        }
    }

    function cancel() {
        if (current && !current.closed) {
            current?.reject()
            setCurrent({ ...current, closed: true })
        }
    }
}

export function useMessageBox() { return use(MessageBoxContext) }

const MessageBoxContext = createContext<IMessageBoxContext>({ alert() { }, async prompt() { } })