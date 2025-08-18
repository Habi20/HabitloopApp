import * as React from "react"

// Enhanced breakpoints for better mobile responsiveness
const BREAKPOINTS = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${BREAKPOINTS.md - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < BREAKPOINTS.md)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < BREAKPOINTS.md)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

// Enhanced hook for different screen sizes
export function useScreenSize() {
  const [screenSize, setScreenSize] = React.useState<{
    isXs: boolean
    isSm: boolean
    isMd: boolean
    isLg: boolean
    isXl: boolean
    is2xl: boolean
  }>({
    isXs: false,
    isSm: false,
    isMd: false,
    isLg: false,
    isXl: false,
    is2xl: false,
  })

  React.useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth
      setScreenSize({
        isXs: width < BREAKPOINTS.xs,
        isSm: width >= BREAKPOINTS.xs && width < BREAKPOINTS.sm,
        isMd: width >= BREAKPOINTS.sm && width < BREAKPOINTS.md,
        isLg: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
        isXl: width >= BREAKPOINTS.lg && width < BREAKPOINTS.xl,
        is2xl: width >= BREAKPOINTS.xl,
      })
    }

    updateScreenSize()
    window.addEventListener('resize', updateScreenSize)
    return () => window.removeEventListener('resize', updateScreenSize)
  }, [])

  return screenSize
}

// Hook for checking if device is touch-enabled
export function useIsTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = React.useState(false)

  React.useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])

  return isTouchDevice
}

// Hook for checking if device is in portrait mode
export function useIsPortrait() {
  const [isPortrait, setIsPortrait] = React.useState(false)

  React.useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth)
    }

    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    window.addEventListener('orientationchange', checkOrientation)
    
    return () => {
      window.removeEventListener('resize', checkOrientation)
      window.removeEventListener('orientationchange', checkOrientation)
    }
  }, [])

  return isPortrait
}
