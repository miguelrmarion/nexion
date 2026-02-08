import {
    ConflictException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { ERROR_MESSAGES } from "src/common/constants/error-messages";
import { PrismaService } from "src/common/services/prisma.service";

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) {}

    async register(username: string, email: string, password: string) {
        try {
            const user = await this.prisma.user.create({
                data: {
                    name: username,
                    email,
                    passwordHash: await argon2.hash(password),
                },
            });

            return await this.jwtService.signAsync({
                sub: user.id,
                email: user.email,
            });
        } catch (error) {
            // Handle Prisma unique constraint errors
            if (error.code === "P2002") {
                const field = error.meta?.target?.[0];
                switch (field) {
                    case "email":
                        throw new ConflictException(
                            ERROR_MESSAGES.AUTH_EMAIL_IN_USE,
                        );
                    case "name":
                        throw new ConflictException(
                            ERROR_MESSAGES.AUTH_USERNAME_IN_USE,
                        );
                    default:
                        throw new ConflictException(
                            `Field ${field || "unknown"} is already in use`,
                        );
                }
            }
            throw error;
        }
    }

    async login(username: string, password: string) {
        const user = await this.prisma.user.findUnique({
            where: { name: username },
        });
        if (!user || !(await argon2.verify(user.passwordHash, password)))
            throw new NotFoundException();

        return await this.jwtService.signAsync({
            sub: user.id,
            email: user.email,
        });
    }

    async refreshToken(token: string) {
        const payload = await this.jwtService.verifyAsync(token);
        if (!payload) throw new UnauthorizedException();

        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
        });
        if (!user) throw new UnauthorizedException();

        return await this.jwtService.signAsync({
            sub: user.id,
            email: user.email,
        });
    }
}
