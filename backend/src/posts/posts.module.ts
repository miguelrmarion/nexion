import { Module } from "@nestjs/common";
import { AuthModule } from "src/auth/auth.module";
import { CommunitiesModule } from "src/communities/communities.module";
import { PostsController } from "./posts.controller";
import { PostsService } from "./posts.service";

@Module({
    imports: [CommunitiesModule, AuthModule],
    controllers: [PostsController],
    providers: [PostsService],
})
export class PostsModule {}
