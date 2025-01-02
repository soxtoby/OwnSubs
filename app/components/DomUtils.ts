import { useEffect } from "react"

export function addClass(el: HTMLElement, className: string, remove: AbortSignal) {
    el.classList.add(className)
    remove.addEventListener('abort', () => el.classList.remove(className), { once: true })
}

export function useGlobalEventListener<K extends keyof DocumentEventMap>(type: K, listener: (this: Document, ev: DocumentEventMap[K]) => any, options?: boolean | AddEventListenerOptions) {
    useEffect(() => {
        document.addEventListener(type, listener, options)
        return () => document.removeEventListener(type, listener, options)
    })
}

export function selectFile(accept: string) {
    return new Promise<File | undefined>((resolve, reject) => {
        let input = document.createElement('input')
        input.type = 'file'
        input.accept = accept
        input.click()
        input.onchange = () => resolve(input.files?.[0])
        input.remove()
    })
}