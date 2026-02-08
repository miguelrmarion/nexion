import { Injectable, NotFoundException } from "@nestjs/common";
import * as cheerio from "cheerio";
import { ERROR_MESSAGES } from "src/common/constants/error-messages";
import { PrismaService } from "src/common/services/prisma.service";
import { RatingCalculatorService } from "src/common/services/rating-calculator.service";
import { TopicGuardService } from "src/topic-match.service";
import { CommunitiesService } from "./communities.service";
import { CreatePostDto } from "./dto/create-post.dto";
import { ListPostsDto } from "./dto/list-posts.dto";

@Injectable()
export class CommunityPostsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly topicGuardService: TopicGuardService,
        private readonly ratingCalculator: RatingCalculatorService,
        private readonly communitiesService: CommunitiesService,
    ) {}

    async createPost(
        createPostDto: CreatePostDto,
        communityId: number,
        authorId: number,
    ) {
        const community = await this.prisma.community.findUnique({
            where: { id: communityId },
        });
        if (!community)
            throw new NotFoundException(ERROR_MESSAGES.COMMUNITY_NOT_FOUND);

        const isAdmin = await this.communitiesService.isUserAdminOfCommunity(
            authorId,
            communityId,
        );

        return await this.prisma.post.create({
            data: {
                title: createPostDto.title,
                content: createPostDto.content,
                authorId: authorId,
                communityId: communityId,
                parentNodeId: createPostDto.parentNodeId,
                createdAt: new Date(),
                isVerified: isAdmin,
            },
        });
    }

    async verifyPost(postId: number) {
        const post = await this.prisma.post.update({
            where: { id: postId },
            data: { isVerified: true },
        });

        // Rebuild the community centroid with the newly-verified post included
        await this.rebuildCommunityCentroid(post.communityId);

        return post;
    }

    async discardPost(postId: number) {
        return await this.prisma.post.delete({ where: { id: postId } });
    }

    async getUnverifiedPosts(communityId: number): Promise<ListPostsDto[]> {
        const community = await this.prisma.community.findUnique({
            where: { id: communityId },
            include: {
                posts: {
                    include: {
                        author: true,
                        ratings: {
                            select: { rating: true },
                        },
                    },
                },
            },
        });
        if (!community)
            throw new NotFoundException(ERROR_MESSAGES.COMMUNITY_NOT_FOUND);

        return community.posts
            .filter((post) => !post.isVerified)
            .map((post) => this.toListPostsDto(post));
    }

    async getPostsByCommunityId(
        communityId: number,
        userId?: number,
    ): Promise<ListPostsDto[]> {
        const community = await this.prisma.community.findUnique({
            where: { id: communityId },
            include: {
                posts: {
                    include: {
                        author: true,
                        ratings: {
                            select: { rating: true },
                        },
                    },
                },
            },
        });
        if (!community)
            throw new NotFoundException(ERROR_MESSAGES.COMMUNITY_NOT_FOUND);

        let posts = community.posts;
        if (!community.autoPublishPosts) {
            const isAdmin =
                userId === undefined
                    ? false
                    : await this.communitiesService.isUserAdminOfCommunity(
                          userId,
                          communityId,
                      );
            if (!isAdmin) {
                // Show verified posts AND current user's own unverified posts
                posts = posts.filter(
                    (post) =>
                        post.isVerified || (userId && post.authorId === userId),
                );
            }
        }
        return posts.map((post) => this.toListPostsDto(post));
    }

    async checkPostTopicMatch(
        communityId: number,
        postContent: string,
    ): Promise<{ matches: boolean; score: number }> {
        const postText = this.extractText(postContent);

        if (!postText || postText.trim().length === 0)
            return { matches: true, score: 1 };

        const result = await this.topicGuardService.checkTopic(
            communityId,
            postText,
        );

        return { matches: result.match, score: result.score };
    }

    private async rebuildCommunityCentroid(communityId: number) {
        const posts = await this.prisma.post.findMany({
            where: { communityId, isVerified: true },
            select: { content: true },
        });

        const texts = posts
            .map((p) => this.extractText(p.content))
            .filter((t) => t.trim().length > 0);

        if (texts.length > 0)
            await this.topicGuardService.updateCommunity(communityId, texts);
    }

    private extractText(html: string): string {
        try {
            return cheerio.load(html || "").text() || "";
        } catch {
            return html || "";
        }
    }

    private toListPostsDto(post: {
        id: number;
        title: string;
        content: string;
        createdAt: Date;
        author: { name: string; profilePicture: string | null };
        communityId: number;
        isVerified: boolean;
        parentNodeId: string;
        ratings: { rating: number }[];
    }): ListPostsDto {
        const ratings = post.ratings.map((r) => r.rating);
        const averageRating = this.ratingCalculator.calculateAverage(ratings);

        return new ListPostsDto(
            post.id,
            post.title,
            post.content,
            post.createdAt,
            post.author.name,
            post.author.profilePicture,
            post.communityId,
            post.isVerified,
            post.parentNodeId,
            averageRating,
        );
    }
}
