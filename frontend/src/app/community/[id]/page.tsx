"use client";

import MindElixirComponent from "@/app/community/[id]/mind-elixir/mind-elixir";
import DropdownMenu from "@/components/ui/dropdown-menu";
import { useCommunity, useIsUserAdminOfCommunity } from "@/lib/api/community";
import { deletePost, useCommunityPosts } from "@/lib/api/post";
import type { MindElixirInstance } from "mind-elixir";
import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useSWRConfig } from "swr";

import CommunityBanner from "./components/community-banner";
import SearchBar from "./components/search-bar";
import UserDropdownMenu from "./components/user-dropdown-menu";

import { useCommunityActions } from "./hooks/use-community-actions";
import { useMindElixirNavigation } from "./hooks/use-mind-elixir-navigation";
import { useOverlayManager } from "./hooks/use-overlay-manager";

import CreateCommunityOverlay from "@/app/feed/overlays/create-community-overlay";
import SpaceFix from "@/components/layout/space-fix";
import UserConfigOverlay from "@/components/overlays/user-config-overlay";
import { useAuth } from "@/lib/providers/auth-provider";
import "highlight.js/styles/stackoverflow-dark.css";
import ApprovePostOverlay from "./overlays/approve-post-overlay";
import ConfigureCommunityOverlay from "./overlays/configure-community-overlay";
import CreatePostOverlay from "./overlays/create-post-overlay";
import ManageAdminsOverlay from "./overlays/manage-admin-overlay";
import ShowPostOverlay from "./overlays/show-post-overlay";

export default function CommunityPage() {
    const communityId = Number(useParams().id);
    const router = useRouter();
    const { mutate } = useSWRConfig();
    const { isAuthenticated, user } = useAuth();

    const { data: community, error } = useCommunity(communityId);
    const { data: isAdmin } = useIsUserAdminOfCommunity(communityId);
    const { data: posts, isLoading: isLoadingPosts } =
        useCommunityPosts(communityId);

    const { isFollowed, handleFollow } = useCommunityActions(communityId);
    const mindElixirRef = useRef<{ instance: MindElixirInstance }>(null);
    const { postsRef, handlePostSelect } = useMindElixirNavigation(
        posts,
        mindElixirRef,
    );

    const overlayManager = useOverlayManager();
    const [showUserConfigOverlay, setShowUserConfigOverlay] = useState(false);
    const [showCreateCommunityOverlay, setShowCreateCommunityOverlay] =
        useState(false);

    const adminItems = {
        "Manage administrators": overlayManager.openManageAdmins,
        "Validate posts": overlayManager.openValidatePosts,
        "Configure community": overlayManager.openConfigureCommunity,
    };

    if (error && error.statusCode === 404)
        return (
            <div className="w-full flex flex-col items-center px-4 sm:px-6 lg:px-8 margin-top mt-4">
                <h1 className="text-lg font-semibold text-red-600">
                    Community not found
                </h1>
            </div>
        );

    if (community === undefined) return null;

    return (
        <div className="w-full flex flex-col items-center px-4 sm:px-6 lg:px-8 mt-4 pb-8">
            <SpaceFix />
            {overlayManager.createPostData.active && (
                <CreatePostOverlay
                    close={async () => {
                        overlayManager.closeCreatePost();
                        await mutate(`/communities/${communityId}/posts`);
                    }}
                    communityId={communityId}
                    parentNodeId={overlayManager.createPostData.nodeObj!.id}
                />
            )}

            {overlayManager.validatingPosts && (
                <ApprovePostOverlay
                    close={async () => {
                        overlayManager.setValidatingPosts(false);
                        await mutate(`/communities/${communityId}/posts`);
                    }}
                    communityId={communityId}
                    isAutoPublishPosts={community.autoPublishPosts}
                />
            )}

            {overlayManager.showPostData.active && (
                <ShowPostOverlay
                    close={overlayManager.closeShowPost}
                    postData={
                        posts?.find(
                            (post) =>
                                post.id.toString() ===
                                overlayManager.showPostData.postId!.toString(),
                        )!
                    }
                    isAutoPublishPosts={community.autoPublishPosts}
                />
            )}

            {overlayManager.managingAdmins && (
                <ManageAdminsOverlay
                    close={() => overlayManager.setManagingAdmins(false)}
                    communityId={communityId}
                />
            )}

            {overlayManager.configuringCommunity && (
                <ConfigureCommunityOverlay
                    close={() => overlayManager.setConfiguringCommunity(false)}
                    communityData={community}
                />
            )}

            {showUserConfigOverlay && (
                <UserConfigOverlay
                    close={() => setShowUserConfigOverlay(false)}
                />
            )}

            {showCreateCommunityOverlay && (
                <CreateCommunityOverlay
                    close={() => setShowCreateCommunityOverlay(false)}
                />
            )}

            <nav className="w-full flex justify-between items-center bg-gradient-to-r from-nav-from to-nav-to rounded-xl p-4 shadow-lg mx-4 mt-4">
                <div className="flex items-center space-x-3 flex-grow">
                    <img
                        src={"/favicon.ico"}
                        className="h-10 w-10 rounded-full object-cover ring-2 ring-white/20"
                    />
                    <button
                        className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg h-10 w-10 flex items-center justify-center"
                        onClick={() => router.push("/feed")}
                    >
                        <i className="fa-solid fa-arrow-left"></i>
                    </button>
                </div>
                <UserDropdownMenu
                    currentCommunityId={communityId}
                    setShowUserConfigOverlay={setShowUserConfigOverlay}
                    setShowCreateCommunityOverlay={
                        setShowCreateCommunityOverlay
                    }
                />
            </nav>

            <br />

            <CommunityBanner
                community={community}
                isFollowed={isFollowed}
                onFollow={handleFollow}
            />

            <div className="flex justify-center items-center mt-4 w-full flex-row">
                <SearchBar posts={posts} onPostSelect={handlePostSelect} />

                {isAdmin && (
                    <DropdownMenu
                        text="Admin Actions"
                        items={adminItems}
                        className="hover:shadow-xl"
                    />
                )}
            </div>

            {!isLoadingPosts && posts && (
                <MindElixirComponent
                    rootNodeTopic={community.description}
                    posts={postsRef}
                    postsData={posts}
                    onCreatePost={overlayManager.openCreatePost}
                    onShowPostContent={(nodeObj) =>
                        overlayManager.openShowPost(Number(nodeObj.id))
                    }
                    onDeletePost={async (nodeObj) => {
                        await deletePost(Number(nodeObj.id));
                        await mutate(`/communities/${communityId}/posts`);
                    }}
                    mindElixirRef={mindElixirRef}
                    isAutoPublishPosts={community.autoPublishPosts}
                    isAdmin={isAdmin}
                    isAuthenticated={isAuthenticated}
                    currentUser={user}
                />
            )}
        </div>
    );
}
