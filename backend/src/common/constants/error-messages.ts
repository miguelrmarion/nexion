export const ERROR_MESSAGES = {
    // Authentication
    AUTH_INVALID_CREDENTIALS: "Invalid username or password",
    AUTH_EMAIL_IN_USE: "This email is already in use",
    AUTH_USERNAME_IN_USE: "This username is already in use",
    AUTH_TOKEN_EXPIRED: "Authentication token expired",

    // Authorization
    UNAUTHORIZED: "You are not authorized to perform this action",
    UNAUTHORIZED_DELETE_POST:
        "Only community admins can delete verified posts. Unverified posts can be deleted by their authors.",
    UNAUTHORIZED_DELETE_COMMENT: "You are not allowed to delete this comment",
    UNAUTHORIZED_NOT_ADMIN:
        "Only community administrators can perform this action",

    // Resources
    POST_NOT_FOUND: "Post not found",
    COMMUNITY_NOT_FOUND: "Community not found",
    USER_NOT_FOUND: "User not found",
    COMMENT_NOT_FOUND: "Comment not found",

    // Validation
    INVALID_POST_ID: "Invalid post ID",
    INVALID_COMMUNITY_ID: "Invalid community ID",
    INVALID_COMMENT_ID: "Invalid comment ID",
    INVALID_USER_ID: "Invalid user ID",

    // Business logic
    USER_ALREADY_HAS_COMMUNITY: "User already has a community",
    CANNOT_DELETE_VERIFIED_POST: "Cannot delete a verified post",
    INVALID_RATING: "Rating must be between 1 and 5",

    // File upload
    INVALID_FILE_TYPE: "File must be an image",
    FILE_TOO_LARGE: "File size exceeds maximum allowed size",
    UPLOAD_FAILED: "Failed to upload file",
} as const;

export type ErrorMessage = (typeof ERROR_MESSAGES)[keyof typeof ERROR_MESSAGES];
