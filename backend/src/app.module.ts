import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { CommonModule } from "./common/common.module";
import { CommunitiesModule } from "./communities/communities.module";
import { PostsModule } from "./posts/posts.module";
import { UsersModule } from "./users/users.module";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ".env",
        }),
        CommonModule,
        AuthModule,
        CommunitiesModule,
        PostsModule,
        UsersModule,
    ],
})
export class AppModule {}
