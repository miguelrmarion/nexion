import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import {
    followCommunity,
    unfollowCommunity,
    useCommunities,
} from "@/lib/api/community";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";

interface CommunityItemProps {
    communityId: number;
    isFollowed: boolean;
}

export default function CommunityItem({
    isFollowed,
    communityId,
}: CommunityItemProps) {
    const router = useRouter();
    const { mutate } = useSWRConfig();
    const { data: communities } = useCommunities();

    const community = communities.find((c) => c.id === communityId);

    if (!community)
        return (
            <Card className="p-4 mb-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </Card>
        );

    const handleFollow = async () => {
        if (isFollowed) await unfollowCommunity(community.id);
        else await followCommunity(community.id);
        await mutate("/communities");
        await mutate("/communities/followed");
    };

    return (
        <Card interactive className="p-5 mb-4">
            <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0">
                    {community.iconImage ? (
                        <img
                            src={community.iconImage}
                            alt={`${community.name} icon`}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-border"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                            <span className="text-lg font-bold text-white">
                                {community.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-foreground">
                        {community.name}
                    </h2>
                    <p className="text-text-muted text-sm mt-0.5">
                        {community.description}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-text-muted">
                <span>{community.followersCount} followers</span>
                <span className="text-border">|</span>
                <span className="flex items-center gap-1">
                    <svg
                        className="w-4 h-4 text-warning fill-current"
                        viewBox="0 0 24 24"
                    >
                        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    {community.averageRating > 0
                        ? community.averageRating.toFixed(1)
                        : "--"}
                </span>
            </div>
            <div className="flex justify-between mt-4 gap-3">
                <Button size="sm" onClick={handleFollow}>
                    {isFollowed ? "Unfollow" : "Follow"}
                </Button>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => router.push(`/community/${community.id}`)}
                >
                    View
                </Button>
            </div>
        </Card>
    );
}
