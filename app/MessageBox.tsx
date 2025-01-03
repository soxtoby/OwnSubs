import { AlertDialog, Button, Flex } from "@radix-ui/themes"
import { createContext, use, useMemo, useState, type PropsWithChildren } from "react"

export interface IMessageBoxContext {
    alert(message: IMessage): void
}

export interface IMessage {
    title: string
    message: string
}

export function MessageBoxProvider({ children }: PropsWithChildren<{}>) {
    let [message, setMessage] = useState<IMessage | null>(null)
    let context = useMemo(() => ({ alert: setMessage }), [setMessage])

    return <MessageBoxContext value={context}>
        {children}
        <AlertDialog.Root open={!!message} onOpenChange={() => setMessage(null)}>
            <AlertDialog.Content maxWidth="450px">
                <AlertDialog.Title>{message?.title}</AlertDialog.Title>
                <AlertDialog.Description size="2">{message?.message}</AlertDialog.Description>
                <Flex gap="2" mt="4" justify="end">
                    <AlertDialog.Cancel>
                        <Button>OK</Button>
                    </AlertDialog.Cancel>
                </Flex>
            </AlertDialog.Content>
        </AlertDialog.Root>
    </MessageBoxContext>
}

export function useMessageBox() { return use(MessageBoxContext) }

const MessageBoxContext = createContext<IMessageBoxContext>({ alert() { } })