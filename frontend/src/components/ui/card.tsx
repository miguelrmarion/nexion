import { HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    interactive?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ interactive = false, className = "", children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={`
                    bg-surface border border-border rounded-xl
                    shadow-sm hover:shadow-md hover:border-border-hover
                    ${interactive ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0" : ""}
                    ${className}
                `.trim()}
                {...props}
            >
                {children}
            </div>
        );
    },
);

Card.displayName = "Card";
export default Card;
