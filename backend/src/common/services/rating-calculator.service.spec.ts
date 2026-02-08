import { RatingCalculatorService } from "./rating-calculator.service";

describe("RatingCalculatorService", () => {
    let service: RatingCalculatorService;

    beforeEach(() => {
        service = new RatingCalculatorService();
    });

    describe("calculateAverage", () => {
        it("should return 0 for an empty array", () => {
            expect(service.calculateAverage([])).toBe(0);
        });

        it("should return the single value for a one-element array", () => {
            expect(service.calculateAverage([4])).toBe(4);
        });

        it("should calculate the average of multiple values", () => {
            expect(service.calculateAverage([1, 2, 3, 4, 5])).toBe(3);
        });

        it("should round to 2 decimal places", () => {
            expect(service.calculateAverage([1, 2])).toBe(1.5);
            expect(service.calculateAverage([1, 1, 2])).toBe(1.33);
        });

        it("should handle identical values", () => {
            expect(service.calculateAverage([5, 5, 5])).toBe(5);
        });
    });

    describe("calculateEntityAverage", () => {
        it("should return 0 for an entity with no ratings", () => {
            expect(service.calculateEntityAverage({ ratings: [] })).toBe(0);
        });

        it("should calculate the average from nested rating objects", () => {
            const entity = {
                ratings: [{ rating: 3 }, { rating: 5 }, { rating: 4 }],
            };
            expect(service.calculateEntityAverage(entity)).toBe(4);
        });
    });

    describe("calculatePostsAverage", () => {
        it("should return 0 when no posts have ratings", () => {
            expect(
                service.calculatePostsAverage([
                    { ratings: [] },
                    { ratings: [] },
                ]),
            ).toBe(0);
        });

        it("should return 0 for an empty posts array", () => {
            expect(service.calculatePostsAverage([])).toBe(0);
        });

        it("should calculate the average across all posts", () => {
            const posts = [
                { ratings: [{ rating: 2 }, { rating: 4 }] },
                { ratings: [{ rating: 3 }, { rating: 5 }] },
            ];

            // (2+4+3+5) / 4 = 3.5
            expect(service.calculatePostsAverage(posts)).toBe(3.5);
        });

        it("should handle posts with different numbers of ratings", () => {
            const posts = [
                { ratings: [{ rating: 5 }] },
                { ratings: [{ rating: 1 }, { rating: 2 }, { rating: 3 }] },
            ];

            // (5+1+2+3) / 4 = 2.75
            expect(service.calculatePostsAverage(posts)).toBe(2.75);
        });
    });
});
