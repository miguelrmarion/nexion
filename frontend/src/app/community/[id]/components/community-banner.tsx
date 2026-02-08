"use client";

import Button from "@/components/ui/button";
import { ListCommunityDto } from "@/lib/api/community";
import { useAuth } from "@/lib/providers/auth-provider";

interface CommunityBannerProps {
    community: ListCommunityDto;
    isFollowed: boolean;
    onFollow: () => void;
}

export default function CommunityBanner({
    community,
    isFollowed,
    onFollow,
}: CommunityBannerProps) {
    const { isAuthenticated } = useAuth();

    return (
        <>
            <div className="mt-5 w-full relative mb-14">
                <div className="w-full h-56 bg-gradient-to-br from-nav-from to-accent relative flex justify-center items-center rounded-xl overflow-hidden shadow-lg">
                    {community.bannerImage ? (
                        <img
                            src={community.bannerImage}
                            alt="Community Banner"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="text-white/40 text-2xl font-light tracking-wide">
                            {community.name}
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>

                <div className="absolute -bottom-12 left-12 w-24 h-24 rounded-full border-4 border-white bg-gradient-to-br from-primary to-accent flex justify-center items-center shadow-xl overflow-hidden z-10 ring-4 ring-background">
                    {community.iconImage ? (
                        <img
                            src={community.iconImage}
                            alt="Community Icon"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-2xl font-bold text-white">
                            {community.name.charAt(0).toUpperCase()}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex w-full flex-row">
                <div className="w-300 flex items-center">
                    <div className="ml-36">
                        <h2 className="text-xl font-bold text-foreground">
                            {community.name}
                        </h2>
                        <p className="text-sm text-text-muted mt-0.5">
                            {community.description}
                        </p>
                        <div className="flex items-center gap-3 text-sm text-text-muted mt-1">
                            <span>{community.followersCount} Followers</span>
                            <span className="text-border">|</span>
                            <span className="flex items-center gap-1">
                                <svg
                                    className="w-4 h-4 text-warning fill-current"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                                {community.averageRating || "--"}
                            </span>
                        </div>
                        {isAuthenticated && (
                            <Button
                                variant={isFollowed ? "secondary" : "primary"}
                                size="sm"
                                className="mt-3"
                                onClick={onFollow}
                            >
                                {isFollowed ? "Unfollow" : "Follow"}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
