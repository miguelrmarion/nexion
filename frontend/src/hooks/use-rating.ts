"use client";

import { ratePost, useMyPostRating } from "@/lib/api/post";
import { useAuth } from "@/lib/providers/auth-provider";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useSWRConfig } from "swr";

export function useRating(postId: number, communityId?: number) {
    const { isAuthenticated } = useAuth();
    const { data: myRatingData, mutate: mutateMyRating } =
        useMyPostRating(postId);
    const [isRating, setIsRating] = useState(false);
    const { mutate } = useSWRConfig();

    const handleRating = async (rating: number) => {
        setIsRating(true);
        try {
            const response = await ratePost(postId, rating);
            if (response.ok) {
                toast.success("Rating submitted successfully!");
                await mutateMyRating();

                if (communityId) {
                    await mutate(`/communities/community/${communityId}`);
                    await mutate(`/communities/${communityId}/posts`);
                }
                await mutate("/feed");
                await mutate("/communities");
                await mutate("/posts");
            } else {
                toast.error("Failed to submit rating");
            }
        } catch {
            toast.error("Error submitting rating");
        } finally {
            setIsRating(false);
        }
    };

    return {
        isAuthenticated,
        myRating: isAuthenticated ? myRatingData?.rating || 0 : 0,
        isRating,
        handleRating: isAuthenticated ? handleRating : undefined,
    };
}
