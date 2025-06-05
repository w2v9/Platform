import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);

        // Update matches state immediately
        setMatches(media.matches);

        // Set up listener for changes
        const listener = () => setMatches(media.matches);
        media.addEventListener("change", listener);

        // Clean up listener
        return () => media.removeEventListener("change", listener);
    }, [query]);

    return matches;
}
