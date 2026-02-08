import { IsBoolean, IsOptional, IsString, MinLength } from "class-validator";

export class CreateCommunityDto {
    @IsString()
    @MinLength(3)
    name: string;

    @IsString()
    description: string;

    @IsBoolean()
    autoPublishPosts: boolean;

    @IsOptional()
    @IsString()
    iconImage?: string;

    @IsOptional()
    @IsString()
    bannerImage?: string;
}
