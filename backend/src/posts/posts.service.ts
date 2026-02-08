import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { ERROR_MESSAGES } from "src/common/constants/error-messages";
import { PrismaService } from "src/common/services/prisma.service";
import { RatingCalculatorService } from "src/common/services/rating-calculator.service";
import { CommunitiesService } from "src/communities/communities.service";
import { ListPostsDto } from "src/communities/dto/list-posts.dto";
import { ListCommentDto } from "./dto/list-comment.dto";

@Injectable()
export class PostsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly communitiesService: CommunitiesService,
        private readonly ratingCalculator: RatingCalculatorService,
    ) {}

    async findAll() {
        const posts = await this.prisma.post.findMany({
            include: {
                author: true,
                ratings: {
                    select: { rating: true },
                },
            },
        });

        return posts.map((post) => {
            const ratings = post.ratings.map((r) => r.rating);
            const averageRating =
                this.ratingCalculator.calculateAverage(ratings);

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
        });
    }

    async remove(postId: number, removingUserId: number) {
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
        });
        if (!post) throw new NotFoundException(ERROR_MESSAGES.POST_NOT_FOUND);

        const isAdmin = await this.communitiesService.isUserAdminOfCommunity(
            removingUserId,
            post.communityId,
        );
        const isOwner = post.authorId === removingUserId;
        const isUnverified = !post.isVerified;

        if (!isAdmin && !(isOwner && isUnverified))
            throw new ForbiddenException(
                ERROR_MESSAGES.UNAUTHORIZED_DELETE_POST,
            );

        const postsStack = [post];
        while (postsStack.length > 0) {
            const currentPost = postsStack.pop()!;

            await this.prisma.postRating.deleteMany({
                where: { postId: currentPost.id },
            });

            await this.prisma.comment.deleteMany({
                where: { postId: currentPost.id },
            });

            await this.prisma.post.delete({
                where: { id: currentPost.id },
            });

            const childPosts = await this.prisma.post.findMany({
                where: { parentNodeId: currentPost.id.toString() },
            });
            postsStack.push(...childPosts);
        }
    }

    async ratePost(postId: number, userId: number, rating: number) {
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
        });
        if (!post) throw new NotFoundException(ERROR_MESSAGES.POST_NOT_FOUND);

        return await this.prisma.postRating.upsert({
            where: {
                userId_postId: {
                    userId,
                    postId,
                },
            },
            update: {
                rating,
            },
            create: {
                userId,
                postId,
                rating,
            },
        });
    }

    async getUserPostRating(postId: number, userId: number) {
        const rating = await this.prisma.postRating.findUnique({
            where: {
                userId_postId: {
                    userId,
                    postId,
                },
            },
            select: { rating: true },
        });

        return {
            rating: rating?.rating || null,
        };
    }

    async createComment(postId: number, userId: number, content: string) {
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
        });
        if (!post) throw new NotFoundException(ERROR_MESSAGES.POST_NOT_FOUND);

        const comment = await this.prisma.comment.create({
            data: {
                content,
                userId,
                postId,
            },
            include: {
                user: true,
            },
        });

        return new ListCommentDto(
            comment.id,
            comment.content,
            comment.createdAt,
            comment.user.name,
            comment.user.profilePicture,
            comment.postId,
            false,
        );
    }

    async getPostComments(postId: number, userId: number | null = null) {
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
        });
        if (!post) throw new NotFoundException(ERROR_MESSAGES.POST_NOT_FOUND);

        const comments = await this.prisma.comment.findMany({
            where: {
                postId,
            },
            include: {
                user: true,
                post: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return Promise.all(
            comments.map(async (comment) => {
                // User can delete if they are the comment author or a community admin
                let canDelete = false;

                if (userId) {
                    const isCommentAuthor = comment.userId === userId;
                    const isAdmin =
                        await this.communitiesService.isUserAdminOfCommunity(
                            userId,
                            comment.post.communityId,
                        );

                    canDelete = isCommentAuthor || isAdmin;
                }

                return new ListCommentDto(
                    comment.id,
                    comment.content,
                    comment.createdAt,
                    comment.user.name,
                    comment.user.profilePicture,
                    comment.postId,
                    canDelete,
                );
            }),
        );
    }

    async deleteComment(commentId: number, userId: number) {
        const comment = await this.prisma.comment.findUnique({
            where: { id: commentId },
            include: { post: true },
        });

        if (!comment)
            throw new NotFoundException(ERROR_MESSAGES.COMMENT_NOT_FOUND);

        // Only the comment author or a community admin can delete comments
        if (
            comment.userId !== userId &&
            !(await this.communitiesService.isUserAdminOfCommunity(
                userId,
                comment.post.communityId,
            ))
        )
            throw new ForbiddenException(
                ERROR_MESSAGES.UNAUTHORIZED_DELETE_COMMENT,
            );

        return await this.prisma.comment.delete({
            where: { id: commentId },
        });
    }
}
