"use client";
import CommentSection from "@/components/feedback/comment-section";
import RatingFooter from "@/components/feedback/rating-footer";
import Overlay from "@/components/overlays/overlay";
import QuillEditor from "@/components/quill-editor";
import Button from "@/components/ui/button";
import { useRating } from "@/hooks/use-rating";
import { Post, usePosts } from "@/lib/api/post";
import { useRouter } from "next/navigation";

interface PostContentProps {
    content: string;
    postId: number;
}
function PostContent({ content, postId }: PostContentProps) {
    return (
        <div className="flex-1 mb-4 overflow-y-auto border border-border rounded-xl">
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

interface ViewPostOverlayProps {
    close: () => void;
    postData: Post;
    isAutoPublishPosts: boolean;
}

export default function ViewPostOverlay({
    close,
    postData,
    isAutoPublishPosts,
}: ViewPostOverlayProps) {
    const router = useRouter();
    const { data: posts } = usePosts();
    const { isAuthenticated, myRating, isRating, handleRating } = useRating(
        postData.id,
        postData.communityId,
    );

    const updatedPostData =
        posts.find((post) => post.id === postData.id) || postData;

    const title = `${updatedPostData.title}${
        !updatedPostData.isVerified && !isAutoPublishPosts ? " (Proposal)" : ""
    } - ${updatedPostData.authorUsername}`;

    return (
        <Overlay
            onClose={close}
            title={title}
            titleClassName="flex items-center"
            className="w-[150vh] h-[93vh]"
        >
            <div className="flex flex-col" style={{ height: "800px" }}>
                <PostContent content={postData.content} postId={postData.id} />

                <RatingFooter
                    averageRating={updatedPostData.averageRating}
                    isAuthenticated={isAuthenticated}
                    myRating={myRating}
                    isRating={isRating}
                    onRatingChange={handleRating}
                >
                    <Button
                        className="w-full"
                        onClick={() =>
                            router.push(
                                `/community/${updatedPostData.communityId}`,
                            )
                        }
                    >
                        Go to community
                    </Button>
                </RatingFooter>
            </div>
        </Overlay>
    );
}
