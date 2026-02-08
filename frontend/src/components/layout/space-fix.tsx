"use client";

import { useEffect } from "react";

// This component is necessary because mind-elixir captures the space event and prevents it from being typed
// This stops the propagation of the space event when the focus is not on mind-elixir
export default function SpaceFix() {
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            const target = e.target as HTMLElement;

            const isFormElement =
                target &&
                (target.tagName === "INPUT" ||
                    target.tagName === "TEXTAREA" ||
                    target.tagName === "SELECT" ||
                    target.getAttribute("contenteditable") === "true" ||
                    target.closest(".ql-editor") !== null); // Quill editor

            if (isFormElement && e.key === " ") e.stopPropagation();
        }

        document.addEventListener("keydown", handleKeyDown, true);

        return () =>
            document.removeEventListener("keydown", handleKeyDown, true);
    }, []);

    return null;
}
