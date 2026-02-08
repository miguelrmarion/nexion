import { forwardRef, TextareaHTMLAttributes } from "react";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
    ({ className = "", ...props }, ref) => {
        return (
            <textarea
                ref={ref}
                className={`
                    w-full px-3.5 py-2.5
                    border border-border rounded-lg
                    bg-surface text-foreground text-sm
                    placeholder:text-[#94a3b8]
                    focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15
                    resize-none
                    ${className}
                `.trim()}
                {...props}
            />
        );
    },
);

TextArea.displayName = "TextArea";
export default TextArea;
