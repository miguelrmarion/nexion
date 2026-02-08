"use client";
import { ReactNode } from "react";

interface OverlayProps {
    isOpen?: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    className?: string;
    titleClassName?: string;
    showTitle?: boolean;
    overflow?: boolean;
    height?: string;
}

export default function Overlay({
    isOpen = true,
    onClose,
    title,
    children,
    className = "",
    titleClassName = "",
    showTitle = true,
    overflow = false,
    height,
}: OverlayProps) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className={`animate-[slideUp_0.25s_ease-out] bg-surface p-6 rounded-2xl shadow-2xl border border-border ${className}`}
            >
                <div className="relative">
                    <button
                        onClick={onClose}
                        className="absolute top-0 right-0 p-1.5 rounded-full text-text-muted hover:text-danger hover:bg-danger/10"
                        aria-label="Close"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>
                {showTitle && title && (
                    <h2
                        className={`text-xl font-bold mb-4 text-foreground ${titleClassName}`}
                    >
                        {title}
                    </h2>
                )}
                <div
                    className={`text-text-secondary ${overflow ? "overflow-y-auto" : ""}`}
                    style={height ? { height } : {}}
                >
                    {children}
                </div>
            </div>
        </div>
    );
}
