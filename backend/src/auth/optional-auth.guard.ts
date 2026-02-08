import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";

@Injectable()
export class OptionalAuthGuard implements CanActivate {
    constructor(private jwtService: JwtService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);

        // Update user field checking if the token exists and is valid
        if (!token) {
            request["user"] = null;
            return true;
        }

        try {
            const payload = await this.jwtService.verifyAsync(token);
            request["user"] = payload;
        } catch {
            request["user"] = null;
        }

        return true;
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        return request.cookies["auth_token"];
    }
}
