export class ListPostsDto {
    constructor(
        public id: number,
        public title: string,
        public content: string,
        public createdAt: Date,
        public authorUsername: string,
        public authorProfilePicture: string | null,
        public communityId: number,
        public isVerified: boolean,
        public parentNodeId: string,
        public averageRating: number,
    ) {}
}
