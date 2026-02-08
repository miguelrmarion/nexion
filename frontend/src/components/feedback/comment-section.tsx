"use client";

import {
    Comment,
    createComment,
    deleteComment,
    usePostComments,
} from "@/lib/api/post";
import { useAuth } from "@/lib/providers/auth-provider";
import { formatDistanceToNow } from "date-fns";
import { memo, useCallback, useState } from "react";
import { toast } from "react-hot-toast";
import Button from "../ui/button";
import ProfilePicture from "../ui/profile-picture";
import TextArea from "../ui/text-area";

function CommentForm({
    postId,
    onCommentAdded,
}: {
    postId: number;
    onCommentAdded: () => void;
}) {
    const [text, setText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const response = await createComment(postId, text.trim());

            if (response.ok) {
                toast.success("Comment added");
                setText("");
                onCommentAdded();
            } else toast.error("Failed to add comment");
        } catch {
            toast.error("Error adding comment");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mb-3">
            <div className="flex items-center space-x-2">
                <TextArea
                    className="flex-grow"
                    rows={1}
                    placeholder="Add a comment..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    required
                />
                <Button
                    type="submit"
                    disabled={isSubmitting || !text.trim()}
                    size="sm"
                >
                    {isSubmitting ? "..." : "Comment"}
                </Button>
            </div>
        </form>
    );
}

const CommentItem = memo(function CommentItem({
    comment,
    isAuthenticated,
    onDelete,
}: {
    comment: Comment;
    isAuthenticated: boolean;
    onDelete: (id: number) => void;
}) {
    const formattedDate = formatDistanceToNow(new Date(comment.createdAt), {
        addSuffix: true,
    });

    return (
        <div className="p-2 border border-border rounded-lg hover:border-primary/20 transition-colors">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                    <ProfilePicture
                        src={comment.authorProfilePicture}
                        username={comment.authorUsername}
                        size="sm"
                    />
                    <div className="font-medium text-sm text-slate-800">
                        {comment.authorUsername}
                    </div>
                </div>
                <div className="text-xs text-muted">{formattedDate}</div>
            </div>
            <p className="text-sm text-slate-600 my-1">{comment.content}</p>
            {isAuthenticated && comment.canDelete && (
                <div className="flex justify-end">
                    <button
                        onClick={() => onDelete(comment.id)}
                        className="text-xs text-danger hover:text-red-700 transition-colors"
                    >
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
});

interface Props {
    postId: number;
}

export default function CommentSection({ postId }: Props) {
    const { isAuthenticated } = useAuth();
    const { data: comments, mutate: mutateComments } = usePostComments(postId);

    const handleDelete = useCallback(
        async (commentId: number) => {
            try {
                const response = await deleteComment(commentId);
                if (response.ok) {
                    toast.success("Comment removed");
                    await mutateComments();
                } else toast.error("Failed to remove comment");
            } catch {
                toast.error("Error removing comment");
            }
        },
        [mutateComments],
    );

    return (
        <div className="px-4 py-4">
            <h3 className="text-base font-medium mb-4 text-slate-800">
                Comments ({comments.length})
            </h3>

            {isAuthenticated ? (
                <CommentForm postId={postId} onCommentAdded={mutateComments} />
            ) : (
                <div className="py-3 px-3 border border-border rounded-lg text-muted text-center text-sm bg-surface">
                    Log in to add a comment
                </div>
            )}

            <div className="max-h-[180px] overflow-y-auto mt-3">
                {comments.length > 0 ? (
                    <div className="space-y-2">
                        {comments.map((comment: Comment) => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                isAuthenticated={isAuthenticated}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-4 text-muted text-sm">
                        No comments yet. Be the first to comment!
                    </div>
                )}
            </div>
        </div>
    );
}
