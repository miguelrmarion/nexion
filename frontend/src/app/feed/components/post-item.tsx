"use client";

import QuillEditor from "@/components/quill-editor";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import ProfilePicture from "@/components/ui/profile-picture";
import StarRating from "@/components/ui/star-rating";
import { useRating } from "@/hooks/use-rating";
import { Post, usePosts } from "@/lib/api/post";

interface PostItemProps {
    postId: number;
    onClick?: (post: Post) => void;
}

export default function PostItem({ onClick, postId }: PostItemProps) {
    const { data: posts } = usePosts();
    const { isAuthenticated, myRating, isRating, handleRating } =
        useRating(postId);

    const post = posts.find((p) => p.id === postId);

    if (!post)
        return (
            <Card className="p-4 mb-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </Card>
        );

    return (
        <Card className="p-5 mb-4 hover:shadow-lg">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-foreground">
                    {post.title}
                </h2>
                {!post.isVerified && (
                    <span className="text-xs font-medium text-warning bg-warning/10 px-2 py-0.5 rounded-full">
                        Proposal
                    </span>
                )}
            </div>
            <div className="mt-2 overflow-hidden rounded-lg border border-border">
                <QuillEditor
                    value={post.content}
                    readOnly={true}
                    className="text-text-secondary"
                />
            </div>
            <div className="flex items-center mt-3 text-text-muted text-sm">
                <ProfilePicture
                    src={post.authorProfilePicture}
                    username={post.authorUsername}
                    size="sm"
                    className="mr-2"
                />
                <span>{post.authorUsername}</span>
            </div>

            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-1.5">
                    <svg
                        className="w-4 h-4 text-warning fill-current"
                        viewBox="0 0 24 24"
                    >
                        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <span className="text-sm font-medium text-foreground">
                        {post.averageRating > 0
                            ? post.averageRating.toFixed(1)
                            : "--"}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <StarRating
                        rating={myRating}
                        onRatingChange={handleRating}
                        readonly={!isAuthenticated}
                        size="sm"
                    />
                    {isRating && (
                        <span className="text-xs text-primary animate-pulse">
                            Saving...
                        </span>
                    )}
                </div>

                <div className="ml-auto">
                    <Button size="sm" onClick={() => onClick?.(post)}>
                        View
                    </Button>
                </div>
            </div>
        </Card>
    );
}
