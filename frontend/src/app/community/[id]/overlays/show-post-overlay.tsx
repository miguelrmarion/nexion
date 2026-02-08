"use client";
import CommentSection from "@/components/feedback/comment-section";
import RatingFooter from "@/components/feedback/rating-footer";
import Overlay from "@/components/overlays/overlay";
import QuillEditor from "@/components/quill-editor";
import { useRating } from "@/hooks/use-rating";
import { Post } from "@/lib/api/post";

function TopicMatchBanner({ matches }: { matches: boolean }) {
    return (
        <div
            className={`p-2 text-sm ${
                matches ? "bg-green-50" : "bg-orange-50"
            } border-b`}
        >
            <span className={matches ? "text-green-600" : "text-orange-500"}>
                {matches
                    ? "✓ Matches community topics"
                    : "⚠ May not match community topics"}
            </span>
        </div>
    );
}

interface PostContentProps {
    content: string;
    postId: number;
    topicMatchInfo?: { matches: boolean };
}
function PostContent({ content, postId, topicMatchInfo }: PostContentProps) {
    return (
        <div className="flex-1 mb-4 overflow-y-auto border border-border rounded-xl">
            {topicMatchInfo && (
                <TopicMatchBanner matches={topicMatchInfo.matches} />
            )}
            <div className="h-full flex flex-col">
                <div className="overflow-y-auto mb-4 p-4">
                    <QuillEditor
                        className="w-full h-full"
                        value={content}
                        readOnly={true}
                    />
                </div>
                <div className="border-t border-border">
                    <CommentSection postId={postId} />
                </div>
            </div>
        </div>
    );
}

interface ShowPostOverlayProps {
    close: () => void;
    postData: Post;
    isAutoPublishPosts: boolean;
    topicMatchInfo?: {
        matches: boolean;
    };
}

export default function ShowPostOverlay({
    close,
    postData,
    isAutoPublishPosts,
    topicMatchInfo,
}: ShowPostOverlayProps) {
    const { isAuthenticated, myRating, isRating, handleRating } = useRating(
        postData.id,
        postData.communityId,
    );

    const title = `${postData.title}${
        !postData.isVerified && !isAutoPublishPosts ? " (Proposal)" : ""
    } - ${postData.authorUsername}`;

    return (
        <Overlay
            onClose={close}
            title={title}
            titleClassName="flex items-center"
            className="w-[150vh] h-[93vh]"
        >
            <div className="flex flex-col" style={{ height: "800px" }}>
                <PostContent
                    content={postData.content}
                    postId={postData.id}
                    topicMatchInfo={topicMatchInfo}
                />

                <RatingFooter
                    averageRating={postData.averageRating}
                    isAuthenticated={isAuthenticated}
                    myRating={myRating}
                    isRating={isRating}
                    onRatingChange={handleRating}
                />
            </div>
        </Overlay>
    );
}
