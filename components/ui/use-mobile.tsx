import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Start with false as default to match server-side rendering
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
    }
  }, [])

  return isMobile
}
