"use client";

import { useCallback, useState } from "react";

interface UseFilePreviewReturn {
    file: File | null;
    preview: string | null;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    setPreview: (preview: string | null) => void;
    reset: () => void;
}

export function useFilePreview(
    initialPreview: string | null = null,
): UseFilePreviewReturn {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(initialPreview);

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const selected = e.target.files?.[0];
            if (!selected) return;

            setFile(selected);

            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(selected);
        },
        [],
    );

    const reset = useCallback(() => {
        setFile(null);
        setPreview(null);
    }, []);

    return { file, preview, handleFileChange, setPreview, reset };
}
