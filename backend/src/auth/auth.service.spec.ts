import {
    ConflictException,
    NotFoundException,
    UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import * as argon2 from "argon2";
import { ERROR_MESSAGES } from "src/common/constants/error-messages";
import { PrismaService } from "src/common/services/prisma.service";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
    let service: AuthService;
    let prisma: { user: { create: jest.Mock; findUnique: jest.Mock } };
    let jwtService: { signAsync: jest.Mock; verifyAsync: jest.Mock };

    beforeEach(async () => {
        prisma = {
            user: {
                create: jest.fn(),
                findUnique: jest.fn(),
            },
        };
        jwtService = {
            signAsync: jest.fn().mockResolvedValue("signed-token"),
            verifyAsync: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: PrismaService, useValue: prisma },
                { provide: JwtService, useValue: jwtService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    describe("register", () => {
        it("should create a user and return a signed JWT", async () => {
            prisma.user.create.mockResolvedValue({
                id: 1,
                email: "test@example.com",
                name: "testuser",
            });

            const token = await service.register(
                "testuser",
                "test@example.com",
                "password123",
            );

            expect(token).toBe("signed-token");
            expect(prisma.user.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    name: "testuser",
                    email: "test@example.com",
                }),
            });
            // Verify the password was hashed (not stored as plaintext)
            const createCall = prisma.user.create.mock.calls[0][0];
            expect(createCall.data.passwordHash).not.toBe("password123");
            expect(jwtService.signAsync).toHaveBeenCalledWith({
                sub: 1,
                email: "test@example.com",
            });
        });

        it("should throw ConflictException when email is already in use", async () => {
            prisma.user.create.mockRejectedValue({
                code: "P2002",
                meta: { target: ["email"] },
            });

            await expect(
                service.register(
                    "testuser",
                    "taken@example.com",
                    "password123",
                ),
            ).rejects.toThrow(ConflictException);

            await expect(
                service.register(
                    "testuser",
                    "taken@example.com",
                    "password123",
                ),
            ).rejects.toThrow(ERROR_MESSAGES.AUTH_EMAIL_IN_USE);
        });

        it("should throw ConflictException when username is already in use", async () => {
            prisma.user.create.mockRejectedValue({
                code: "P2002",
                meta: { target: ["name"] },
            });

            await expect(
                service.register("taken", "new@example.com", "password123"),
            ).rejects.toThrow(ConflictException);

            await expect(
                service.register("taken", "new@example.com", "password123"),
            ).rejects.toThrow(ERROR_MESSAGES.AUTH_USERNAME_IN_USE);
        });

        it("should rethrow non-P2002 errors", async () => {
            const dbError = new Error("Connection failed");
            prisma.user.create.mockRejectedValue(dbError);

            await expect(
                service.register("user", "user@example.com", "password123"),
            ).rejects.toThrow("Connection failed");
        });
    });

    describe("login", () => {
        it("should return a signed JWT for valid credentials", async () => {
            const hashedPassword = await argon2.hash("correctpassword");
            prisma.user.findUnique.mockResolvedValue({
                id: 1,
                name: "testuser",
                email: "test@example.com",
                passwordHash: hashedPassword,
            });

            const token = await service.login("testuser", "correctpassword");

            expect(token).toBe("signed-token");
            expect(jwtService.signAsync).toHaveBeenCalledWith({
                sub: 1,
                email: "test@example.com",
            });
        });

        it("should throw NotFoundException when user does not exist", async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            await expect(
                service.login("nonexistent", "password"),
            ).rejects.toThrow(NotFoundException);
        });

        it("should throw NotFoundException when password is incorrect", async () => {
            const hashedPassword = await argon2.hash("correctpassword");
            prisma.user.findUnique.mockResolvedValue({
                id: 1,
                name: "testuser",
                email: "test@example.com",
                passwordHash: hashedPassword,
            });

            await expect(
                service.login("testuser", "wrongpassword"),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe("refreshToken", () => {
        it("should return a new signed JWT for a valid token", async () => {
            jwtService.verifyAsync.mockResolvedValue({ sub: 1 });
            prisma.user.findUnique.mockResolvedValue({
                id: 1,
                email: "test@example.com",
            });

            const token = await service.refreshToken("valid-token");

            expect(token).toBe("signed-token");
            expect(jwtService.verifyAsync).toHaveBeenCalledWith("valid-token");
            expect(jwtService.signAsync).toHaveBeenCalledWith({
                sub: 1,
                email: "test@example.com",
            });
        });

        it("should throw UnauthorizedException when token is invalid", async () => {
            jwtService.verifyAsync.mockResolvedValue(null);

            await expect(service.refreshToken("bad-token")).rejects.toThrow(
                UnauthorizedException,
            );
        });

        it("should throw UnauthorizedException when user no longer exists", async () => {
            jwtService.verifyAsync.mockResolvedValue({ sub: 999 });
            prisma.user.findUnique.mockResolvedValue(null);

            await expect(
                service.refreshToken("orphaned-token"),
            ).rejects.toThrow(UnauthorizedException);
        });
    });
});
