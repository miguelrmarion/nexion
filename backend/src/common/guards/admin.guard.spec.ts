import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { CommunitiesService } from "src/communities/communities.service";
import { AdminGuard } from "./admin.guard";

describe("AdminGuard", () => {
    let guard: AdminGuard;
    let communitiesService: { isUserAdminOfCommunity: jest.Mock };

    beforeEach(async () => {
        communitiesService = {
            isUserAdminOfCommunity: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AdminGuard,
                { provide: CommunitiesService, useValue: communitiesService },
            ],
        }).compile();

        guard = module.get<AdminGuard>(AdminGuard);
    });

    function createContext(
        user: { sub: number } | undefined,
        params: Record<string, string>,
    ): ExecutionContext {
        return {
            switchToHttp: () => ({
                getRequest: () => ({
                    user,
                    params,
                }),
            }),
        } as unknown as ExecutionContext;
    }

    it("should allow access when user is an admin", async () => {
        communitiesService.isUserAdminOfCommunity.mockResolvedValue(true);
        const ctx = createContext({ sub: 42 }, { communityId: "1" });

        const result = await guard.canActivate(ctx);

        expect(result).toBe(true);
        expect(communitiesService.isUserAdminOfCommunity).toHaveBeenCalledWith(
            42,
            1,
        );
    });

    it("should throw UnauthorizedException when user is not an admin", async () => {
        communitiesService.isUserAdminOfCommunity.mockResolvedValue(false);
        const ctx = createContext({ sub: 42 }, { communityId: "1" });

        await expect(guard.canActivate(ctx)).rejects.toThrow(
            UnauthorizedException,
        );
    });

    it("should throw UnauthorizedException when no user is present", async () => {
        const ctx = createContext(undefined, { communityId: "1" });

        await expect(guard.canActivate(ctx)).rejects.toThrow(
            UnauthorizedException,
        );
    });

    it("should throw UnauthorizedException for invalid community ID", async () => {
        const ctx = createContext({ sub: 42 }, { communityId: "abc" });

        await expect(guard.canActivate(ctx)).rejects.toThrow(
            UnauthorizedException,
        );
    });

    it("should fall back to :id param when :communityId is not present", async () => {
        communitiesService.isUserAdminOfCommunity.mockResolvedValue(true);
        const ctx = createContext({ sub: 42 }, { id: "5" });

        const result = await guard.canActivate(ctx);

        expect(result).toBe(true);
        expect(communitiesService.isUserAdminOfCommunity).toHaveBeenCalledWith(
            42,
            5,
        );
    });
});
