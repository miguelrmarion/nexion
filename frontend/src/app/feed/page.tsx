"use client";

import UserConfigOverlay from "@/components/overlays/user-config-overlay";
import DropdownMenu from "@/components/ui/dropdown-menu";
import Input from "@/components/ui/input";
import ProfilePicture from "@/components/ui/profile-picture";
import { logoutUser } from "@/lib/api/auth";
import {
    useCommunities,
    useFollowedCommunities,
    useUserCommunityId,
} from "@/lib/api/community";
import { Post, usePosts } from "@/lib/api/post";
import { useAuth } from "@/lib/providers/auth-provider";
import "highlight.js/styles/stackoverflow-dark.css";
import { useRouter } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import CommunityItem from "./components/community-item";
import PostItem from "./components/post-item";
import CreateCommunityOverlay from "./overlays/create-community-overlay";
import ViewPostOverlay from "./overlays/view-post-overlay";

interface UserDropdownMenuProps {
    setShowCreateCommunityOverlay: (value: boolean) => void;
    setShowUserConfigOverlay: (value: boolean) => void;
}

function UserDropdownMenu({
    setShowCreateCommunityOverlay,
    setShowUserConfigOverlay,
}: UserDropdownMenuProps) {
    const router = useRouter();
    const { isAuthenticated, user } = useAuth();

    const { data: userCommunityId } = useUserCommunityId();

    const authenticatedItems = {
        ...(userCommunityId === undefined
            ? { "Create Community": () => setShowCreateCommunityOverlay(true) }
            : {
                  "Your community": () =>
                      router.push(`/community/${userCommunityId}`),
              }),

        Settings: () => setShowUserConfigOverlay(true),
        "Log out": async () => {
            await logoutUser();
            location.reload();
        },
    };

    const unauthenticatedItems = {
        Login: () => router.push("/auth/login?returnUrl=/feed"),
    };

    return (
        <DropdownMenu
            text={user?.name || "User"}
            items={isAuthenticated ? authenticatedItems : unauthenticatedItems}
            icon={
                isAuthenticated && user ? (
                    <ProfilePicture
                        src={user.profilePicture}
                        username={user.name}
                        size="sm"
                    />
                ) : null
            }
        />
    );
}

interface FeedNavbarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    setShowCreateCommunityOverlay: (value: boolean) => void;
    setShowUserConfigOverlay: (value: boolean) => void;
}

function FeedNavbar({
    activeTab,
    onTabChange,
    setShowCreateCommunityOverlay,
    setShowUserConfigOverlay,
}: FeedNavbarProps) {
    const tabClass = (name: string) =>
        `flex items-center py-2 px-5 rounded-lg font-medium text-sm focus:outline-none ${
            activeTab === name
                ? "bg-white text-nav-from shadow-md"
                : "text-white/70 hover:bg-white/10 hover:text-white"
        }`;

    return (
        <nav className="flex justify-between items-center bg-gradient-to-r from-nav-from to-nav-to rounded-xl p-4 shadow-lg mx-4 mt-4">
            <img
                src="/favicon.ico"
                className="h-10 w-10 rounded-full object-cover ring-2 ring-white/20"
            />
            <div className="flex justify-center space-x-2 flex-grow">
                <button
                    onClick={() => onTabChange("Posts")}
                    className={tabClass("Posts")}
                >
                    Posts
                </button>
                <button
                    onClick={() => onTabChange("Community")}
                    className={tabClass("Community")}
                >
                    Communities
                </button>
            </div>
            <UserDropdownMenu
                setShowCreateCommunityOverlay={setShowCreateCommunityOverlay}
                setShowUserConfigOverlay={setShowUserConfigOverlay}
            />
        </nav>
    );
}

function FollowedCommunitiesSidebar() {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const { data: followedCommunities } =
        useFollowedCommunities(isAuthenticated);

    return (
        <aside className="w-64 bg-gradient-to-b from-nav-from to-nav-to rounded-xl shadow-lg ml-4 mt-4 mb-4 flex flex-col">
            <div className="p-4 flex flex-col h-full">
                <h2 className="text-white/90 text-sm font-semibold mb-4 text-center uppercase tracking-wider flex-shrink-0">
                    Following
                </h2>
                <div className="space-y-2 overflow-y-auto flex-1">
                    {isAuthenticated ? (
                        followedCommunities.map((community) => (
                            <div
                                key={community.id}
                                className="bg-white/10 backdrop-blur-sm text-white rounded-lg p-3 cursor-pointer hover:bg-white/20 active:scale-[0.98] flex-shrink-0 border border-white/5"
                                onClick={() =>
                                    router.push(`/community/${community.id}`)
                                }
                            >
                                <h3 className="font-semibold text-sm">
                                    {community.name}
                                </h3>
                                <p className="text-xs text-white/60 truncate mt-0.5">
                                    {community.description}
                                </p>
                            </div>
                        ))
                    ) : (
                        <p className="text-white/50 text-sm text-center">
                            Log in to see your followed communities
                        </p>
                    )}
                </div>
            </div>
        </aside>
    );
}

