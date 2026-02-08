import { forwardRef, InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = "", ...props }, ref) => {
        return (
            <input
                ref={ref}
                className={`
                    w-full px-3.5 py-2.5
                    border border-border rounded-lg
                    bg-surface text-foreground text-sm
                    placeholder:text-[#94a3b8]
                    focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15
                    ${className}
                `.trim()}
                {...props}
            />
        );
    },
);

Input.displayName = "Input";
export default Input;
