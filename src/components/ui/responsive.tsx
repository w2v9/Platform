/**
 * This component provides a responsive layout for mobile and tablet screens
 * It ensures proper padding and spacing for different device sizes
 */

'use client';
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { cn } from "@/lib/utils";
import React from "react";

interface ResponsiveContainerProps {
    children: React.ReactNode;
    className?: string;
}

export function ResponsiveContainer({ children, className }: ResponsiveContainerProps) {
    const { isMobile, isTablet } = useBreakpoint();

    return (
        <div
            className={cn(
                "w-full",
                isMobile ? "px-3 py-3" : isTablet ? "px-4 py-4" : "px-6 py-6",
                className
            )}
        >
            {children}
        </div>
    );
}

interface ResponsiveGridProps {
    children: React.ReactNode;
    columns?: number;
    className?: string;
}

export function ResponsiveGrid({ children, columns = 3, className }: ResponsiveGridProps) {
    return (
        <div
            className={cn(
                "grid gap-3 sm:gap-4 md:gap-6",
                columns === 1 && "grid-cols-1",
                columns === 2 && "grid-cols-1 sm:grid-cols-2",
                columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
                columns === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
                className
            )}
        >
            {children}
        </div>
    );
}

interface ResponsiveTextProps {
    children: React.ReactNode;
    variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'small';
    className?: string;
}

export function ResponsiveText({ children, variant = 'p', className }: ResponsiveTextProps) {
    const Element = variant;

    return (
        <Element
            className={cn(
                variant === 'h1' && "text-2xl sm:text-3xl md:text-4xl font-bold",
                variant === 'h2' && "text-xl sm:text-2xl md:text-3xl font-bold",
                variant === 'h3' && "text-lg sm:text-xl md:text-2xl font-semibold",
                variant === 'h4' && "text-base sm:text-lg md:text-xl font-semibold",
                variant === 'p' && "text-sm sm:text-base md:text-lg",
                variant === 'small' && "text-xs sm:text-sm md:text-base",
                className
            )}
        >
            {children}
        </Element>
    );
}
