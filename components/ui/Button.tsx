"use client";

import { forwardRef, ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "accent";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    icon?: ReactNode;
    children?: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
    primary: "bg-purple-600 text-white hover:bg-purple-500 border-purple-500/50 shadow-lg shadow-purple-500/20",
    secondary: "bg-white/10 text-white hover:bg-white/20 border-white/20",
    ghost: "bg-transparent text-gray-400 hover:bg-white/10 hover:text-white border-transparent",
    danger: "bg-red-600/80 text-white hover:bg-red-500 border-red-500/50",
    accent: "bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-400 hover:to-purple-500 border-white/20 shadow-lg shadow-purple-500/30",
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = "primary", size = "md", loading = false, icon, children, className = "", disabled, ...props }, ref) => {
        const isDisabled = disabled || loading;

        return (
            <button
                ref={ref}
                disabled={isDisabled}
                className={`
                    inline-flex items-center justify-center font-medium rounded-xl border transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-purple-500/50
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
                    ${variantStyles[variant]}
                    ${sizeStyles[size]}
                    ${className}
                `}
                {...props}
            >
                {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : icon ? (
                    <span className="shrink-0">{icon}</span>
                ) : null}
                {children && <span>{children}</span>}
            </button>
        );
    }
);

Button.displayName = "Button";

export default Button;
