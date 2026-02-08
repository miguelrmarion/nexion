"use client";

import { Post } from "@/lib/api/post";
import MindElixir from "@/lib/mind-elixir-import";
import type { MindElixirInstance } from "mind-elixir";

import { useEffect, useRef } from "react";

export function useMindElixirNavigation(
    posts: Post[] | undefined,
    mindElixirRef: React.RefObject<{ instance: MindElixirInstance } | null>,
) {
    const postsRef = useRef<Post[]>([]);

    useEffect(() => {
        postsRef.current = posts || [];
    }, [posts]);

    // Focuses the mind-elixir node that represents the given post ID
    const handlePostSelect = (postId: number) => {
        if (!mindElixirRef.current?.instance) return;

        const mindElixir = mindElixirRef.current.instance;
        const domNode = MindElixir.E(postId.toString());

        if (!domNode) return;

        const containerRect = mindElixir.container.getBoundingClientRect();
        const nodeRect = domNode.getBoundingClientRect();

        const isCompletelyOutOfBounds =
            nodeRect.right < containerRect.left ||
            nodeRect.left > containerRect.right ||
            nodeRect.bottom < containerRect.top ||
            nodeRect.top > containerRect.bottom;

        if (isCompletelyOutOfBounds) mindElixir.selectNode(domNode);
        else {
            mindElixir.selectNode(domNode);

            const targetX = containerRect.width / 2;
            const targetY = containerRect.height / 2;

            const currentX =
                nodeRect.left - containerRect.left + nodeRect.width / 2;
            const currentY =
                nodeRect.top - containerRect.top + nodeRect.height / 2;

            const dx = targetX - currentX;
            const dy = targetY - currentY;

            mindElixir.move(dx, dy);
        }
    };

    return {
        postsRef,
        handlePostSelect,
    };
}
