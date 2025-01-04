import { TrashIcon, UploadIcon } from "@radix-ui/react-icons";
import { Box, Button, Card, Container, Flex, Heading, IconButton, ScrollArea, Text, Tooltip } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { $path } from "safe-routes";
import type { Route } from "./+types/index";
import { DropArea } from "./DropArea";
import { fileNameWithoutExtension, index } from "./storage";
import { useVideoFetcher } from "./video/VideoFetcher";
import title from "/title.svg";

export async function clientLoader(args: Route.ClientLoaderArgs) {
    return { index: await index() }
}

export default function Index({ loaderData: { index } }: Route.ComponentProps) {
    let [videos, setVideos] = useState([] as IVideo[])

    useEffect(() => {
        setVideos(index.map(file => ({
            name: fileNameWithoutExtension(file.name),
            video: file.video,
            lastModified: file.lastModified,
            src: URL.createObjectURL(file.video)
        })))

        return () => videos.forEach(v => URL.revokeObjectURL(v.src))
    }, [index])

    let videoFetcher = useVideoFetcher()

    return <ScrollArea size="3">
        <DropArea>
            <Box>
                <Container p="4">
                    <Flex direction="column" align="start" gap="8" pt="9">
                        <img src={title} />
                        <Flex direction="column" gap="2">
                            <Heading>Get started</Heading>
                            <Flex gap="2" align="center"><Button onClick={() => videoFetcher.selectVideo()}><UploadIcon /> Load a video</Button> to create a new transcription.</Flex>
                        </Flex>
                        {!!videos.length && <Flex direction="column" gap="2" mb="4">
                            <Heading>Your videos</Heading>
                            <Flex gap="4" wrap="wrap">
                                {videos.map(v =>
                                    <Card asChild key={v.name} className="videoCard" tabIndex={0} onKeyDown={e => onVideoKeyDown(e, v)} style={{ position: 'relative', flexShrink: 0 }}>
                                        <Link to={$path('/edit/:fileName', { fileName: v.name })}>
                                            <Flex direction="column" gap="2">
                                                <Flex justify="between">
                                                    <Heading size="3">{v.name}</Heading>
                                                    <Text size="2" color="gray">{v.lastModified.toLocaleDateString()}</Text>
                                                </Flex>
                                                <video src={v.src} width="300px" />
                                            </Flex>
                                            <Tooltip content="Delete video">
                                                <IconButton
                                                    tabIndex={-1}
                                                    onClick={e => {
                                                        e.preventDefault()
                                                        videoFetcher.deleteVideo(v.name)
                                                    }}
                                                    variant="surface"
                                                    radius="full"
                                                    color="red"
                                                    className="videoCard-delete"
                                                >
                                                    <TrashIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Link>
                                    </Card>
                                )}
                            </Flex>
                        </Flex>}
                    </Flex>
                </Container>
            </Box>
        </DropArea>
    </ScrollArea>

    function onVideoKeyDown(event: React.KeyboardEvent, video: IVideo) {
        if (event.key == 'Delete')
            videoFetcher.deleteVideo(video.name)
    }
}

interface IVideo {
    name: string
    video: File
    lastModified: Date
    src: string
}