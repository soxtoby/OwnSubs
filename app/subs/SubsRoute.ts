import { setSubs } from "../storage";
import type { Route } from "./+types/SubsRoute";
import { fileKey } from "./SubsFetcher";

export async function clientAction({ request, params: { videoFileName } }: Route.ClientActionArgs) {
    let formData = await request.formData()
    let file = formData.get(fileKey)
    if (file instanceof File)
        await setSubs(file, videoFileName)
    else
        throw new Error('No file uploaded')
}