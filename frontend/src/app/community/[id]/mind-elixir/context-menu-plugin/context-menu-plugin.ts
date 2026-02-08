"use client";

import { Post } from "@/lib/api/post";
import { User } from "@/lib/api/user";
import type { MindElixirInstance, NodeObj } from "mind-elixir";
import type { RefObject } from "react";
import "./context-menu.css";

export default function ContextMenuPlugin(
    onCreatePost: (node: NodeObj) => void,
    onShowPostContent: (node: NodeObj) => void,
    onDeletePost: (node: NodeObj) => void,
    posts: RefObject<Post[]>,
    isAutoPublishPosts: boolean,
    isAdmin: boolean,
    isAuthenticated: boolean,
    currentUser: User | null,
) {
    return function (mindElixir: MindElixirInstance) {
        const createLi = (id: string, name: string, keyname: string) => {
            const li = document.createElement("li");
            li.id = id;
            li.innerHTML = `<span>${name}</span><span ${
                keyname ? 'class="key"' : ""
            }>${keyname}</span>`;
            return li;
        };

        const showPostContent = createLi(
            "cm-show-post-content",
            "Show content",
            "",
        );
        const createPost = createLi("cm-create-post", "Create post", "");
        const deletePost = createLi("cm-delete-post", "Delete post", "");

        const menuUl = document.createElement("ul");
        menuUl.className = "menu-list";
        menuUl.appendChild(showPostContent);
        menuUl.appendChild(createPost);
        menuUl.appendChild(deletePost);

        const menuContainer = document.createElement("div");
        menuContainer.className = "context-menu";
        menuContainer.appendChild(menuUl);
        menuContainer.hidden = true;

        mindElixir.container.append(menuContainer);
        let isRoot = true;

        // Helper function to actually render and position context menu.
        const showMenu = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === "ME-TPC") {
                isRoot = target.parentElement!.tagName === "ME-ROOT";
                if (isRoot) showPostContent.className = "disabled";
                else showPostContent.className = "";

                const node = mindElixir.currentNode;
                if (node) {
                    const post = posts.current?.find(
                        (p) => p.id.toString() === node.nodeObj.id,
                    );

                    if (!isAutoPublishPosts) {
                        if (post && !post.isVerified)
                            createPost.className = "disabled";
                        else createPost.className = "";
                    }

                    // Allow deletion if user is admin OR if it's their own unverified post
                    if (!isRoot) {
                        const canDelete =
                            isAdmin ||
                            (currentUser &&
                                post &&
                                !post.isVerified &&
                                post.authorUsername === currentUser.name);
                        deletePost.className = canDelete ? "" : "disabled";
                    } else {
                        deletePost.className = "disabled";
                    }

                    if (isAuthenticated) createPost.className = "";
                    else createPost.className = "disabled";
                }

                menuContainer.hidden = false;

                menuUl.style.top = "";
                menuUl.style.bottom = "";
                menuUl.style.left = "";
                menuUl.style.right = "";
                const rect = menuUl.getBoundingClientRect();
                const height = menuUl.offsetHeight;
                const width = menuUl.offsetWidth;

                const relativeY = e.clientY - rect.top;
                const relativeX = e.clientX - rect.left;

                if (height + relativeY > window.innerHeight) {
                    menuUl.style.top = "";
                    menuUl.style.bottom = "0px";
                } else {
                    menuUl.style.bottom = "";
                    menuUl.style.top = relativeY + 15 + "px";
                }

                if (width + relativeX > window.innerWidth) {
                    menuUl.style.left = "";
                    menuUl.style.right = "0px";
                } else {
                    menuUl.style.right = "";
                    menuUl.style.left = relativeX + 10 + "px";
                }
            }
        };

        mindElixir.bus.addListener("showContextMenu", showMenu);

        menuContainer.onclick = (e) => {
            if (e.target === menuContainer) menuContainer.hidden = true;
        };

        showPostContent.onclick = () => {
            const currentNode = mindElixir.currentNode;
            if (!currentNode) return;
            onShowPostContent(currentNode.nodeObj);
            menuContainer.hidden = true;
        };

        createPost.onclick = () => {
            const currentNode = mindElixir.currentNode;
            if (!currentNode) return;
            onCreatePost(currentNode.nodeObj);

            menuContainer.hidden = true;
        };

        deletePost.onclick = () => {
            const currentNode = mindElixir.currentNode;
            if (!currentNode) return;
            onDeletePost(currentNode.nodeObj);

            menuContainer.hidden = true;
        };

        return () => {
            showPostContent.onclick = null;
            createPost.onclick = null;
            deletePost.onclick = null;
        };
    };
}
