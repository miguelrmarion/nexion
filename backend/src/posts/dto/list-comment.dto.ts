export class ListCommentDto {
    constructor(
        public id: number,
        public content: string,
        public createdAt: Date,
        public authorUsername: string,
        public authorProfilePicture: string | null,
        public postId: number,
        public canDelete: boolean,
    ) {}
}
