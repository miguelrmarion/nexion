import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/services/prisma.service";

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) {}

    async findById(id: number) {
        return await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                profilePicture: true,
            },
        });
    }

    async updateUser(
        id: number,
        data: { name?: string; profilePicture?: string },
    ) {
        const updateData = Object.fromEntries(
            Object.entries(data).filter(([, value]) => value !== undefined),
        );

        return await this.prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                profilePicture: true,
            },
        });
    }
}
