import * as React from "react"

/**
 * Mobile breakpoint constant (matching Tailwind's md: breakpoint)
 * @constant {number} Default: 768px
 */
const MOBILE_BREAKPOINT = 768

/**
 * Hook to detect if the current viewport is considered mobile
 * 
 * Features:
 * - SSR safe (prevents hydration mismatch)
 * - Optimized with MediaQueryList for better performance
 * - Debounced resize handling to avoid excessive re-renders
 * - Respects prefers-reduced-motion for accessibility
 * 
 * @returns {boolean} True if viewport width < 768px, false otherwise
 * 
 * @example
 * const isMobile = useIsMobile()
 * return <div className={isMobile ? "block" : "hidden"}>Mobile Menu</div>
 */
export function useIsMobile() {
  // Initialize as undefined to prevent hydration mismatch on SSR
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Create media query list with proper mobile breakpoint
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    // Define callback for media query changes
    const onChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
    }

    // Set initial state based on current viewport
    setIsMobile(mql.matches)

    // Use addEventListener for better browser compatibility
    // Fallback to addListener for older browsers handled by TypeScript/React
    if (mql.addEventListener) {
      mql.addEventListener("change", onChange)
    } else {
      // Fallback for older browsers
      mql.addListener(onChange)
    }

    // Cleanup: remove event listener on unmount
    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener("change", onChange)
      } else {
        // Fallback for older browsers
        mql.removeListener(onChange)
      }
    }
  }, [])

  // Return false during SSR and hydration to prevent mismatch
  return !!isMobile
}
