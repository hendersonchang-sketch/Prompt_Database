"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface DropdownMenuProps {
    trigger: ReactNode;
    children: ReactNode;
    align?: "left" | "right";
}

interface DropdownItemProps {
    icon?: ReactNode;
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    danger?: boolean;
}

export function DropdownMenu({ trigger, children, align = "right" }: DropdownMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
                {trigger}
            </div>

            {isOpen && (
                <div
                    className={`
                        absolute z-50 mt-2 min-w-[180px] py-1.5
                        bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl
                        animate-in fade-in slide-in-from-top-2 duration-200
                        ${align === "right" ? "right-0" : "left-0"}
                    `}
                >
                    {children}
                </div>
            )}
        </div>
    );
}

export function DropdownItem({ icon, children, onClick, disabled = false, danger = false }: DropdownItemProps) {
    return (
        <button
            onClick={() => {
                if (!disabled && onClick) onClick();
            }}
            disabled={disabled}
            className={`
                w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors
                ${danger
                    ? "text-red-400 hover:bg-red-500/20 hover:text-red-300"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                }
                ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            `}
        >
            {icon && <span className="w-4 h-4 shrink-0">{icon}</span>}
            <span>{children}</span>
        </button>
    );
}

export function DropdownDivider() {
    return <div className="my-1.5 border-t border-white/10" />;
}
