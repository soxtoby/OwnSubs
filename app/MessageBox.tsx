import { AlertDialog, Button, Flex } from "@radix-ui/themes"
import { createContext, use, useMemo, useState, type PropsWithChildren } from "react"

export interface IMessageBoxContext {
    alert(message: IMessage): void
    prompt<Option extends string>(message: IPrompt<Option>): Promise<Option>
}

export interface IMessage {
    title: string
    message: string
}

export interface IPrompt<Option extends string> extends IMessage {
    options?: Record<Option, string>
}

interface IMessageBoxState<Option extends string> extends IPrompt<Option> {
    resolve(choice: Option): void
    reject(): void
    closed?: boolean
}

export function MessageBoxProvider({ children }: PropsWithChildren<{}>) {
    let [current, setCurrent] = useState<IMessageBoxState<any> | null>(null)
    let context = useMemo(() => ({
        alert: (message: IMessage) => setCurrent({
            ...message,
            resolve() { },
            reject() { }
        }),
        prompt: <Option extends string>(message: IPrompt<Option>) => new Promise<Option>((resolve, reject) => setCurrent({
            options: { ok: "OK" },
            ...message,
            resolve,
            reject
        }))
    }), [setCurrent])

    return <MessageBoxContext value={context}>
        {children}
        <AlertDialog.Root open={!!current && !current.closed} onOpenChange={cancel}>
            <AlertDialog.Content maxWidth="450px">
                <AlertDialog.Title>{current?.title}</AlertDialog.Title>
                <AlertDialog.Description size="2">{current?.message}</AlertDialog.Description>
                <Flex gap="2" mt="4" justify="end">
                    {current?.options
                        ? <>
                            {Object.entries(current.options).map(([option, caption]) =>
                                <AlertDialog.Action key={option}>
                                    <Button onClick={() => confirm(option)}>{caption}</Button>
                                </AlertDialog.Action>
                            )}
                            <AlertDialog.Cancel>
                                <Button variant="soft">{"Cancel"}</Button>
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

    function confirm(option: string) {
        if (current) {
            current.resolve(option)
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

const MessageBoxContext = createContext<IMessageBoxContext>({ alert: () => { }, prompt: () => Promise.reject() })