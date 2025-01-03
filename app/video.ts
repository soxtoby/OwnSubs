import { redirect } from "react-router";
import { $path } from "safe-routes";
import type { Route } from "./+types/video";
import { fileNameWithoutExtension, setVideo } from "./storage";
import { fileKey } from "./SubsFetcher";

export async function clientAction({ request }: Route.ClientActionArgs) {
    let formData = await request.formData()
    let file = formData.get(fileKey)
    if (file instanceof File) {
        await setVideo(file)
        return redirect($path('/edit/:fileName', { fileName: fileNameWithoutExtension(file.name) }))
    } else {
        throw new Error('No file uploaded')
    }
}