import { Module } from "@nestjs/common";
import { AuthModule } from "src/auth/auth.module";
import { TopicGuardService } from "src/topic-match.service";
import { CommunitiesController } from "./communities.controller";
import { CommunitiesService } from "./communities.service";
import { CommunityPostsService } from "./community-posts.service";

@Module({
    imports: [AuthModule],
    controllers: [CommunitiesController],
    providers: [CommunitiesService, CommunityPostsService, TopicGuardService],
    exports: [CommunitiesService],
})
export class CommunitiesModule {}
