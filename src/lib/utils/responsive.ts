// Custom responsive utility constants
export const screens = {
    xs: '480px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
};

export const breakpoints = {
    xs: `(min-width: ${screens.xs})`,
    sm: `(min-width: ${screens.sm})`,
    md: `(min-width: ${screens.md})`,
    lg: `(min-width: ${screens.lg})`,
    xl: `(min-width: ${screens.xl})`,
    '2xl': `(min-width: ${screens['2xl']})`,

    // Max-width versions
    'max-xs': `(max-width: ${screens.xs})`,
    'max-sm': `(max-width: ${screens.sm})`,
    'max-md': `(max-width: ${screens.md})`,
    'max-lg': `(max-width: ${screens.lg})`,
    'max-xl': `(max-width: ${screens.xl})`,
    'max-2xl': `(max-width: ${screens['2xl']})`,

    // Device-specific
    'mobile': `(max-width: ${screens.sm})`,
    'tablet': `(min-width: ${screens.sm}) and (max-width: ${screens.lg})`,
    'desktop': `(min-width: ${screens.lg})`,
};

// Example helper functions
export function clampFontSize(minSize: number, maxSize: number, minWidth = screens.sm, maxWidth = screens.xl): string {
    // Calculate font size that scales fluidly between min and max based on viewport width
    return `clamp(${minSize}px, calc(${minSize}px + (${maxSize} - ${minSize}) * ((100vw - ${minWidth}) / (${maxWidth} - ${minWidth}))), ${maxSize}px)`;
}

export function getResponsiveValue<T>(
    value: T | { [key: string]: T },
    breakpoint: keyof typeof breakpoints
): T | undefined {
    if (typeof value === 'object' && value !== null) {
        return (value as { [key: string]: T })[breakpoint];
    }
    return value as T;
}
