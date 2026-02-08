import {
    Injectable,
    Logger,
    OnModuleDestroy,
    OnModuleInit,
} from "@nestjs/common";
import { join } from "path";
import { python } from "pythonia";

export interface TopicCheckResult {
    match: boolean;
    score: number;
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

@Injectable()
export class TopicGuardService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(TopicGuardService.name);
    private guard: any;

    async onModuleInit(): Promise<void> {
        try {
            const modulePath = join(
                process.cwd(),
                "src",
                "topic-matching",
                "topic_guard.py",
            );
            this.guard = await python(modulePath);

            const dbPath = join(
                process.cwd(),
                "src",
                "topic-matching",
                "topic_guard.db",
            );
            await this.guard.init(dbPath);

            this.logger.log("TopicGuard initialised");
        } catch (error) {
            this.logger.error("Failed to initialise TopicGuard", error);
        }
    }

    async onModuleDestroy(): Promise<void> {
        try {
            if (this.guard) await this.guard.shutdown();

            python.exit();
        } catch (error) {
            this.logger.error("Error shutting down TopicGuard", error);
        }
    }

    /**
     * Build the centroid for a community from its verified post texts.
     * Should be called whenever a post is verified
     */
    async updateCommunity(
        communityId: number,
        texts: string[],
    ): Promise<boolean> {
        try {
            const ok = await this.guard.update_community(communityId, texts);
            return Boolean(await ok?.valueOf());
        } catch (error) {
            this.logger.error(
                `Failed to update community ${communityId} centroid`,
                error,
            );
            return false;
        }
    }

    async checkTopic(
        communityId: number,
        text: string,
    ): Promise<TopicCheckResult> {
        try {
            const raw = await this.guard.check_topic(communityId, text);
            const jsonStr: string = String(await raw?.valueOf());
            return JSON.parse(jsonStr) as TopicCheckResult;
        } catch (error) {
            this.logger.error(
                `Failed to check topic for community ${communityId}`,
                error,
            );
            return { match: true, score: 0.5 };
        }
    }
}
