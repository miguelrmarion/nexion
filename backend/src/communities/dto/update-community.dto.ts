export class UpdateCommunityDto {
    constructor(
        public name?: string,
        public description?: string,
        public autoPublishPosts?: boolean,
        public bannerImage?: string,
        public iconImage?: string,
    ) {}
}
