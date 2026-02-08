import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    InternalServerErrorException,
    Param,
    ParseFilePipeBuilder,
    Patch,
    Post,
    Req,
    UnauthorizedException,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { AuthGuard } from "src/auth/auth.guard";
import { OptionalAuthGuard } from "src/auth/optional-auth.guard";
import { ERROR_MESSAGES } from "src/common/constants/error-messages";
import { FILE_UPLOAD } from "src/common/constants/file-upload.constants";
import { CloudinaryService } from "src/common/services/cloudinary.service";
import {
    RequestWithOptionalUser,
    RequestWithUser,
} from "src/common/types/request.types";
import { CommunitiesService } from "./communities.service";
import { CommunityPostsService } from "./community-posts.service";
import { CreateCommunityDto } from "./dto/create-community.dto";
import { CreatePostDto } from "./dto/create-post.dto";
import { UpdateCommunityDto } from "./dto/update-community.dto";

@Controller("communities")
export class CommunitiesController {
    constructor(
        private readonly communitiesService: CommunitiesService,
        private readonly communityPostsService: CommunityPostsService,
        private readonly cloudinaryService: CloudinaryService,
    ) {}

    @UseGuards(AuthGuard)
    @Post()
    async create(
        @Body() createCommunityDto: CreateCommunityDto,
        @Req() req: RequestWithUser,
    ) {
        return await this.communitiesService.create(
            createCommunityDto,
            req.user.sub,
        );
    }

    @Get()
    async findAll() {
        return await this.communitiesService.findAll();
    }

    @Get("/community/:id")
    async findOne(@Param("id") id: string) {
        return await this.communitiesService.findOne(+id);
    }

    @UseGuards(AuthGuard)
    @Patch("/community/:communityId")
    @UseInterceptors(FileInterceptor("bannerImage"))
    async update(
        @Param("communityId") communityId: string,
        @Body() updateCommunityDto: UpdateCommunityDto,
        @UploadedFile() bannerImage?: Express.Multer.File,
        @Req() req?: RequestWithUser,
    ) {
        const parsedCommunityId = parseInt(communityId);
        if (Number.isNaN(parsedCommunityId))
            throw new BadRequestException(ERROR_MESSAGES.INVALID_COMMUNITY_ID);
        if (
            !this.communitiesService.isUserAdminOfCommunity(
                req!.user.sub,
                parsedCommunityId,
            )
        )
            throw new UnauthorizedException();

        let bannerImageUrl: string | undefined;
        if (bannerImage) {
            if (
                !(
                    FILE_UPLOAD.ALLOWED_IMAGE_MIME_TYPES as readonly string[]
                ).includes(bannerImage.mimetype)
            )
                throw new BadRequestException(ERROR_MESSAGES.INVALID_FILE_TYPE);

            bannerImageUrl =
                await this.cloudinaryService.uploadImage(bannerImage);
        }

        return this.communitiesService.update(parsedCommunityId, {
            ...updateCommunityDto,
            bannerImage: bannerImageUrl,
        });
    }

    @UseGuards(AuthGuard)
    @Patch("/community/:communityId/icon")
    @UseInterceptors(FileInterceptor("iconImage"))
    async updateIcon(
        @Param("communityId") communityId: string,
        @UploadedFile() iconImage: Express.Multer.File,
        @Req() req: RequestWithUser,
    ) {
        const parsedCommunityId = parseInt(communityId);
        if (Number.isNaN(parsedCommunityId))
            throw new BadRequestException(ERROR_MESSAGES.INVALID_COMMUNITY_ID);
        if (
            !this.communitiesService.isUserAdminOfCommunity(
                req.user.sub,
                parsedCommunityId,
            )
        )
            throw new UnauthorizedException();

        if (
            !(
                FILE_UPLOAD.ALLOWED_IMAGE_MIME_TYPES as readonly string[]
            ).includes(iconImage.mimetype)
        )
            throw new BadRequestException(ERROR_MESSAGES.INVALID_FILE_TYPE);

        const iconImageUrl =
            await this.cloudinaryService.uploadImage(iconImage);

        return this.communitiesService.update(parsedCommunityId, {
            iconImage: iconImageUrl,
        });
    }

    @UseGuards(AuthGuard)
    @Get("followed")
    async getFollowedCommunities(@Req() req: RequestWithUser) {
        return await this.communitiesService.getFollowedCommunities(
            req.user.sub,
        );
    }

