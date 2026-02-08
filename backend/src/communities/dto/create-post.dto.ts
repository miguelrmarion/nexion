import { IsString, MinLength } from "class-validator";

export class CreatePostDto {
    @MinLength(1)
    @IsString()
    title: string;

    @MinLength(1)
    @IsString()
    content: string;

    @IsString()
    parentNodeId: string;
}
