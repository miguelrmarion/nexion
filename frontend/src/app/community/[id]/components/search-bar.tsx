"use client";

import Input from "@/components/ui/input";
import { Post } from "@/lib/api/post";
import { useMemo, useState } from "react";

interface SearchBarProps {
    posts: Post[] | undefined;
    onPostSelect: (postId: number) => void;
}

export default function SearchBar({ posts, onPostSelect }: SearchBarProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDropdownIndex, setSelectedDropdownIndex] = useState(-1);

    const filteredPosts = useMemo(() => {
        if (!searchQuery || !posts) return posts;

        return posts.filter((post) =>
            post.title.toLowerCase().includes(searchQuery.toLowerCase()),
        );
    }, [posts, searchQuery]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!searchQuery || !filteredPosts || filteredPosts.length === 0)
            return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setSelectedDropdownIndex((prev) =>
                    prev < filteredPosts.length - 1 ? prev + 1 : 0,
                );
                break;
            case "ArrowUp":
                e.preventDefault();
                setSelectedDropdownIndex((prev) =>
                    prev > 0 ? prev - 1 : filteredPosts.length - 1,
                );
                break;
            case "Enter":
                e.preventDefault();
                if (
                    selectedDropdownIndex >= 0 &&
                    selectedDropdownIndex < filteredPosts.length
                )
                    handlePostSelect(
                        Number(filteredPosts[selectedDropdownIndex].id),
                    );

                break;
            case "Escape":
                setSearchQuery("");
                setSelectedDropdownIndex(-1);
                break;
        }
    };

    const handlePostSelect = (postId: number) => {
        onPostSelect(postId);
        setSearchQuery("");
        setSelectedDropdownIndex(-1);
    };

    return (
        <div className="relative w-1/2 mx-auto">
            <Input
                type="text"
                placeholder="Search"
                className="pl-10 h-10 shadow-sm"
                onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedDropdownIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                value={searchQuery}
            />
            <span className="absolute left-3 top-2.5 text-text-muted">
                <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                </svg>
            </span>

            {searchQuery && filteredPosts && filteredPosts.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-xl max-h-60 overflow-y-auto z-50">
                    {filteredPosts.map((post, index) => (
                        <div
                            key={post.id}
                            className={`px-4 py-2.5 cursor-pointer border-b border-border/50 last:border-b-0 ${
                                index === selectedDropdownIndex
                                    ? "bg-primary-light"
                                    : "hover:bg-surface-hover"
                            }`}
                            onClick={() => handlePostSelect(Number(post.id))}
                        >
                            <div className="text-sm font-medium text-foreground truncate">
                                {post.title}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {searchQuery && filteredPosts && filteredPosts.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-xl z-50">
                    <div className="px-4 py-3 text-sm text-text-muted text-center">
                        No posts found
                    </div>
                </div>
            )}
        </div>
    );
}