    @UseGuards(AuthGuard)
    @Post(":communityId/follow")
    async followCommunity(
        @Param("communityId") id: string,
        @Req() req: RequestWithUser,
    ) {
        const userId = req.user.sub;
        const parsedCommunityId = parseInt(id);
        if (Number.isNaN(parsedCommunityId))
            throw new BadRequestException(ERROR_MESSAGES.INVALID_COMMUNITY_ID);

        await this.communitiesService.followCommunity(
            parsedCommunityId,
            userId,
        );
    }

    @UseGuards(AuthGuard)
    @Delete(":communityId/unfollow")
    async unfollowCommunity(
        @Param("communityId") id: string,
        @Req() req: RequestWithUser,
    ) {
        const userId = req.user.sub;
        const parsedCommunityId = parseInt(id);
        if (Number.isNaN(parsedCommunityId))
            throw new BadRequestException(ERROR_MESSAGES.INVALID_COMMUNITY_ID);

        await this.communitiesService.unfollowCommunity(
            parsedCommunityId,
            userId,
        );
    }

    @UseGuards(AuthGuard)
    @Get("/user")
    async getUserCommunityId(@Req() req: RequestWithUser) {
        const userId = req.user.sub;
        return await this.communitiesService.getUserCommunityId(userId);
    }

    @UseGuards(AuthGuard)
    @Get(":communityId/is-admin")
    async isUserAdminOfCommunity(
        @Param("communityId") communityId: string,
        @Req() req: RequestWithUser,
    ) {
        const userId = req.user.sub;
        const parsedCommunityId = parseInt(communityId);
        if (Number.isNaN(parsedCommunityId))
            throw new BadRequestException(ERROR_MESSAGES.INVALID_COMMUNITY_ID);
        return await this.communitiesService.isUserAdminOfCommunity(
            userId,
            parseInt(communityId),
        );
    }

    @Get("/:communityId/admins")
    async getAllAdmins(@Param("communityId") communityId: string) {
        const parsedCommunityId = parseInt(communityId);
        if (Number.isNaN(parsedCommunityId))
            throw new BadRequestException(ERROR_MESSAGES.INVALID_COMMUNITY_ID);

        return await this.communitiesService.getAllAdmins(parsedCommunityId);
    }

    @UseGuards(AuthGuard)
    @Post("/:communityId/post")
    async createPost(
        @Param("communityId") communityId: string,
        @Body() createPostDto: CreatePostDto,
        @Req() req: RequestWithUser,
    ) {
        const parsedCommunityId = parseInt(communityId);
        if (Number.isNaN(parsedCommunityId))
            throw new BadRequestException(ERROR_MESSAGES.INVALID_COMMUNITY_ID);

        const authorId = req.user.sub;
        return await this.communityPostsService.createPost(
            createPostDto,
            parsedCommunityId,
            authorId,
        );
    }

    @UseGuards(AuthGuard)
    @Post(":communityId/verify-post/:postId")
    async verifyPost(
        @Param("communityId") communityId: string,
        @Param("postId") postId: string,
        @Req() req: RequestWithUser,
    ) {
        const userId = req.user.sub;
        const parsedCommunityId = parseInt(communityId);
        const parsedPostId = parseInt(postId);
        if (Number.isNaN(parsedPostId))
            throw new BadRequestException(ERROR_MESSAGES.INVALID_POST_ID);
        if (Number.isNaN(parsedCommunityId))
            throw new BadRequestException(ERROR_MESSAGES.INVALID_COMMUNITY_ID);
        if (
            !(await this.communitiesService.isUserAdminOfCommunity(
                userId,
                parsedCommunityId,
            ))
        )
            throw new UnauthorizedException();

        return await this.communityPostsService.verifyPost(parsedPostId);
    }

    @UseGuards(AuthGuard)
    @Post(":communityId/discard-post/:postId")
    async discardPost(
        @Param("communityId") communityId: string,
        @Param("postId") postId: string,
        @Req() req: RequestWithUser,
    ) {
        const userId = req.user.sub;
        const parsedPostId = parseInt(postId);
        const parsedCommunityId = parseInt(communityId);
        if (Number.isNaN(parsedPostId))
            throw new BadRequestException(ERROR_MESSAGES.INVALID_POST_ID);
        if (Number.isNaN(parsedCommunityId))
            throw new BadRequestException(ERROR_MESSAGES.INVALID_COMMUNITY_ID);
        if (
            !(await this.communitiesService.isUserAdminOfCommunity(
                userId,
                parsedCommunityId,
            ))
        )
            throw new UnauthorizedException();

        return await this.communityPostsService.discardPost(parsedPostId);
    }

