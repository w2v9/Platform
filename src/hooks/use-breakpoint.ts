import { useEffect, useState } from "react";
import { breakpoints } from "@/lib/utils/responsive";

/**
 * A custom hook that returns breakpoint values for responsive design
 * @returns An object with boolean values for different screen sizes
 */
export function useBreakpoint() {
    const [state, setState] = useState({
        isMobile: false,
        isTablet: false,
        isDesktop: false,
        isSmallScreen: false,
        isMediumScreen: false,
        isLargeScreen: false,
    });

    useEffect(() => {
        // Handler to call on window resize
        const handleResize = () => {
            setState({
                isMobile: window.matchMedia(breakpoints.mobile).matches,
                isTablet: window.matchMedia(breakpoints.tablet).matches,
                isDesktop: window.matchMedia(breakpoints.desktop).matches,
                isSmallScreen: window.matchMedia(breakpoints.sm).matches,
                isMediumScreen: window.matchMedia(breakpoints.md).matches,
                isLargeScreen: window.matchMedia(breakpoints.lg).matches,
            });
        };

        // Add event listener
        window.addEventListener("resize", handleResize);

        // Call handler right away so state gets updated with initial window size
        handleResize();

        // Remove event listener on cleanup
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return state;
}
