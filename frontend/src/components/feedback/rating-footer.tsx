import StarRating from "../ui/star-rating";

interface RatingFooterProps {
    averageRating: number;
    isAuthenticated: boolean;
    myRating: number;
    isRating: boolean;
    onRatingChange?: (rating: number) => void;
    children?: React.ReactNode;
}

export default function RatingFooter({
    averageRating,
    isAuthenticated,
    myRating,
    isRating,
    onRatingChange,
    children,
}: RatingFooterProps) {
    return (
        <div className="flex flex-col gap-3 p-4 border-t border-border flex-shrink-0">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted">Average rating:</span>
                    <span className="text-sm font-medium text-slate-800">
                        {averageRating > 0
                            ? averageRating.toFixed(1)
                            : "No ratings"}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <span
                        className={`text-sm ${
                            isAuthenticated ? "text-muted" : "text-slate-400"
                        }`}
                    >
                        Your rating:
                    </span>
                    <StarRating
                        rating={myRating}
                        onRatingChange={onRatingChange}
                        readonly={!isAuthenticated}
                    />
                    {isRating && (
                        <span className="text-xs text-primary">Saving...</span>
                    )}
                    {!isAuthenticated && (
                        <span className="text-xs text-slate-400">
                            Log in to rate
                        </span>
                    )}
                </div>
            </div>
            {children}
        </div>
    );
}
