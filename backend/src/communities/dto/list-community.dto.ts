export class ListCommunityDto {
    constructor(
        public id: number,
        public name: string,
        public description: string,
        public createdAt: Date,
        public followersCount: number,
        public autoPublishPosts: boolean,
        public averageRating: number,
        public bannerImage?: string | null,
        public iconImage?: string | null,
    ) {}
}
