"use client";

import { useEffect, useState } from "react";

export default function LoadingPage() {
    const [dots, setDots] = useState(".");

    useEffect(() => {
        const interval = setInterval(() => {
            setDots((prevDots) => {
                if (prevDots.length >= 3) return ".";
                return prevDots + ".";
            });
        }, 500);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-background">
            <div className="text-center animate-[fadeIn_0.3s_ease-out]">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-border border-t-primary mb-4"></div>
                <h2 className="text-xl font-semibold text-slate-700">
                    Loading{dots}
                </h2>
            </div>
        </div>
    );
}
