export const FILE_UPLOAD = {
    MAX_SIZE: 10_000_000, // 10 MB
    ALLOWED_IMAGE_MIME_TYPES: [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
    ],
} as const;
