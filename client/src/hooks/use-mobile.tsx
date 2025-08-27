import * as React from "react"

// Enhanced breakpoints for better mobile responsiveness
export const BREAKPOINTS = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

export type Breakpoint = keyof typeof BREAKPOINTS
export type ScreenSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

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
    isMobile: boolean
    currentSize: ScreenSize
    width: number
  }>({
    isXs: false,
    isSm: false,
    isMd: false,
    isLg: false,
    isXl: false,
    is2xl: false,
    isMobile: false,
    currentSize: 'md',
    width: 0,
  })

  React.useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth
      let currentSize: ScreenSize = 'md'
      
      if (width < BREAKPOINTS.xs) currentSize = 'xs'
      else if (width < BREAKPOINTS.sm) currentSize = 'sm'
      else if (width < BREAKPOINTS.md) currentSize = 'md'
      else if (width < BREAKPOINTS.lg) currentSize = 'lg'
      else if (width < BREAKPOINTS.xl) currentSize = 'xl'
      else currentSize = '2xl'

      setScreenSize({
        isXs: width < BREAKPOINTS.xs,
        isSm: width >= BREAKPOINTS.xs && width < BREAKPOINTS.sm,
        isMd: width >= BREAKPOINTS.sm && width < BREAKPOINTS.md,
        isLg: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
        isXl: width >= BREAKPOINTS.lg && width < BREAKPOINTS.xl,
        is2xl: width >= BREAKPOINTS.xl,
        isMobile: width < BREAKPOINTS.md,
        currentSize,
        width,
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

// Hook for responsive class generation
export function useResponsiveClasses() {
  const { currentSize } = useScreenSize()
  
  const getResponsiveClass = (
    baseClass: string,
    responsiveClasses: Partial<Record<ScreenSize, string>>
  ) => {
    const classes = [baseClass]
    
    // Add responsive classes based on current size
    Object.entries(responsiveClasses).forEach(([, className]) => {
      if (className) {
        classes.push(className)
      }
    })
    
    return classes.join(' ')
  }

  const getTextSize = (sizes: Partial<Record<ScreenSize, string>>) => {
    return getResponsiveClass('', sizes)
  }

  const getSpacing = (spacing: Partial<Record<ScreenSize, string>>) => {
    return getResponsiveClass('', spacing)
  }

  const getGridCols = (cols: Partial<Record<ScreenSize, string>>) => {
    return getResponsiveClass('grid', cols)
  }

  return {
    getResponsiveClass,
    getTextSize,
    getSpacing,
    getGridCols,
    currentSize,
  }
}

// Hook for responsive breakpoint detection
export function useBreakpoint(breakpoint: Breakpoint) {
  const [isAboveBreakpoint, setIsAboveBreakpoint] = React.useState(false)

  React.useEffect(() => {
    const checkBreakpoint = () => {
      setIsAboveBreakpoint(window.innerWidth >= BREAKPOINTS[breakpoint])
    }

    checkBreakpoint()
    window.addEventListener('resize', checkBreakpoint)
    return () => window.removeEventListener('resize', checkBreakpoint)
  }, [breakpoint])

  return isAboveBreakpoint
}

// Hook for responsive layout management
export function useResponsiveLayout() {
  const { isMobile, isLg, isXl } = useScreenSize()
  const isTouchDevice = useIsTouchDevice()
  
  const layoutConfig = {
    sidebarWidth: isMobile ? 'w-72' : 'w-64',
    mainPadding: isMobile ? 'p-4' : isLg ? 'p-6' : isXl ? 'p-8' : 'p-6',
    cardPadding: isMobile ? 'p-4' : 'p-6',
    gridCols: isMobile ? 'grid-cols-1' : isLg ? 'grid-cols-2' : isXl ? 'grid-cols-3' : 'grid-cols-2',
    textSize: isMobile ? 'text-sm' : 'text-base',
    buttonSize: isTouchDevice ? 'h-12 px-6' : 'h-10 px-4',
  }

  return layoutConfig
}
