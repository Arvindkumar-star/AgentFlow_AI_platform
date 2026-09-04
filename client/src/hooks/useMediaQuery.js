import { useState, useEffect } from 'react';

/**
 * Custom hook to detect media query matches dynamically
 * @param {string} query - CSS media query string, e.g. '(max-width: 767px)'
 * @returns {boolean} Whether the media query matches
 */
export function useMediaQuery(query = '(max-width: 767px)') {
  const [matches, setMatches] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;

    const mediaQueryList = window.matchMedia(query);
    const updateMatch = () => setMatches(mediaQueryList.matches);

    // Initial check on mount
    updateMatch();

    // Modern and fallback event listeners
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', updateMatch);
      return () => mediaQueryList.removeEventListener('change', updateMatch);
    } else if (mediaQueryList.addListener) {
      mediaQueryList.addListener(updateMatch);
      return () => mediaQueryList.removeListener(updateMatch);
    }
  }, [query]);

  // Return false during SSR to avoid hydration mismatch, then reflect real client state
  return mounted ? matches : false;
}

export default useMediaQuery;
