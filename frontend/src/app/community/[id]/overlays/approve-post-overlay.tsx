import Overlay from "@/components/overlays/overlay";
import Button from "@/components/ui/button";
import { checkPostTopicMatch, TopicMatchResult } from "@/lib/api/community";
import {
    discardPost,
    Post,
    useUnverifiedPosts,
    verifyPost,
} from "@/lib/api/post";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useSWRConfig } from "swr";
import ShowPostOverlay from "./show-post-overlay";

interface TopicMatchBadgeProps {
    isChecking: boolean;
    result: TopicMatchResult | null;
}
function TopicMatchBadge({ isChecking, result }: TopicMatchBadgeProps) {
    if (isChecking)
        return (
            <span className="text-sm text-primary">Analyzing topics...</span>
        );

    if (result)
        return (
            <span
                className={`text-sm ${
                    result.matches ? "text-green-600" : "text-orange-500"
                }`}
            >
                {result.matches
                    ? "✓ Matches community topics"
                    : "⚠ May not match community topics"}
            </span>
        );

    return (
        <span className="text-sm text-slate-400">Could not analyze topics</span>
    );
}

interface PostApprovalCardProps {
    post: Post;
    isChecking: boolean;
    topicMatch: TopicMatchResult | null;
    onView: () => void;
    onApprove: () => void;
    onReject: () => void;
}

function PostApprovalCard({
    post,
    isChecking,
    topicMatch,
    onView,
    onApprove,
    onReject,
}: PostApprovalCardProps) {
    return (
        <div className="border border-border rounded-xl bg-surface hover:bg-surface-hover hover:border-primary/20 transition-all duration-200">
            <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                        <span className="font-medium text-slate-800">
                            {post.title}
                        </span>
                        <span className="text-muted text-sm ml-2">
                            by {post.authorUsername}
                        </span>
                    </div>
                    <div className="flex space-x-2 ml-4">
                        <Button variant="secondary" size="sm" onClick={onView}>
                            View
                        </Button>
                        <Button variant="success" size="sm" onClick={onApprove}>
                            Approve
                        </Button>
                        <Button variant="danger" size="sm" onClick={onReject}>
                            Reject
                        </Button>
                    </div>
                </div>

                <div className="mt-1 text-sm">
                    <TopicMatchBadge
                        isChecking={isChecking}
                        result={topicMatch}
                    />
                </div>
            </div>
        </div>
    );
}

interface ApprovePostOverlayProps {
    close: () => void;
    communityId: number;
    isAutoPublishPosts: boolean;
}

export default function ApprovePostOverlay({
    close,
    communityId,
    isAutoPublishPosts,
}: ApprovePostOverlayProps) {
    const { data: posts } = useUnverifiedPosts(communityId);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [topicMatches, setTopicMatches] = useState<{
        [postId: number]: TopicMatchResult | null;
    }>({});
    const [checkingTopics, setCheckingTopics] = useState<{
        [postId: number]: boolean;
    }>({});
    const { mutate } = useSWRConfig();

    const checkTopicMatch = async (postId: number, content: string) => {
        try {
            setCheckingTopics((prev) => ({ ...prev, [postId]: true }));
            const result = await checkPostTopicMatch(communityId, content);
            setTopicMatches((prev) => ({ ...prev, [postId]: result }));
        } catch (error) {
            toast.error("Failed to verify topics");
        } finally {
            setCheckingTopics((prev) => ({ ...prev, [postId]: false }));
        }
    };

    useEffect(() => {
        if (posts && posts.length > 0)
            posts.forEach((post) => {
                if (!topicMatches[post.id] && !checkingTopics[post.id])
                    checkTopicMatch(post.id, post.content);
            });
    }, [posts]);

    const handleApprove = async (postId: number) => {
        await verifyPost(communityId, postId);

        if (posts.length === 1) close();
        else await mutate(`/communities/${communityId}/unverified-posts`);
    };

    const handleReject = async (postId: number) => {
        await discardPost(communityId, postId);

        if (posts.length === 1) close();
        else await mutate(`/communities/${communityId}/unverified-posts`);
    };

    return (
        <>
            <Overlay
                onClose={close}
                title="Review posts"
                className="w-[500px] max-h-[85vh]"
            >
                {posts?.length === 0 ? (
                    <div className="flex items-center justify-center h-32">
                        <p className="text-muted text-center">
                            There are no posts to review at the moment.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {posts.map((post) => (
                            <PostApprovalCard
                                key={post.id}
                                post={post}
                                isChecking={checkingTopics[post.id] || false}
                                topicMatch={topicMatches[post.id] || null}
                                onView={() => setSelectedPost(post)}
                                onApprove={() => handleApprove(post.id)}
                                onReject={() => handleReject(post.id)}
                            />
                        ))}
                    </div>
                )}
            </Overlay>

            {selectedPost && (
                <ShowPostOverlay
                    close={() => setSelectedPost(null)}
                    postData={selectedPost}
                    isAutoPublishPosts={isAutoPublishPosts}
                    topicMatchInfo={
                        topicMatches[selectedPost.id]
                            ? {
                                  matches:
                                      topicMatches[selectedPost.id]?.matches ||
                                      false,
                              }
                            : undefined
                    }
                />
            )}
        </>
    );
}
