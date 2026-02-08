import useSWR, { SWRResponse } from "swr";
import { API_URL, ApiError, fetcher, fetcherWithAuth } from "./util";

export interface ListCommunityDto {
    id: number;
    name: string;
    description: string;
    createdAt: Date;
    followersCount: number;
    autoPublishPosts: boolean;
    averageRating: number;
    bannerImage?: string | null;
    iconImage?: string | null;
}

export interface ListAdminsDto {
    id: number;
    username: string;
}

export const useCommunities = () =>
    useSWR("/communities", fetcher<ListCommunityDto[]>, {
        fallbackData: [],
    });

export const useCommunity = (
    communityId: number,
): SWRResponse<ListCommunityDto, ApiError> =>
    useSWR(`/communities/community/${communityId}`, fetcher<ListCommunityDto>);

export const useFollowedCommunities = (isAuthenticated: boolean) =>
    useSWR(
        isAuthenticated ? "/communities/followed" : null,
        fetcherWithAuth<ListCommunityDto[]>,
        { fallbackData: [] },
    );

export const useUserCommunityId = () =>
    useSWR("/communities/user", fetcherWithAuth<number>);

export const followCommunity = async (communityId: number) => {
    await fetch(`${API_URL}/communities/${communityId}/follow`, {
        method: "POST",
        credentials: "include",
    });
};

export const unfollowCommunity = async (communityId: number) => {
    await fetch(`${API_URL}/communities/${communityId}/unfollow`, {
        method: "DELETE",
        credentials: "include",
    });
};

export const useIsUserAdminOfCommunity = (communityId: number) =>
    useSWR(`/communities/${communityId}/is-admin`, fetcherWithAuth<boolean>, {
        fallbackData: false,
    });

export const useAdmins = (communityId: number) =>
    useSWR(
        `/communities/${communityId}/admins`,
        fetcherWithAuth<ListAdminsDto[]>,
        { fallbackData: [] },
    );

export const addAdmin = async (communityId: number, username: string) => {
    return await fetch(
        `${API_URL}/communities/${communityId}/admins/${username}`,
        {
            method: "POST",

            credentials: "include",
        },
    );
};

export const removeAdmin = async (communityId: number, userId: number) => {
    return await fetch(
        `${API_URL}/communities/${communityId}/admins/${userId}`,
        {
            method: "DELETE",
            credentials: "include",
        },
    );
};

export const updateCommunity = async (
    communityId: number,
    name: string,
    description: string,
    autoPublishPosts: boolean,
) => {
    await fetch(`${API_URL}/communities/community/${communityId}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            name,
            description,
            autoPublishPosts,
        }),
        credentials: "include",
    });
};

export const createCommunity = async (
    name: string,
    description: string,
    autoPublishPosts: boolean,
    iconImage?: string,
    bannerImage?: string,
): Promise<ListCommunityDto> => {
    return await fetch(`${API_URL}/communities`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            name,
            description,
            autoPublishPosts,
            iconImage,
            bannerImage,
        }),
        credentials: "include",
    }).then((response) => response.json());
};

export const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);

    return await fetch(`${API_URL}/communities/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
    })
        .then((response) => response.json())
        .then((data) => data.url);
};

export interface TopicMatchResult {
    matches: boolean;
    score: number;
}

export const checkPostTopicMatch = async (
    communityId: number,
    content: string,
): Promise<TopicMatchResult> => {
    const response = await fetch(
        `${API_URL}/communities/${communityId}/check-post-topic-match`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ content }),
            credentials: "include",
        },
    );

    return await response.json();
};

export const updateCommunityImages = async (
    communityId: number,
    bannerImage?: File,
    iconImage?: File,
): Promise<ListCommunityDto> => {
    const formData = new FormData();

    if (bannerImage) formData.append("bannerImage", bannerImage);

    const response = await fetch(
        `${API_URL}/communities/community/${communityId}`,
        {
            method: "PATCH",
            credentials: "include",
            body: formData,
        },
    );

    if (!response.ok) throw new Error("Failed to update community images");

    const updatedCommunity = await response.json();

    // If an icon image was also passed, update it separately
    if (iconImage) {
        const iconFormData = new FormData();
        iconFormData.append("iconImage", iconImage);

        const iconResponse = await fetch(
            `${API_URL}/communities/community/${communityId}/icon`,
            {
                method: "PATCH",
                credentials: "include",
                body: iconFormData,
            },
        );

        if (!iconResponse.ok)
            throw new Error("Failed to update community icon");
    }

    return updatedCommunity;
};
