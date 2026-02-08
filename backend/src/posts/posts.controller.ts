import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Req,
    UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "src/auth/auth.guard";
import { OptionalAuthGuard } from "src/auth/optional-auth.guard";
import { ERROR_MESSAGES } from "src/common/constants/error-messages";
import {
    RequestWithOptionalUser,
    RequestWithUser,
} from "src/common/types/request.types";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { RatePostDto } from "./dto/rate-post.dto";
import { PostsService } from "./posts.service";

@Controller("posts")
export class PostsController {
    constructor(private readonly postsService: PostsService) {}

    @Get()
    async findAll() {
        return await this.postsService.findAll();
    }

    @UseGuards(AuthGuard)
    @Delete("/:id")
    async remove(@Param("id") id: string, @Req() req: RequestWithUser) {
        const parsedPostId = parseInt(id);
        if (Number.isNaN(parsedPostId))
            throw new BadRequestException(ERROR_MESSAGES.INVALID_POST_ID);

        return await this.postsService.remove(parsedPostId, req.user.sub);
    }

    @UseGuards(AuthGuard)
    @Post("/:postId/rate")
    async ratePost(
        @Param("postId") postId: string,
        @Body() ratePostDto: RatePostDto,
        @Req() req: RequestWithUser,
    ) {
        const userId = req.user.sub;
        const parsedPostId = parseInt(postId);
        if (Number.isNaN(parsedPostId))
            throw new BadRequestException(ERROR_MESSAGES.INVALID_POST_ID);

        return await this.postsService.ratePost(
            parsedPostId,
            userId,
            ratePostDto.rating,
        );
    }

    @UseGuards(AuthGuard)
    @Get("/:postId/my-rating")
    async getMyPostRating(
        @Param("postId") postId: string,
        @Req() req: RequestWithUser,
    ) {
        const userId = req.user.sub;
        const parsedPostId = parseInt(postId);
        if (Number.isNaN(parsedPostId))
            throw new BadRequestException(ERROR_MESSAGES.INVALID_POST_ID);

        return await this.postsService.getUserPostRating(parsedPostId, userId);
    }

    @UseGuards(AuthGuard)
    @Post("/:postId/comments")
    async createComment(
        @Param("postId") postId: string,
        @Body() createCommentDto: CreateCommentDto,
        @Req() req: RequestWithUser,
    ) {
        const userId = req.user.sub;
        const parsedPostId = parseInt(postId);
        if (Number.isNaN(parsedPostId))
            throw new BadRequestException(ERROR_MESSAGES.INVALID_POST_ID);

        return await this.postsService.createComment(
            parsedPostId,
            userId,
            createCommentDto.content,
        );
    }

    @UseGuards(OptionalAuthGuard)
    @Get("/:postId/comments")
    async getPostComments(
        @Param("postId") postId: string,
        @Req() req: RequestWithOptionalUser,
    ) {
        const parsedPostId = parseInt(postId);
        if (Number.isNaN(parsedPostId))
            throw new BadRequestException(ERROR_MESSAGES.INVALID_POST_ID);

        const userId = req.user?.sub || null;
        return await this.postsService.getPostComments(parsedPostId, userId);
    }

    @UseGuards(AuthGuard)
    @Delete("/comments/:commentId")
    async deleteComment(
        @Param("commentId") commentId: string,
        @Req() req: RequestWithUser,
    ) {
        const parsedCommentId = parseInt(commentId);
        if (Number.isNaN(parsedCommentId))
            throw new BadRequestException(ERROR_MESSAGES.INVALID_COMMENT_ID);

        return await this.postsService.deleteComment(
            parsedCommentId,
            req.user.sub,
        );
    }
}
