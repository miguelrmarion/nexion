import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "success" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
    primary: [
        "bg-gradient-to-r from-primary to-accent text-white",
        "shadow-[0_1px_3px_rgba(99,102,241,0.3)]",
        "hover:shadow-[0_4px_12px_rgba(99,102,241,0.4)] hover:-translate-y-px",
        "active:translate-y-0 active:shadow-[0_1px_2px_rgba(99,102,241,0.3)]",
        "disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none",
    ].join(" "),
    secondary: [
        "bg-surface text-text-secondary border border-border",
        "hover:bg-surface-hover hover:border-border-hover",
        "active:bg-[#e2e8f0]",
    ].join(" "),
    danger: [
        "bg-gradient-to-r from-danger to-[#dc2626] text-white",
        "shadow-[0_1px_3px_rgba(239,68,68,0.3)]",
        "hover:shadow-[0_4px_12px_rgba(239,68,68,0.4)] hover:-translate-y-px",
        "active:translate-y-0",
    ].join(" "),
    success: [
        "bg-gradient-to-r from-success to-[#059669] text-white",
        "shadow-[0_1px_3px_rgba(16,185,129,0.3)]",
        "hover:shadow-[0_4px_12px_rgba(16,185,129,0.4)] hover:-translate-y-px",
        "active:translate-y-0",
    ].join(" "),
    ghost: [
        "bg-transparent text-text-secondary",
        "hover:bg-surface-hover",
    ].join(" "),
};

const sizeClasses: Record<ButtonSize, string> = {
    sm: "py-1.5 px-3 text-sm",
    md: "py-2 px-5 text-sm",
    lg: "py-2.5 px-6 text-base",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = "primary",
            size = "md",
            className = "",
            children,
            ...props
        },
        ref,
    ) => {
        return (
            <button
                ref={ref}
                className={`
                    inline-flex items-center justify-center
                    rounded-lg font-medium cursor-pointer
                    ${variantClasses[variant]}
                    ${sizeClasses[size]}
                    ${className}
                `.trim()}
                {...props}
            >
                {children}
            </button>
        );
    },
);

Button.displayName = "Button";
export default Button;
