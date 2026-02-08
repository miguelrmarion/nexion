import { Injectable } from "@nestjs/common";

export interface RatableEntity {
    ratings: { rating: number }[];
}

@Injectable()
export class RatingCalculatorService {
    calculateAverage(ratings: number[]): number {
        if (ratings.length === 0) return 0;

        const sum = ratings.reduce((acc, rating) => acc + rating, 0);
        return parseFloat((sum / ratings.length).toFixed(2));
    }

    calculateEntityAverage(entity: RatableEntity): number {
        const ratings = entity.ratings.map((r) => r.rating);
        return this.calculateAverage(ratings);
    }

    calculatePostsAverage(posts: RatableEntity[]): number {
        const allRatings = posts.flatMap((post) =>
            post.ratings.map((r) => r.rating),
        );
        return this.calculateAverage(allRatings);
    }
}
