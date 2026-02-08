interface ProfilePictureProps {
    src?: string | null;
    username: string;
    size?: "sm" | "md" | "lg";
    className?: string;
}

export default function ProfilePicture({
    src,
    username,
    size = "md",
    className = "",
}: ProfilePictureProps) {
    const sizeClasses = {
        sm: "w-6 h-6 text-xs",
        md: "w-8 h-8 text-sm",
        lg: "w-12 h-12 text-lg",
    };

    const sizeClass = sizeClasses[size];

    // Show profile picture if available, otherwise show initials with a gradient background
    if (src)
        return (
            <img
                src={src}
                alt={`${username}'s profile`}
                className={`${sizeClass} rounded-full object-cover border-2 border-border ring-1 ring-white/50 ${className}`}
            />
        );

    return (
        <div
            className={`${sizeClass} rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center border-2 border-white/50 ring-1 ring-primary/20 ${className}`}
        >
            <span className="text-white font-medium">
                {username.charAt(0).toUpperCase()}
            </span>
        </div>
    );
}
