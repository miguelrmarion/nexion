"use client";

import { Post } from "@/lib/api/post";
import { User } from "@/lib/api/user";
import MindElixir from "@/lib/mind-elixir-import";
import type { MindElixirInstance, NodeObj } from "mind-elixir";
import React, { RefObject, useEffect, useState } from "react";
import ContextMenuPlugin from "./context-menu-plugin/context-menu-plugin";
import MindElixirReact from "./mind-elixir-react";
// @ts-expect-error style does exist in the package
import("mind-elixir/style.css");

const theme = {
    name: "Latte",
    palette: [
        "#dd7878",
        "#ea76cb",
        "#8839ef",
        "#e64553",
        "#fe640b",
        "#df8e1d",
        "#40a02b",
        "#209fb5",
        "#1e66f5",
        "#7287fd",
    ],
    cssVar: {
        "--main-color": "#ffffff",
        "--main-bgcolor": "#ffffff",
        "--color": "#777777",
        "--bgcolor": "#6a7282",
        "--panel-color": "#444446",
        "--panel-bgcolor": "#ffffff",
        "--panel-border-color": "#eaeaea",
    },
};

interface Props {
    mindElixirInstance?: MindElixirInstance;
    rootNodeTopic: string;
    posts: RefObject<Post[]>;
    postsData: Post[];
    onCreatePost: (node: NodeObj) => void;
    onShowPostContent: (node: NodeObj) => void;
    onDeletePost: (node: NodeObj) => void;
    mindElixirRef: React.RefObject<{ instance: MindElixirInstance } | null>;
    isAutoPublishPosts: boolean;
    isAdmin: boolean;
    isAuthenticated: boolean;
    currentUser: User | null;
}

// Recursively build mind-elixir nodes from posts
function buildNodeData(
    posts: Post[],
    rootNodeTopic: string,
    isAutoPublishPosts: boolean,
    currentUser: User | null,
) {
    const buildNodes = (parentId: string): NodeObj[] =>
        posts
            .filter((post) => post.parentNodeId === parentId)
            .map((post) => {
                const isCurrentUserPost =
                    currentUser && post.authorUsername === currentUser.name;
                const isVerified = post.isVerified || isAutoPublishPosts;

                return {
                    topic: `${post.title}${isVerified ? "" : " (Proposal)"}`,
                    icons: [isVerified ? "✓" : ""],
                    id: post.id.toString(),
                    children: buildNodes(post.id.toString()),
                    style: {
                        background: isVerified
                            ? "rgba(0, 0, 0, 1)"
                            : isCurrentUserPost
                              ? "rgba(59, 130, 246, 0.8)" // Blue color for current user's unverified posts
                              : "rgba(255, 255, 255, 0.2)", // Default for other unverified posts
                        color:
                            isVerified || isCurrentUserPost
                                ? "#ffffff"
                                : "#000000",
                    },
                };
            });

    return {
        id: "root",
        topic: rootNodeTopic,
        children: buildNodes("root"),
    };
}

export default function MindElixirComponent({
    rootNodeTopic,
    posts,
    postsData,
    onCreatePost,
    onShowPostContent,
    onDeletePost,
    mindElixirRef,
    isAutoPublishPosts,
    isAdmin,
    isAuthenticated,
    currentUser,
}: Props) {
    const [data, setData] = useState(MindElixir.new("init topic"));

    useEffect(() => {
        const initData = buildNodeData(
            postsData,
            rootNodeTopic,
            isAutoPublishPosts,
            currentUser,
        );
        setData({
            ...data,
            nodeData: initData,
        });
    }, [postsData, rootNodeTopic, isAutoPublishPosts, currentUser]);

    const options = {
        direction: MindElixir.SIDE,
        contextMenu: false,
        theme: theme as any,
        editable: true,
    };

    return (
        data.nodeData.id === "root" && (
            <MindElixirReact
                ref={mindElixirRef as any}
                data={data}
                plugins={[
                    ContextMenuPlugin(
                        onCreatePost,
                        onShowPostContent,
                        onDeletePost,
                        posts,
                        isAutoPublishPosts,
                        isAdmin,
                        isAuthenticated,
                        currentUser,
                    ),
                ]}
                options={options}
                className="h-[500px] w-full mt-5 mb-10 map-container"
                style={{
                    borderRadius: "0.85rem",
                    border: "2px solid var(--border)",
                    boxShadow:
                        "0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
                }}
            />
        )
    );
}
