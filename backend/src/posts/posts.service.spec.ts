import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "src/common/services/prisma.service";
import { RatingCalculatorService } from "src/common/services/rating-calculator.service";
import { CommunitiesService } from "src/communities/communities.service";
import { PostsService } from "./posts.service";

type MockPrisma = {
    post: { findMany: jest.Mock; findUnique: jest.Mock; delete: jest.Mock };
    postRating: {
        upsert: jest.Mock;
        findUnique: jest.Mock;
        deleteMany: jest.Mock;
    };
    comment: {
        create: jest.Mock;
        findMany: jest.Mock;
        findUnique: jest.Mock;
        delete: jest.Mock;
        deleteMany: jest.Mock;
    };
};

type MockCommunitiesService = { isUserAdminOfCommunity: jest.Mock };

describe("PostsService", () => {
    let service: PostsService;
    let prisma: MockPrisma;
    let communitiesService: MockCommunitiesService;

    beforeEach(async () => {
        prisma = {
            post: {
                findMany: jest.fn(),
                findUnique: jest.fn(),
                delete: jest.fn(),
            },
            postRating: {
                upsert: jest.fn(),
                findUnique: jest.fn(),
                deleteMany: jest.fn(),
            },
            comment: {
                create: jest.fn(),
                findMany: jest.fn(),
                findUnique: jest.fn(),
                delete: jest.fn(),
                deleteMany: jest.fn(),
            },
        };

        communitiesService = {
            isUserAdminOfCommunity: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PostsService,
                { provide: PrismaService, useValue: prisma },
                { provide: CommunitiesService, useValue: communitiesService },
                {
                    provide: RatingCalculatorService,
                    useValue: new RatingCalculatorService(),
                },
            ],
        }).compile();

        service = module.get<PostsService>(PostsService);
    });

    describe("findAll", () => {
        it("should return all posts with calculated average ratings", async () => {
            prisma.post.findMany.mockResolvedValue([
                {
                    id: 1,
                    title: "Post 1",
                    content: "Content",
                    createdAt: new Date("2024-01-01"),
                    author: { name: "user1", profilePicture: null },
                    communityId: 1,
                    isVerified: true,
                    parentNodeId: "root",
                    ratings: [{ rating: 4 }, { rating: 2 }],
                },
            ]);

            const result = await service.findAll();

            expect(result).toHaveLength(1);
            expect(result[0].averageRating).toBe(3); // (4+2)/2
            expect(result[0].authorUsername).toBe("user1");
        });

        it("should return 0 average for posts with no ratings", async () => {
            prisma.post.findMany.mockResolvedValue([
                {
                    id: 1,
                    title: "No Ratings",
                    content: "c",
                    createdAt: new Date(),
                    author: { name: "u", profilePicture: null },
                    communityId: 1,
                    isVerified: true,
                    parentNodeId: "root",
                    ratings: [],
                },
            ]);

            const result = await service.findAll();
            expect(result[0].averageRating).toBe(0);
        });
    });

    describe("remove", () => {
        it("should allow an admin to delete any post", async () => {
            prisma.post.findUnique
                .mockResolvedValueOnce({
                    id: 1,
                    authorId: 99,
                    communityId: 1,
                    isVerified: true,
                })
                // No child posts
                .mockResolvedValueOnce(null);
            prisma.post.findMany.mockResolvedValue([]);
            communitiesService.isUserAdminOfCommunity.mockResolvedValue(true);
            prisma.postRating.deleteMany.mockResolvedValue({});
            prisma.comment.deleteMany.mockResolvedValue({});
            prisma.post.delete.mockResolvedValue({});

            await expect(service.remove(1, 42)).resolves.not.toThrow();
            expect(prisma.post.delete).toHaveBeenCalled();
        });

        it("should allow the author to delete their own unverified post", async () => {
            prisma.post.findUnique.mockResolvedValueOnce({
                id: 1,
                authorId: 42,
                communityId: 1,
                isVerified: false,
            });
            prisma.post.findMany.mockResolvedValue([]);
            communitiesService.isUserAdminOfCommunity.mockResolvedValue(false);
            prisma.postRating.deleteMany.mockResolvedValue({});
            prisma.comment.deleteMany.mockResolvedValue({});
            prisma.post.delete.mockResolvedValue({});

            await expect(service.remove(1, 42)).resolves.not.toThrow();
        });

        it("should forbid the author from deleting their own verified post", async () => {
            prisma.post.findUnique.mockResolvedValueOnce({
                id: 1,
                authorId: 42,
                communityId: 1,
                isVerified: true,
            });
            communitiesService.isUserAdminOfCommunity.mockResolvedValue(false);

            await expect(service.remove(1, 42)).rejects.toThrow(
                ForbiddenException,
            );
        });

        it("should forbid a non-admin non-owner from deleting", async () => {
            prisma.post.findUnique.mockResolvedValueOnce({
                id: 1,
                authorId: 99,
                communityId: 1,
                isVerified: false,
            });
            communitiesService.isUserAdminOfCommunity.mockResolvedValue(false);

            await expect(service.remove(1, 42)).rejects.toThrow(
                ForbiddenException,
            );
        });

        it("should throw NotFoundException when post does not exist", async () => {
            prisma.post.findUnique.mockResolvedValue(null);
            await expect(service.remove(999, 1)).rejects.toThrow(
                NotFoundException,
            );
        });

        it("should recursively delete child posts", async () => {
            prisma.post.findUnique.mockResolvedValueOnce({
                id: 1,
                authorId: 42,
                communityId: 1,
                isVerified: false,
            });
            communitiesService.isUserAdminOfCommunity.mockResolvedValue(false);
            prisma.postRating.deleteMany.mockResolvedValue({});
            prisma.comment.deleteMany.mockResolvedValue({});
            prisma.post.delete.mockResolvedValue({});

            // First call: children of post 1
            prisma.post.findMany
                .mockResolvedValueOnce([
                    { id: 2, authorId: 42, communityId: 1, isVerified: false },
                ])
                // Second call: children of post 2
                .mockResolvedValueOnce([]);

            await service.remove(1, 42);

            // Should have deleted both post 1 and child post 2
            expect(prisma.post.delete).toHaveBeenCalledTimes(2);
        });
    });

    describe("ratePost", () => {
        it("should upsert a rating for an existing post", async () => {
            prisma.post.findUnique.mockResolvedValue({ id: 1 });
            prisma.postRating.upsert.mockResolvedValue({
                userId: 42,
                postId: 1,
                rating: 5,
            });

            const result = await service.ratePost(1, 42, 5);

            expect(result.rating).toBe(5);
            expect(prisma.postRating.upsert).toHaveBeenCalledWith({
                where: { userId_postId: { userId: 42, postId: 1 } },
                update: { rating: 5 },
                create: { userId: 42, postId: 1, rating: 5 },
            });
        });

        it("should throw NotFoundException when post does not exist", async () => {
            prisma.post.findUnique.mockResolvedValue(null);
            await expect(service.ratePost(999, 1, 3)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe("getUserPostRating", () => {
        it("should return the user rating", async () => {
            prisma.postRating.findUnique.mockResolvedValue({ rating: 4 });
            const result = await service.getUserPostRating(1, 42);
            expect(result.rating).toBe(4);
        });

        it("should return null when user has not rated", async () => {
            prisma.postRating.findUnique.mockResolvedValue(null);
            const result = await service.getUserPostRating(1, 42);
            expect(result.rating).toBeNull();
        });
    });

    describe("createComment", () => {
        it("should create a comment and return a DTO", async () => {
            prisma.post.findUnique.mockResolvedValue({ id: 1 });
            prisma.comment.create.mockResolvedValue({
                id: 100,
                content: "Nice post!",
                createdAt: new Date("2024-06-01"),
                user: { name: "commenter", profilePicture: "pic.jpg" },
                postId: 1,
            });

            const result = await service.createComment(1, 42, "Nice post!");

            expect(result.id).toBe(100);
            expect(result.content).toBe("Nice post!");
            expect(result.canDelete).toBe(false);
        });

        it("should throw NotFoundException when post does not exist", async () => {
            prisma.post.findUnique.mockResolvedValue(null);
            await expect(service.createComment(999, 1, "text")).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe("getPostComments", () => {
        const makeComments = () => [
            {
                id: 1,
                content: "Comment A",
                createdAt: new Date(),
                userId: 42,
                user: { name: "commenter", profilePicture: null },
                post: { communityId: 1 },
                postId: 10,
            },
            {
                id: 2,
                content: "Comment B",
                createdAt: new Date(),
                userId: 99,
                user: { name: "other", profilePicture: null },
                post: { communityId: 1 },
                postId: 10,
            },
        ];

        it("should set canDelete=true for the comment author", async () => {
            prisma.post.findUnique.mockResolvedValue({ id: 10 });
            prisma.comment.findMany.mockResolvedValue(makeComments());
            communitiesService.isUserAdminOfCommunity.mockResolvedValue(false);

            const result = await service.getPostComments(10, 42);

            expect(result[0].canDelete).toBe(true); // own comment
            expect(result[1].canDelete).toBe(false); // other's comment
        });

        it("should set canDelete=true for all comments when user is admin", async () => {
            prisma.post.findUnique.mockResolvedValue({ id: 10 });
            prisma.comment.findMany.mockResolvedValue(makeComments());
            communitiesService.isUserAdminOfCommunity.mockResolvedValue(true);

            const result = await service.getPostComments(10, 42);

            expect(result[0].canDelete).toBe(true);
            expect(result[1].canDelete).toBe(true);
        });

        it("should set all canDelete=false for anonymous users", async () => {
            prisma.post.findUnique.mockResolvedValue({ id: 10 });
            prisma.comment.findMany.mockResolvedValue(makeComments());

            const result = await service.getPostComments(10, null);

            expect(result[0].canDelete).toBe(false);
            expect(result[1].canDelete).toBe(false);
        });
    });

    describe("deleteComment", () => {
        it("should allow the comment author to delete", async () => {
            prisma.comment.findUnique.mockResolvedValue({
                id: 1,
                userId: 42,
                post: { communityId: 1 },
            });
            prisma.comment.delete.mockResolvedValue({ id: 1 });

            await expect(service.deleteComment(1, 42)).resolves.not.toThrow();
            expect(prisma.comment.delete).toHaveBeenCalledWith({
                where: { id: 1 },
            });
        });

        it("should allow a community admin to delete any comment", async () => {
            prisma.comment.findUnique.mockResolvedValue({
                id: 1,
                userId: 99,
                post: { communityId: 1 },
            });
            communitiesService.isUserAdminOfCommunity.mockResolvedValue(true);
            prisma.comment.delete.mockResolvedValue({ id: 1 });

            await expect(service.deleteComment(1, 42)).resolves.not.toThrow();
        });

        it("should forbid a non-author non-admin from deleting", async () => {
            prisma.comment.findUnique.mockResolvedValue({
                id: 1,
                userId: 99,
                post: { communityId: 1 },
            });
            communitiesService.isUserAdminOfCommunity.mockResolvedValue(false);

            await expect(service.deleteComment(1, 42)).rejects.toThrow(
                ForbiddenException,
            );
        });

        it("should throw NotFoundException when comment does not exist", async () => {
            prisma.comment.findUnique.mockResolvedValue(null);
            await expect(service.deleteComment(999, 1)).rejects.toThrow(
                NotFoundException,
            );
        });
    });
});
