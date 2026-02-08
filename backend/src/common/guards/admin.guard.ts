import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { ERROR_MESSAGES } from "src/common/constants/error-messages";
import { CommunitiesService } from "src/communities/communities.service";

/**
 * Guard that checks whether the authenticated user is an admin of the community
 * specified by the `:communityId` route parameter
 *
 * Must be used after AuthGuard (requires `req.user.sub`)
 */
@Injectable()
export class AdminGuard implements CanActivate {
    constructor(private readonly communitiesService: CommunitiesService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const user = request["user"] as { sub: number } | undefined;

        if (!user?.sub) throw new UnauthorizedException();

        const rawId = String(request.params.communityId || request.params.id);
        const communityId = parseInt(rawId);
        if (Number.isNaN(communityId))
            throw new UnauthorizedException(
                ERROR_MESSAGES.INVALID_COMMUNITY_ID,
            );

        const isAdmin = await this.communitiesService.isUserAdminOfCommunity(
            user.sub,
            communityId,
        );

        if (!isAdmin)
            throw new UnauthorizedException(
                ERROR_MESSAGES.UNAUTHORIZED_NOT_ADMIN,
            );

        return true;
    }
}
