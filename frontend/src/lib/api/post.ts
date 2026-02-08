import useSWR from "swr";
import { API_URL, fetcher, fetcherWithAuth } from "./util";

export interface Post {
    id: number;
    title: string;
    content: string;
    createdAt: string;
    authorUsername: string;
    authorProfilePicture?: string;
    communityId: number;
    isVerified: boolean;
    parentNodeId: string;
    averageRating: number;
}

export const createPost = async (
    title: string,
    content: string,
    communityId: number,
    parentNodeId: string
) => {
    return await fetch(`${API_URL}/communities/${communityId}/post`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ title, content, parentNodeId }),
    });
};

export const deletePost = async (postId: number) => {
    return await fetch(`${API_URL}/posts/${postId}`, {
        method: "DELETE",
        credentials: "include",
    });
};

export const verifyPost = async (communityId: number, postId: number) => {
    return await fetch(
        `${API_URL}/communities/${communityId}/verify-post/${postId}`,
        {
            method: "POST",
            credentials: "include",
        }
    );
};

export const discardPost = async (communityId: number, postId: number) => {
    return await fetch(
        `${API_URL}/communities/${communityId}/discard-post/${postId}`,
        {
            method: "POST",
            credentials: "include",
        }
    );
};

export const useUnverifiedPosts = (communityId: number) =>
    useSWR(`/communities/${communityId}/unverified-posts`, fetcher<Post[]>, {
        fallbackData: [],
    });

export const useCommunityPosts = (communityId: number) =>
    useSWR(`/communities/${communityId}/posts`, fetcherWithAuth<Post[]>, {
        fallbackData: [],
    });

export const ratePost = async (postId: number, rating: number) => {
    return await fetch(`${API_URL}/posts/${postId}/rate`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ rating }),
    });
};

export const getMyPostRating = async (postId: number) => {
    const response = await fetch(`${API_URL}/posts/${postId}/my-rating`, {
        method: "GET",
        credentials: "include",
    });
    return response.json();
};

export const useMyPostRating = (postId: number) =>
    useSWR(
        `/posts/${postId}/my-rating`,
        fetcherWithAuth<{ rating: number | null }>,
        {
            fallbackData: { rating: null },
        }
    );

export const usePosts = () =>
    useSWR("/posts", fetcher<Post[]>, {
        fallbackData: [],
    });

export interface Comment {
    id: number;
    content: string;
    createdAt: Date;
    authorUsername: string;
    authorProfilePicture?: string;
    postId: number;
    canDelete: boolean;
}

export const createComment = async (postId: number, content: string) => {
    return await fetch(`${API_URL}/posts/${postId}/comments`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ content }),
    });
};

export const deleteComment = async (commentId: number) => {
    return await fetch(`${API_URL}/posts/comments/${commentId}`, {
        method: "DELETE",
        credentials: "include",
    });
};

export const usePostComments = (postId: number) =>
    useSWR(`/posts/${postId}/comments`, fetcherWithAuth<Comment[]>, {
        fallbackData: [],
    });
