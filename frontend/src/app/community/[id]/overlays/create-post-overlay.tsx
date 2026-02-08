"use client";
import Overlay from "@/components/overlays/overlay";
import QuillEditor, { QuillEditorRef } from "@/components/quill-editor";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { createPost } from "@/lib/api/post";
import { FormEvent, useRef, useState } from "react";
import { toast } from "react-hot-toast";

interface CreatePostOverlayProps {
    close: () => void;
    communityId: number;
    parentNodeId: string;
}

export default function CreatePostOverlay({
    close,
    communityId,
    parentNodeId,
}: CreatePostOverlayProps) {
    const editorRef = useRef<QuillEditorRef>(null);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!editorRef.current) return;

        const content = await editorRef.current.getContent();
        if (content === undefined) {
            toast.error("Cannot create an empty post.");
            return;
        }

        await createPost(title, content, communityId, parentNodeId);
        close();
    };

    return (
        <Overlay
            className="w-[150vh] h-[90vh]"
            onClose={close}
            title="Create post"
        >
            <div className="flex flex-col h-full">
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <Input
                        type="text"
                        placeholder="Post title"
                        className="mb-4 flex-shrink-0"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                    <div className="rounded h-[60vh]">
                        <QuillEditor
                            ref={editorRef}
                            className="w-full h-full"
                            value={content}
                            onChange={setContent}
                        />
                    </div>
                    <Button type="submit" className="mt-20 flex-shrink-0">
                        Post
                    </Button>
                </form>
            </div>
        </Overlay>
    );
}
