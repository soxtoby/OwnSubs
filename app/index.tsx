import { useEffect, useState } from "react";
import type { Route } from "./+types/index";
import { fileNameWithoutExtension, index } from "./storage";
import { emptyArray } from "./utils";
import { IndexContent, type IVideo } from "./IndexContent";

export async function clientLoader(args: Route.ClientLoaderArgs) {
    return { index: await index() }
}

export default function Index({ loaderData: { index } }: Route.ComponentProps) {
    let [videos, setVideos] = useState(emptyArray as IVideo[])

    useEffect(() => {
        setVideos(index.map(file => ({
            name: fileNameWithoutExtension(file.name),
            video: file.video,
            lastModified: file.lastModified,
            src: URL.createObjectURL(file.video)
        })))

        return () => videos.forEach(v => URL.revokeObjectURL(v.src))
    }, [index])

    return <IndexContent videos={videos} />
}