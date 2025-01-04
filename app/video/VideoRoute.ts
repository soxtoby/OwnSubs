import { redirect } from "react-router";
import { $path } from "safe-routes";
import { file, object, optional, parse, pipe, string, transform, type InferOutput } from "valibot";
import { deleteFile, setVideo } from "../storage";
import type { Route } from "./+types/VideoRoute";

export async function clientAction({ request, params: { fileName } }: Route.ClientActionArgs) {
    if (request.method == 'POST') {
        let { file } = parse(Form, Object.fromEntries(await request.formData()))
        let { overwrite } = parse(SearchParams, Object.fromEntries(new URL(request.url).searchParams))
        let success = await setVideo(file, fileName, overwrite);
        return success
            ? redirect($path('/edit/:fileName', { fileName }))
            : { alreadyExists: true }
    } else if (request.method == 'DELETE') {
        await deleteFile(fileName)
        return redirect($path('/'))
    }
}

const Form = object({
    file: file("No file uploaded")
})

const SearchParams = object({
    overwrite: pipe(optional(string()), transform(s => s == 'false' ? false : Boolean(s)))
})

export type SearchParams = InferOutput<typeof SearchParams>