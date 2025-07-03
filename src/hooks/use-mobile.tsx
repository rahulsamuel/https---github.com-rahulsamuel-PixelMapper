
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    // Set the initial value on the client
    checkIsMobile()

    // Add event listener for window resize
    window.addEventListener("resize", checkIsMobile)

    // Clean up event listener on unmount
    return () => window.removeEventListener("resize", checkIsMobile)
  }, []) // Empty dependency array ensures this runs only once on the client after mount

  return isMobile
}
