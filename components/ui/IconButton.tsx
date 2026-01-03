"use client";

import { forwardRef, ButtonHTMLAttributes, ReactNode } from "react";

type IconButtonVariant = "default" | "danger" | "success" | "warning" | "info";
type IconButtonSize = "sm" | "md" | "lg";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: IconButtonVariant;
    size?: IconButtonSize;
    icon: ReactNode;
    active?: boolean;
}

const variantStyles: Record<IconButtonVariant, { base: string; active: string }> = {
    default: {
        base: "text-gray-400 hover:text-white hover:bg-white/10",
        active: "text-white bg-white/20",
    },
    danger: {
        base: "text-red-300 hover:text-white hover:bg-red-500",
        active: "text-white bg-red-500",
    },
    success: {
        base: "text-green-300 hover:text-white hover:bg-green-500",
        active: "text-white bg-green-500",
    },
    warning: {
        base: "text-yellow-300 hover:text-white hover:bg-yellow-500",
        active: "text-white bg-yellow-500",
    },
    info: {
        base: "text-cyan-300 hover:text-white hover:bg-cyan-500",
        active: "text-white bg-cyan-500",
    },
};

const sizeStyles: Record<IconButtonSize, string> = {
    sm: "p-1.5 [&_svg]:w-3.5 [&_svg]:h-3.5",
    md: "p-2 [&_svg]:w-4 [&_svg]:h-4",
    lg: "p-2.5 [&_svg]:w-5 [&_svg]:h-5",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
    ({ variant = "default", size = "md", icon, active = false, className = "", ...props }, ref) => {
        const styles = variantStyles[variant];

        return (
            <button
                ref={ref}
                className={`
                    inline-flex items-center justify-center rounded-full transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-white/30
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${active ? styles.active : styles.base}
                    ${sizeStyles[size]}
                    ${className}
                `}
                {...props}
            >
                {icon}
            </button>
        );
    }
);

IconButton.displayName = "IconButton";

export default IconButton;
