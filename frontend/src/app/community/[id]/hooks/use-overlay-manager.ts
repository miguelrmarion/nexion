"use client";

import type { NodeObj } from "mind-elixir";
import { useCallback, useState } from "react";

interface CreatePostState {
    nodeObj: NodeObj | undefined;
    active: boolean;
}

interface ShowPostState {
    postId: number | undefined;
    active: boolean;
}

export function useOverlayManager() {
    const [createPostData, setCreatePostData] = useState<CreatePostState>({
        nodeObj: undefined,
        active: false,
    });

    const [showPostData, setShowPostData] = useState<ShowPostState>({
        postId: undefined,
        active: false,
    });

    const [validatingPosts, setValidatingPosts] = useState(false);
    const [managingAdmins, setManagingAdmins] = useState(false);
    const [configuringCommunity, setConfiguringCommunity] = useState(false);

    const openCreatePost = useCallback(
        (node: NodeObj) => setCreatePostData({ nodeObj: node, active: true }),
        [],
    );
    const closeCreatePost = useCallback(
        () => setCreatePostData({ nodeObj: undefined, active: false }),
        [],
    );

    const openShowPost = useCallback(
        (postId: number) => setShowPostData({ postId, active: true }),
        [],
    );
    const closeShowPost = useCallback(
        () => setShowPostData({ postId: undefined, active: false }),
        [],
    );

    const openValidatePosts = useCallback(() => setValidatingPosts(true), []);
    const openManageAdmins = useCallback(() => setManagingAdmins(true), []);
    const openConfigureCommunity = useCallback(
        () => setConfiguringCommunity(true),
        [],
    );

    return {
        createPostData,
        showPostData,
        validatingPosts,
        managingAdmins,
        configuringCommunity,
        openCreatePost,
        closeCreatePost,
        openShowPost,
        closeShowPost,
        openValidatePosts,
        openManageAdmins,
        openConfigureCommunity,
        setValidatingPosts,
        setManagingAdmins,
        setConfiguringCommunity,
    };
}
