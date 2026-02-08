import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Put,
    Req,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { AuthGuard } from "src/auth/auth.guard";
import { ERROR_MESSAGES } from "src/common/constants/error-messages";
import { FILE_UPLOAD } from "src/common/constants/file-upload.constants";
import { CloudinaryService } from "src/common/services/cloudinary.service";
import { RequestWithUser } from "src/common/types/request.types";
import { UpdateUserDto } from "./users.dto";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
    constructor(
        private usersService: UsersService,
        private cloudinaryService: CloudinaryService,
    ) {}

    @UseGuards(AuthGuard)
    @Get("me")
    async getCurrentUser(@Req() req: RequestWithUser) {
        return await this.usersService.findById(req.user.sub);
    }

    @UseGuards(AuthGuard)
    @Put("me")
    @UseInterceptors(FileInterceptor("profilePicture"))
    async updateCurrentUser(
        @Req() req: RequestWithUser,
        @Body() updateUserDto: UpdateUserDto,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        let profilePictureUrl: string | undefined;

        if (file) {
            if (
                !(
                    FILE_UPLOAD.ALLOWED_IMAGE_MIME_TYPES as readonly string[]
                ).includes(file.mimetype)
            )
                throw new BadRequestException(ERROR_MESSAGES.INVALID_FILE_TYPE);

            profilePictureUrl = await this.cloudinaryService.uploadImage(file);
        }

        return await this.usersService.updateUser(req.user.sub, {
            ...updateUserDto,
            profilePicture: profilePictureUrl,
        });
    }
}
