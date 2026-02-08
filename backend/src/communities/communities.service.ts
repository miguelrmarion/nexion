import {
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from "@nestjs/common";
import { ERROR_MESSAGES } from "src/common/constants/error-messages";
import { PrismaService } from "src/common/services/prisma.service";
import { RatingCalculatorService } from "src/common/services/rating-calculator.service";
import { CreateCommunityDto } from "./dto/create-community.dto";
import { ListAdminsDto } from "./dto/list-admins.dto";
import { ListCommunityDto } from "./dto/list-community.dto";
import { UpdateCommunityDto } from "./dto/update-community.dto";

@Injectable()
export class CommunitiesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly ratingCalculator: RatingCalculatorService,
    ) {}

    async create(createCommunityDto: CreateCommunityDto, ownerId: number) {
        if ((await this.getUserCommunityId(ownerId)) !== undefined)
            throw new UnauthorizedException(
                ERROR_MESSAGES.USER_ALREADY_HAS_COMMUNITY,
            );

        const community = await this.prisma.community.create({
            data: {
                name: createCommunityDto.name,
                description: createCommunityDto.description,
                createdAt: new Date(),
                ownerId: ownerId,
                autoPublishPosts: createCommunityDto.autoPublishPosts,
                iconImage: createCommunityDto.iconImage,
                bannerImage: createCommunityDto.bannerImage,
            },
        });

        return new ListCommunityDto(
            community.id,
            community.name,
            community.description,
            community.createdAt,
            0, // Initial follower count
            community.autoPublishPosts,
            0, // Initial rating
            community.bannerImage,
            community.iconImage,
        );
    }

    async findAll(): Promise<ListCommunityDto[]> {
        const communities = await this.prisma.community.findMany({
            include: {
                _count: {
                    select: { followers: true },
                },
                posts: {
                    include: {
                        ratings: {
                            select: { rating: true },
                        },
                    },
                },
            },
        });
        return communities.map((community) => {
            // Calculate average rating across all posts
            const allRatings = community.posts.flatMap((post) =>
                post.ratings.map((r) => r.rating),
            );
            const averageRating =
                this.ratingCalculator.calculateAverage(allRatings);

            return new ListCommunityDto(
                community.id,
                community.name,
                community.description,
                community.createdAt,
                community._count.followers,
                community.autoPublishPosts,
                averageRating,
                community.bannerImage,
                community.iconImage,
            );
        });
    }

    async findOne(id: number): Promise<ListCommunityDto> {
        const community = await this.prisma.community.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { followers: true },
                },
                posts: {
                    include: {
                        ratings: {
                            select: { rating: true },
                        },
                    },
                },
            },
        });
        if (!community) throw new NotFoundException();

        // Calculate average rating across all posts
        const allRatings = community.posts.flatMap((post) =>
            post.ratings.map((r) => r.rating),
        );
        const averageRating =
            this.ratingCalculator.calculateAverage(allRatings);

        return new ListCommunityDto(
            community.id,
            community.name,
            community.description,
            community.createdAt,
            community._count.followers,
            community.autoPublishPosts,
            averageRating,
            community.bannerImage,
            community.iconImage,
        );
    }

    async update(id: number, updateCommunityDto: UpdateCommunityDto) {
        // Remove undefined values
        const updateData = Object.fromEntries(
            Object.entries({
                name: updateCommunityDto.name,
                description: updateCommunityDto.description,
                autoPublishPosts: updateCommunityDto.autoPublishPosts,
                bannerImage: updateCommunityDto.bannerImage,
                iconImage: updateCommunityDto.iconImage,
            }).filter(([, value]) => value !== undefined),
        );

        return await this.prisma.community.update({
            where: { id },
            data: updateData,
        });
    }

    async getFollowedCommunities(userId: number) {
        const followedCommunities = await this.prisma.user
            .findUnique({ where: { id: userId } })
            .followedCommunities({
                include: {
                    _count: {
                        select: { followers: true },
                    },
                    posts: {
                        include: {
                            ratings: {
                                select: { rating: true },
                            },
                        },
                    },
                },
            })
            .then((value) => value || []);
        return followedCommunities.map((community) => {
            // Calculate average rating across all posts
            const allRatings = community.posts.flatMap((post) =>
                post.ratings.map((r) => r.rating),
            );
            const averageRating =
                this.ratingCalculator.calculateAverage(allRatings);
            return new ListCommunityDto(
                community.id,
                community.name,
                community.description,
                community.createdAt,
                community._count.followers,
                community.autoPublishPosts,
                averageRating,
                community.bannerImage,
                community.iconImage,
            );
        });
    }

    async followCommunity(communityId: number, userId: number) {
        const community = await this.prisma.community.findUnique({
            where: { id: communityId },
        });
        if (!community) throw new NotFoundException();

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                followedCommunities: {
                    connect: { id: communityId },
                },
            },
        });
    }

    async unfollowCommunity(communityId: number, userId: number) {
        const community = await this.prisma.community.findUnique({
            where: { id: communityId },
        });
        if (!community) throw new NotFoundException();

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                followedCommunities: {
                    disconnect: { id: communityId },
                },
            },
        });
    }

    async getUserCommunityId(userId: number) {
        return await this.prisma.community
            .findFirst({ where: { ownerId: userId } })
            .then((community) => community?.id);
    }

    async isUserAdminOfCommunity(userId: number, communityId: number) {
        const community = await this.prisma.community.findUnique({
            where: { id: communityId },
            include: { admins: true },
        });
        if (!community) throw new NotFoundException();

        return (
            community.ownerId === userId ||
            community.admins.some((admin) => admin.id === userId)
        );
    }

    async getAllAdmins(communityId: number) {
        const community = await this.prisma.community.findFirst({
            where: { id: communityId },
            include: { owner: true, admins: true },
        });
        if (!community) throw new NotFoundException();
        const admins = [
            new ListAdminsDto(community.owner.id, community.owner.name),
        ];

        return admins.concat(
            community.admins.map(
                (admin) => new ListAdminsDto(admin.id, admin.name),
            ),
        );
    }

    async addAdmin(communityId: number, username: string) {
        const user = await this.prisma.user.findUnique({
            where: { name: username },
        });
        if (!user) throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);

        return await this.prisma.community.update({
            where: { id: communityId },
            data: {
                admins: {
                    connect: { id: user.id },
                },
            },
        });
    }

    async removeAdmin(communityId: number, userId: number) {
        const community = await this.prisma.community.findUnique({
            where: { id: communityId },
            include: { admins: true },
        });
        if (!community) throw new NotFoundException();

        return await this.prisma.community.update({
            where: { id: communityId },
            data: {
                admins: {
                    disconnect: { id: userId },
                },
            },
        });
    }
}
