"use client";

import DropdownMenu from "@/components/ui/dropdown-menu";
import ProfilePicture from "@/components/ui/profile-picture";
import { logoutUser } from "@/lib/api/auth";
import { useUserCommunityId } from "@/lib/api/community";
import { useAuth } from "@/lib/providers/auth-provider";
import { useRouter } from "next/navigation";

interface UserDropdownMenuProps {
    currentCommunityId: number;
    setShowUserConfigOverlay: (value: boolean) => void;
    setShowCreateCommunityOverlay: (value: boolean) => void;
}

export default function UserDropdownMenu({
    currentCommunityId,
    setShowUserConfigOverlay,
    setShowCreateCommunityOverlay,
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
        Login: () =>
            router.push(
                `/auth/login?returnUrl=/community/${currentCommunityId}`,
            ),
    };

    const displayText = user?.name || "User";

    return (
        <DropdownMenu
            text={displayText}
            items={isAuthenticated ? authenticatedItems : unauthenticatedItems}
            className="hover:bg-white/10 hover:text-white"
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
