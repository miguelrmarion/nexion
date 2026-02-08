import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "src/common/services/prisma.service";
import { RatingCalculatorService } from "src/common/services/rating-calculator.service";
import { TopicGuardService } from "src/topic-match.service";
import { CommunitiesService } from "./communities.service";
import { CommunityPostsService } from "./community-posts.service";

type MockPrisma = {
    community: { findUnique: jest.Mock };
    post: {
        create: jest.Mock;
        update: jest.Mock;
        delete: jest.Mock;
        findMany: jest.Mock;
    };
};

type MockCommunitiesService = { isUserAdminOfCommunity: jest.Mock };
type MockTopicGuardService = {
    checkTopic: jest.Mock;
    updateCommunity: jest.Mock;
};

describe("CommunityPostsService", () => {
    let service: CommunityPostsService;
    let prisma: MockPrisma;
    let communitiesService: MockCommunitiesService;
    let topicGuardService: MockTopicGuardService;

    beforeEach(async () => {
        prisma = {
            community: {
                findUnique: jest.fn(),
            },
            post: {
                create: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
                findMany: jest.fn(),
            },
        };

        communitiesService = {
            isUserAdminOfCommunity: jest.fn(),
        };

        topicGuardService = {
            checkTopic: jest.fn(),
            updateCommunity: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CommunityPostsService,
                { provide: PrismaService, useValue: prisma },
                { provide: CommunitiesService, useValue: communitiesService },
                { provide: TopicGuardService, useValue: topicGuardService },
                {
                    provide: RatingCalculatorService,
                    useValue: new RatingCalculatorService(),
                },
            ],
        }).compile();

        service = module.get<CommunityPostsService>(CommunityPostsService);
    });

    describe("createPost", () => {
        const dto = {
            title: "Test Post",
            content: "<p>Hello world</p>",
            parentNodeId: "root",
        };

        it("should create a post and auto-verify if the author is an admin", async () => {
            prisma.community.findUnique.mockResolvedValue({ id: 1 });
            communitiesService.isUserAdminOfCommunity.mockResolvedValue(true);
            prisma.post.create.mockResolvedValue({ id: 10, isVerified: true });

            const result = await service.createPost(dto, 1, 42);

            expect(result.isVerified).toBe(true);
            expect(prisma.post.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    title: "Test Post",
                    isVerified: true,
                    authorId: 42,
                    communityId: 1,
                }),
            });
        });

        it("should create an unverified post for a non-admin", async () => {
            prisma.community.findUnique.mockResolvedValue({ id: 1 });
            communitiesService.isUserAdminOfCommunity.mockResolvedValue(false);
            prisma.post.create.mockResolvedValue({ id: 11, isVerified: false });

            const result = await service.createPost(dto, 1, 99);

            expect(result.isVerified).toBe(false);
        });

        it("should throw NotFoundException when community does not exist", async () => {
            prisma.community.findUnique.mockResolvedValue(null);

            await expect(service.createPost(dto, 999, 1)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe("verifyPost", () => {
        it("should set isVerified to true and rebuild centroid", async () => {
            prisma.post.update.mockResolvedValue({
                id: 10,
                communityId: 1,
                isVerified: true,
            });
            prisma.post.findMany.mockResolvedValue([
                { content: "<p>Some text</p>" },
            ]);
            topicGuardService.updateCommunity.mockResolvedValue(undefined);

            const result = await service.verifyPost(10);

            expect(result.isVerified).toBe(true);
            expect(prisma.post.update).toHaveBeenCalledWith({
                where: { id: 10 },
                data: { isVerified: true },
            });
        });
    });

    describe("discardPost", () => {
        it("should delete the post", async () => {
            prisma.post.delete.mockResolvedValue({ id: 10 });

            const result = await service.discardPost(10);

            expect(prisma.post.delete).toHaveBeenCalledWith({
                where: { id: 10 },
            });
            expect(result.id).toBe(10);
        });
    });

    describe("getUnverifiedPosts", () => {
        it("should return only unverified posts", async () => {
            prisma.community.findUnique.mockResolvedValue({
                id: 1,
                posts: [
                    {
                        id: 1,
                        title: "Verified",
                        content: "c",
                        createdAt: new Date(),
                        author: { name: "u1", profilePicture: null },
                        communityId: 1,
                        isVerified: true,
                        parentNodeId: "root",
                        ratings: [],
                    },
                    {
                        id: 2,
                        title: "Unverified",
                        content: "c",
                        createdAt: new Date(),
                        author: { name: "u2", profilePicture: null },
                        communityId: 1,
                        isVerified: false,
                        parentNodeId: "root",
                        ratings: [{ rating: 3 }],
                    },
                ],
            });

            const result = await service.getUnverifiedPosts(1);

            expect(result).toHaveLength(1);
            expect(result[0].title).toBe("Unverified");
            expect(result[0].averageRating).toBe(3);
        });

        it("should throw NotFoundException for non-existent community", async () => {
            prisma.community.findUnique.mockResolvedValue(null);
            await expect(service.getUnverifiedPosts(999)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe("getPostsByCommunityId", () => {
        const makePosts = () => [
            {
                id: 1,
                title: "Verified Post",
                content: "c",
                createdAt: new Date(),
                author: { name: "u1", profilePicture: null },
                communityId: 1,
                isVerified: true,
                parentNodeId: "root",
                ratings: [],
                authorId: 10,
            },
            {
                id: 2,
                title: "My Unverified",
                content: "c",
                createdAt: new Date(),
                author: { name: "u2", profilePicture: null },
                communityId: 1,
                isVerified: false,
                parentNodeId: "root",
                ratings: [],
                authorId: 42,
            },
            {
                id: 3,
                title: "Other Unverified",
                content: "c",
                createdAt: new Date(),
                author: { name: "u3", profilePicture: null },
                communityId: 1,
                isVerified: false,
                parentNodeId: "root",
                ratings: [],
                authorId: 99,
            },
        ];

        it("should show all posts when autoPublishPosts is true", async () => {
            prisma.community.findUnique.mockResolvedValue({
                id: 1,
                autoPublishPosts: true,
                posts: makePosts(),
            });

            const result = await service.getPostsByCommunityId(1, 42);
            expect(result).toHaveLength(3);
        });

        it("should show only verified + own unverified posts for non-admin", async () => {
            prisma.community.findUnique.mockResolvedValue({
                id: 1,
                autoPublishPosts: false,
                posts: makePosts(),
            });
            communitiesService.isUserAdminOfCommunity.mockResolvedValue(false);

            const result = await service.getPostsByCommunityId(1, 42);

            expect(result).toHaveLength(2);
            const titles = result.map((p) => p.title);
            expect(titles).toContain("Verified Post");
            expect(titles).toContain("My Unverified");
            expect(titles).not.toContain("Other Unverified");
        });

        it("should show all posts for an admin even when autoPublish is off", async () => {
            prisma.community.findUnique.mockResolvedValue({
                id: 1,
                autoPublishPosts: false,
                posts: makePosts(),
            });
            communitiesService.isUserAdminOfCommunity.mockResolvedValue(true);

            const result = await service.getPostsByCommunityId(1, 42);
            expect(result).toHaveLength(3);
        });

        it("should show only verified posts for anonymous users", async () => {
            prisma.community.findUnique.mockResolvedValue({
                id: 1,
                autoPublishPosts: false,
                posts: makePosts(),
            });

            const result = await service.getPostsByCommunityId(1, undefined);

            expect(result).toHaveLength(1);
            expect(result[0].title).toBe("Verified Post");
        });
    });

    describe("checkPostTopicMatch", () => {
        it("should return match true with score 1 for empty content", async () => {
            const result = await service.checkPostTopicMatch(1, "");
            expect(result).toEqual({ matches: true, score: 1 });
        });

        it("should delegate to topicGuardService for non-empty content", async () => {
            topicGuardService.checkTopic.mockResolvedValue({
                match: true,
                score: 0.85,
            });

            const result = await service.checkPostTopicMatch(
                1,
                "<p>Machine learning</p>",
            );

            expect(result).toEqual({ matches: true, score: 0.85 });
            expect(topicGuardService.checkTopic).toHaveBeenCalledWith(
                1,
                "Machine learning",
            );
        });
    });
});
