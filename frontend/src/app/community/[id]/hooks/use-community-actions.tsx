"use client";

import {
    followCommunity,
    unfollowCommunity,
    useFollowedCommunities,
} from "@/lib/api/community";
import { useAuth } from "@/lib/providers/auth-provider";
import { useSWRConfig } from "swr";

export function useCommunityActions(communityId: number) {
    const { isAuthenticated } = useAuth();
    const { data: followedCommunities } =
        useFollowedCommunities(isAuthenticated);
    const { mutate } = useSWRConfig();

    const isFollowed =
        followedCommunities?.some(
            (community) => community.id === communityId
        ) ?? false;

    const handleFollow = async () => {
        if (isFollowed) await unfollowCommunity(communityId);
        else await followCommunity(communityId);

        await mutate("/communities");
        await mutate("/communities/followed");
        await mutate(`/communities/community/${communityId}`);
    };

    return {
        isFollowed,
        handleFollow,
    };
}
