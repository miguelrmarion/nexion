import { NotFoundException, UnauthorizedException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "src/common/services/prisma.service";
import { RatingCalculatorService } from "src/common/services/rating-calculator.service";
import { CommunitiesService } from "./communities.service";

type MockPrisma = {
    community: {
        create: jest.Mock;
        findMany: jest.Mock;
        findUnique: jest.Mock;
        findFirst: jest.Mock;
        update: jest.Mock;
    };
    user: {
        findUnique: jest.Mock;
        update: jest.Mock;
    };
};

describe("CommunitiesService", () => {
    let service: CommunitiesService;
    let prisma: MockPrisma;

    beforeEach(async () => {
        prisma = {
            community: {
                create: jest.fn(),
                findMany: jest.fn(),
                findUnique: jest.fn(),
                findFirst: jest.fn(),
                update: jest.fn(),
            },
            user: {
                findUnique: jest.fn(),
                update: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CommunitiesService,
                { provide: PrismaService, useValue: prisma },
                {
                    provide: RatingCalculatorService,
                    useValue: new RatingCalculatorService(),
                },
            ],
        }).compile();

        service = module.get<CommunitiesService>(CommunitiesService);
    });

    describe("create", () => {
        it("should create a community and return a DTO", async () => {
            prisma.community.findFirst.mockResolvedValue(null);
            prisma.community.create.mockResolvedValue({
                id: 1,
                name: "Test Community",
                description: "A test community",
                createdAt: new Date("2024-01-01"),
                ownerId: 1,
                autoPublishPosts: false,
                iconImage: null,
                bannerImage: null,
            });

            const result = await service.create(
                {
                    name: "Test Community",
                    description: "A test community",
                    autoPublishPosts: false,
                },
                1,
            );

            expect(result.id).toBe(1);
            expect(result.name).toBe("Test Community");
            expect(result.followersCount).toBe(0);
            expect(result.averageRating).toBe(0);
        });

        it("should throw UnauthorizedException if user already owns a community", async () => {
            prisma.community.findFirst.mockResolvedValue({ id: 99 });

            await expect(
                service.create(
                    {
                        name: "Second",
                        description: "desc",
                        autoPublishPosts: false,
                    },
                    1,
                ),
            ).rejects.toThrow(UnauthorizedException);
        });
    });

    describe("findAll", () => {
        it("should return all communities with follower counts and ratings", async () => {
            prisma.community.findMany.mockResolvedValue([
                {
                    id: 1,
                    name: "Community A",
                    description: "Desc A",
                    createdAt: new Date("2024-01-01"),
                    autoPublishPosts: true,
                    bannerImage: null,
                    iconImage: null,
                    _count: { followers: 5 },
                    posts: [
                        { ratings: [{ rating: 4 }, { rating: 5 }] },
                        { ratings: [{ rating: 3 }] },
                    ],
                },
            ]);

            const result = await service.findAll();

            expect(result).toHaveLength(1);
            expect(result[0].followersCount).toBe(5);
            expect(result[0].averageRating).toBe(4); // (4+5+3)/3 = 4
        });

        it("should return empty array when no communities exist", async () => {
            prisma.community.findMany.mockResolvedValue([]);
            const result = await service.findAll();
            expect(result).toEqual([]);
        });
    });

    describe("findOne", () => {
        it("should return a community DTO", async () => {
            prisma.community.findUnique.mockResolvedValue({
                id: 1,
                name: "My Community",
                description: "Desc",
                createdAt: new Date("2024-01-01"),
                autoPublishPosts: false,
                bannerImage: "banner.png",
                iconImage: "icon.png",
                _count: { followers: 10 },
                posts: [{ ratings: [{ rating: 5 }] }],
            });

            const result = await service.findOne(1);

            expect(result.id).toBe(1);
            expect(result.followersCount).toBe(10);
            expect(result.averageRating).toBe(5);
        });

        it("should throw NotFoundException when community does not exist", async () => {
            prisma.community.findUnique.mockResolvedValue(null);
            await expect(service.findOne(999)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe("followCommunity / unfollowCommunity", () => {
        it("should follow a community", async () => {
            prisma.community.findUnique.mockResolvedValue({ id: 1 });
            prisma.user.update.mockResolvedValue({});

            await service.followCommunity(1, 42);

            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 42 },
                data: {
                    followedCommunities: { connect: { id: 1 } },
                },
            });
        });

        it("should throw NotFoundException when following a non-existent community", async () => {
            prisma.community.findUnique.mockResolvedValue(null);
            await expect(service.followCommunity(999, 1)).rejects.toThrow(
                NotFoundException,
            );
        });

        it("should unfollow a community", async () => {
            prisma.community.findUnique.mockResolvedValue({ id: 1 });
            prisma.user.update.mockResolvedValue({});

            await service.unfollowCommunity(1, 42);

            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 42 },
                data: {
                    followedCommunities: { disconnect: { id: 1 } },
                },
            });
        });
    });

    describe("isUserAdminOfCommunity", () => {
        it("should return true for the community owner", async () => {
            prisma.community.findUnique.mockResolvedValue({
                id: 1,
                ownerId: 42,
                admins: [],
            });

            const result = await service.isUserAdminOfCommunity(42, 1);
            expect(result).toBe(true);
        });

        it("should return true for a community admin", async () => {
            prisma.community.findUnique.mockResolvedValue({
                id: 1,
                ownerId: 10,
                admins: [{ id: 42 }],
            });

            const result = await service.isUserAdminOfCommunity(42, 1);
            expect(result).toBe(true);
        });

        it("should return false for a regular user", async () => {
            prisma.community.findUnique.mockResolvedValue({
                id: 1,
                ownerId: 10,
                admins: [{ id: 20 }],
            });

            const result = await service.isUserAdminOfCommunity(42, 1);
            expect(result).toBe(false);
        });

        it("should throw NotFoundException for a non-existent community", async () => {
            prisma.community.findUnique.mockResolvedValue(null);
            await expect(
                service.isUserAdminOfCommunity(1, 999),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe("getAllAdmins", () => {
        it("should include the owner and all admins", async () => {
            prisma.community.findFirst.mockResolvedValue({
                owner: { id: 1, name: "owner" },
                admins: [
                    { id: 2, name: "admin1" },
                    { id: 3, name: "admin2" },
                ],
            });

            const result = await service.getAllAdmins(1);

            expect(result).toHaveLength(3);
            expect(result[0].id).toBe(1);
            expect(result[0].username).toBe("owner");
            expect(result[1].id).toBe(2);
        });

        it("should throw NotFoundException when community does not exist", async () => {
            prisma.community.findFirst.mockResolvedValue(null);
            await expect(service.getAllAdmins(999)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe("addAdmin", () => {
        it("should connect a user as admin by username", async () => {
            prisma.user.findUnique.mockResolvedValue({ id: 5 });
            prisma.community.update.mockResolvedValue({});

            await service.addAdmin(1, "newadmin");

            expect(prisma.community.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { admins: { connect: { id: 5 } } },
            });
        });

        it("should throw NotFoundException when user does not exist", async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            await expect(service.addAdmin(1, "ghost")).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe("removeAdmin", () => {
        it("should disconnect a user from admins", async () => {
            prisma.community.findUnique.mockResolvedValue({
                id: 1,
                admins: [{ id: 5 }],
            });
            prisma.community.update.mockResolvedValue({});

            await service.removeAdmin(1, 5);

            expect(prisma.community.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { admins: { disconnect: { id: 5 } } },
            });
        });
    });

    describe("update", () => {
        it("should only send defined fields to prisma", async () => {
            prisma.community.update.mockResolvedValue({});

            await service.update(1, { name: "New Name" });

            expect(prisma.community.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { name: "New Name" },
            });
        });

        it("should strip out undefined values", async () => {
            prisma.community.update.mockResolvedValue({});

            await service.update(1, {
                name: "Updated",
                description: undefined,
                autoPublishPosts: true,
            });

            const dataArg = prisma.community.update.mock.calls[0][0].data;
            expect(dataArg).toEqual({
                name: "Updated",
                autoPublishPosts: true,
            });
            expect(dataArg).not.toHaveProperty("description");
        });
    });
});