    @Get(":communityId/unverified-posts")
    async getUnverifiedPosts(@Param("communityId") communityId: string) {
        const parsedCommunityId = parseInt(communityId);
        if (Number.isNaN(parsedCommunityId))
            throw new BadRequestException(ERROR_MESSAGES.INVALID_COMMUNITY_ID);

        return await this.communityPostsService.getUnverifiedPosts(
            parsedCommunityId,
        );
    }

    @UseGuards(OptionalAuthGuard)
    @Get(":communityId/posts")
    async getPostsByCommunity(
        @Param("communityId") communityId: string,
        @Req() req: RequestWithOptionalUser,
    ) {
        const userId = req.user?.sub;

        const parsedCommunityId = parseInt(communityId);
        if (Number.isNaN(parsedCommunityId))
            throw new BadRequestException(ERROR_MESSAGES.INVALID_COMMUNITY_ID);
        return await this.communityPostsService.getPostsByCommunityId(
            parsedCommunityId,
            userId,
        );
    }

    @UseGuards(AuthGuard)
    @Post("/:communityId/admins/:username")
    async addAdmin(
        @Param("communityId") communityId: string,
        @Param("username") username: string,
        @Req() req: RequestWithUser,
    ) {
        const requestingUserId = req.user.sub;
        const parsedCommunityId = parseInt(communityId);
        if (Number.isNaN(parsedCommunityId))
            throw new BadRequestException(ERROR_MESSAGES.INVALID_COMMUNITY_ID);
        if (
            !(await this.communitiesService.isUserAdminOfCommunity(
                requestingUserId,
                parsedCommunityId,
            ))
        )
            throw new UnauthorizedException();

        return await this.communitiesService.addAdmin(
            parsedCommunityId,
            username,
        );
    }

    @UseGuards(AuthGuard)
    @Delete("/:communityId/admins/:userId")
    async removeAdmin(
        @Param("communityId") communityId: string,
        @Param("userId") userId: string,
        @Req() req: RequestWithUser,
    ) {
        const requestingUserId = req.user.sub;
        const parsedCommunityId = parseInt(communityId);
        const parsedUserId = parseInt(userId);
        if (Number.isNaN(parsedUserId))
            throw new BadRequestException(ERROR_MESSAGES.INVALID_USER_ID);
        if (Number.isNaN(parsedCommunityId))
            throw new BadRequestException(ERROR_MESSAGES.INVALID_COMMUNITY_ID);
        if (
            !(await this.communitiesService.isUserAdminOfCommunity(
                requestingUserId,
                parsedCommunityId,
            ))
        )
            throw new UnauthorizedException();

        return await this.communitiesService.removeAdmin(
            parsedCommunityId,
            parsedUserId,
        );
    }

    @UseGuards(AuthGuard)
    @Post("upload")
    @UseInterceptors(FileInterceptor("image"))
    async uploadFile(
        @UploadedFile(
            new ParseFilePipeBuilder()
                .addFileTypeValidator({
                    fileType: /\b(jpeg|png)\b/i,
                })
                .addMaxSizeValidator({
                    maxSize: FILE_UPLOAD.MAX_SIZE,
                })
                .build({
                    exceptionFactory(error) {
                        throw new BadRequestException(error);
                    },
                }),
        )
        image: Express.Multer.File,
    ) {
        const response = await this.cloudinaryService.upload(image);
        if (response === undefined)
            throw new InternalServerErrorException(
                ERROR_MESSAGES.UPLOAD_FAILED,
            );
        return { url: response.secure_url };
    }

    @Post(":communityId/check-post-topic-match")
    async checkPostTopicMatch(
        @Param("communityId") communityId: string,
        @Body() body: { content: string },
    ) {
        const parsedCommunityId = parseInt(communityId);

        if (Number.isNaN(parsedCommunityId))
            throw new BadRequestException(ERROR_MESSAGES.INVALID_COMMUNITY_ID);

        const result = await this.communityPostsService.checkPostTopicMatch(
            parsedCommunityId,
            body.content,
        );

        return result;
    }
}
