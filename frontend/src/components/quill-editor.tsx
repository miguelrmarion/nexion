import { uploadImage } from "@/lib/api/community";
import hljs from "highlight.js";
import Quill, { Delta } from "quill";
import "quill/dist/quill.snow.css";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

// Code from the Quill React documentation with our image uploading logic added in
const ParchmentImage = Quill.import("formats/image") as any;

const sanitize = (url: string, protocols: string[]) => {
    const anchor = document.createElement("a");
    anchor.href = url;

    const protocol = anchor.href.slice(0, anchor.href.indexOf(":"));
    return protocols.indexOf(protocol) > -1;
};

class KlsejournalImage extends ParchmentImage {
    static sanitize(url: string) {
        return sanitize(url, ["http", "https", "data", "blob"]) ? url : "//:0";
    }
}

Quill.debug("error");
Quill.register(KlsejournalImage);

const toolbarOptions = [
    ["bold", "italic", "underline", "strike"], // toggled buttons
    ["blockquote", "code-block"],
    ["link", "image", "video", "formula"],

    [{ header: 1 }, { header: 2 }], // custom button values
    [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],
    [{ script: "sub" }, { script: "super" }], // superscript/subscript
    [{ indent: "-1" }, { indent: "+1" }], // outdent/indent
    [{ direction: "rtl" }], // text direction

    // [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
    [{ header: [1, 2, 3, 4, 5, 6, false] }],

    [{ color: [] }, { background: [] }], // dropdown with defaults from theme
    [{ font: [] }],
    [{ align: [] }],

    ["clean"], // remove formatting button
];

interface Props {
    value: string;
    onChange?: (value: string) => void;
    className?: string;
    onSubmit?: () => void;
    readOnly?: boolean;
}

export interface QuillEditorRef {
    getContent: () => Promise<string | undefined>;
}

const QuillEditor = forwardRef<QuillEditorRef, Props>(
    ({ value, onChange, className, readOnly }, ref) => {
        const editorRef = useRef<HTMLDivElement | null>(null);
        const quillRef = useRef<Quill | null>(null);
        const tempImage = useRef<{ blob: string; file: File }[]>([]);

        const isEmpty = () => {
            const quill = quillRef.current!;
            if ((quill.getContents()["ops"] || []).length !== 1) return false;

            return quill.getText().trim().length === 0;
        };

        const deltaToHTML = (delta: Delta) => {
            const tempQuill = new Quill(document.createElement("div"));
            tempQuill.setContents(delta);
            return tempQuill.root.innerHTML;
        };

        const uploadToServer = async (imageBlob: string) => {
            const imageToUpload = tempImage.current.find(
                (item) => item.blob === imageBlob,
            )!;

            return await uploadImage(imageToUpload.file);
        };

        // Save uploaded images to upload them later when the content is submitted
        const imageHandler = () => {
            const input = document.createElement("input");

            input.setAttribute("type", "file");
            input.setAttribute("accept", "image/*");
            input.click();

            input.onchange = () => {
                const [file] = input.files!;

                if (/^image\//.test(file.type)) {
                    const quill = quillRef.current!;
                    const range = quill.getSelection()!;
                    const blob = URL.createObjectURL(file);

                    quill.insertEmbed(range.index, "image", blob);
                    quill.setSelection(range.index + 1);

                    tempImage.current.push({ blob, file });
                }
            };
        };

        const getContent = async () => {
            if (isEmpty()) return undefined;

            const quill = quillRef.current!;
            const delta = quill.getContents();

            for (let i = 0; i < delta.ops.length; i++) {
                const insert = delta.ops[i].insert;

                const has = Object.prototype.hasOwnProperty;

                if (
                    typeof insert === "object" &&
                    insert &&
                    has.call(insert, "image")
                ) {
                    const imageUrl = await uploadToServer(
                        (insert as any).image,
                    );
                    (insert as any).image = imageUrl;
                }
            }

            const html = deltaToHTML(delta);
            return html;
        };

        // Expose methods to parent component
        useImperativeHandle(ref, () => ({
            getContent,
        }));

        useEffect(() => {
            if (editorRef.current && !quillRef.current) {
                quillRef.current = new Quill(editorRef.current, {
                    theme: "snow", // or 'bubble'
                    modules: {
                        toolbar: readOnly
                            ? false
                            : {
                                  container: toolbarOptions,
                                  handlers: {
                                      image: imageHandler,
                                  },
                              },
                        syntax: { hljs },
                    },
                    placeholder: "",
                    readOnly: readOnly ?? false,
                });

                quillRef.current.on("text-change", () => {
                    if (onChange !== undefined)
                        onChange(quillRef.current!.root.innerHTML);
                });
            }
        }, [onChange]);

        useEffect(() => {
            if (quillRef.current && value !== quillRef.current.root.innerHTML) {
                const selection = quillRef.current.getSelection();
                const cursorPosition = selection ? selection.index : 0;

                quillRef.current.root.innerHTML = value;
                quillRef.current.setSelection(cursorPosition);
            }
        }, [value]);

        return (
            <div className={className}>
                <div ref={editorRef} className="h-[31vh]" />
            </div>
        );
    },
);

QuillEditor.displayName = "QuillEditor";

export default QuillEditor;