interface SearchInputProps {
    value: string;
    onChange: (v: string) => void;
}

function SearchInput({ value, onChange }: SearchInputProps) {
    return (
        <div className="flex justify-center items-center mt-4 w-full">
            <div className="relative w-1/2 mx-auto">
                <Input
                    type="text"
                    placeholder="Search"
                    className="pl-10 h-10 shadow-sm"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
                <span className="absolute left-3 top-2.5 text-text-muted">
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                </span>
            </div>
        </div>
    );
}

interface FeedContentProps {
    activeTab: string;
    onViewPost: (post: Post, isAutoPublishPosts: boolean) => void;
}

const FeedContent = memo(function FeedContent({
    activeTab,
    onViewPost,
}: FeedContentProps) {
    const { isAuthenticated } = useAuth();
    const { data: communities } = useCommunities();
    const { data: posts } = usePosts();
    const { data: followedCommunities } =
        useFollowedCommunities(isAuthenticated);
    const [searchTerm, setSearchTerm] = useState("");

    // Reset search when switching tabs
    useEffect(() => {
        setSearchTerm("");
    }, [activeTab]);

    const filteredCommunities = useMemo(
        () =>
            communities.filter((c) =>
                c.name.toLowerCase().includes(searchTerm.toLowerCase()),
            ),
        [communities, searchTerm],
    );

    const filteredPosts = useMemo(
        () =>
            posts.filter((p) =>
                p.title.toLowerCase().includes(searchTerm.toLowerCase()),
            ),
        [posts, searchTerm],
    );

    const handlePostClick = useCallback(
        (post: Post) => {
            const community = communities.find(
                (c) => c.id === post.communityId,
            );
            onViewPost(post, community?.autoPublishPosts ?? false);
        },
        [communities, onViewPost],
    );

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <SearchInput value={searchTerm} onChange={setSearchTerm} />

            <div className="flex-grow mt-4 overflow-y-auto mx-4 pb-4">
                {activeTab === "Community"
                    ? filteredCommunities.map((community) => (
                          <CommunityItem
                              key={community.id}
                              communityId={community.id}
                              isFollowed={
                                  isAuthenticated &&
                                  followedCommunities.some(
                                      (fc) => fc.id === community.id,
                                  )
                              }
                          />
                      ))
                    : filteredPosts.map((post) => (
                          <PostItem
                              key={post.id}
                              postId={post.id}
                              onClick={handlePostClick}
                          />
                      ))}
            </div>
        </div>
    );
});

interface ViewPostData {
    postData: Post | undefined;
    isAutoPublishPosts: boolean;
    active: boolean;
}

export default function Feed() {
    const [activeTab, setActiveTab] = useState("Posts");

    const [viewPostData, setViewPostData] = useState<ViewPostData>({
        postData: undefined,
        isAutoPublishPosts: false,
        active: false,
    });

    const [showCreateCommunityOverlay, setShowCreateCommunityOverlay] =
        useState(false);
    const [showUserConfigOverlay, setShowUserConfigOverlay] = useState(false);

    const handleViewPost = useCallback(
        (post: Post, isAutoPublishPosts: boolean) => {
            setViewPostData({
                postData: post,
                isAutoPublishPosts,
                active: true,
            });
        },
        [],
    );

    return (
        <div className="flex flex-col h-screen bg-background relative">
            {viewPostData.active && (
                <ViewPostOverlay
                    close={() =>
                        setViewPostData({
                            postData: undefined,
                            isAutoPublishPosts: false,
                            active: false,
                        })
                    }
                    postData={viewPostData.postData!}
                    isAutoPublishPosts={viewPostData.isAutoPublishPosts}
                />
            )}

            {showCreateCommunityOverlay && (
                <CreateCommunityOverlay
                    close={() => setShowCreateCommunityOverlay(false)}
                />
            )}

            {showUserConfigOverlay && (
                <UserConfigOverlay
                    close={() => setShowUserConfigOverlay(false)}
                />
            )}

            <FeedNavbar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                setShowCreateCommunityOverlay={setShowCreateCommunityOverlay}
                setShowUserConfigOverlay={setShowUserConfigOverlay}
            />

            <div className="flex flex-1 overflow-hidden">
                <FollowedCommunitiesSidebar />
                <FeedContent
                    activeTab={activeTab}
                    onViewPost={handleViewPost}
                />
            </div>
        </div>
    );
}
