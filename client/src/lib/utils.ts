import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { BREAKPOINTS, type ScreenSize } from "@/hooks/use-mobile"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Responsive utility functions
export const responsiveUtils = {
  // Generate responsive text classes
  text: {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
    '5xl': 'text-5xl',
  },

  // Generate responsive spacing classes
  spacing: {
    xs: 'p-2',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
    '2xl': 'p-12',
  },

  // Generate responsive grid classes
  grid: {
    cols1: 'grid-cols-1',
    cols2: 'grid-cols-2',
    cols3: 'grid-cols-3',
    cols4: 'grid-cols-4',
    cols5: 'grid-cols-5',
    cols6: 'grid-cols-6',
  },

  // Generate responsive flex classes
  flex: {
    col: 'flex-col',
    row: 'flex-row',
    wrap: 'flex-wrap',
    nowrap: 'flex-nowrap',
  },

  // Generate responsive gap classes
  gap: {
    xs: 'gap-2',
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-10',
    '2xl': 'gap-12',
  },
}

// Responsive class generators
export function getResponsiveText(size: ScreenSize, fallback = 'text-base') {
  const textMap: Record<ScreenSize, string> = {
    xs: responsiveUtils.text.xs,
    sm: responsiveUtils.text.sm,
    md: responsiveUtils.text.base,
    lg: responsiveUtils.text.lg,
    xl: responsiveUtils.text.xl,
    '2xl': responsiveUtils.text['2xl'],
  }
  return textMap[size] || fallback
}

export function getResponsiveSpacing(size: ScreenSize, fallback = 'p-4') {
  const spacingMap: Record<ScreenSize, string> = {
    xs: responsiveUtils.spacing.xs,
    sm: responsiveUtils.spacing.sm,
    md: responsiveUtils.spacing.md,
    lg: responsiveUtils.spacing.lg,
    xl: responsiveUtils.spacing.xl,
    '2xl': responsiveUtils.spacing['2xl'],
  }
  return spacingMap[size] || fallback
}

export function getResponsiveGrid(cols: number, fallback = 'grid-cols-1') {
  return responsiveUtils.grid[`cols${cols}` as keyof typeof responsiveUtils.grid] || fallback
}

// Mobile-first responsive class builder
export function responsiveClass(
  base: string,
  responsive: Partial<Record<ScreenSize, string>> = {}
) {
  const classes = [base]
  
  Object.entries(responsive).forEach(([, className]) => {
    if (className) {
      classes.push(className)
    }
  })
  
  return cn(...classes)
}

// Touch-friendly button classes
export function getTouchButtonClasses(size: 'sm' | 'md' | 'lg' = 'md') {
  const sizes = {
    sm: 'h-10 px-4 text-sm',
    md: 'h-12 px-6 text-base',
    lg: 'h-14 px-8 text-lg',
  }
  
  return cn(
    'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
    sizes[size]
  )
}

// Responsive card classes
export function getResponsiveCardClasses() {
  return cn(
    'rounded-lg border bg-card text-card-foreground shadow-sm',
    'p-4 sm:p-6 lg:p-8'
  )
}

// Responsive modal classes
export function getResponsiveModalClasses() {
  return cn(
    'fixed inset-0 z-50 flex items-center justify-center',
    'p-4 sm:p-6 lg:p-8'
  )
}

// Responsive form classes
export function getResponsiveFormClasses() {
  return cn(
    'space-y-4 sm:space-y-6',
    'p-4 sm:p-6 lg:p-8'
  )
}

// Responsive navigation classes
export function getResponsiveNavClasses() {
  return cn(
    'flex items-center space-x-4',
    'p-2 sm:p-4'
  )
}

// Responsive sidebar classes
export function getResponsiveSidebarClasses(open: boolean = true) {
  return cn(
    // Base classes
    "fixed lg:static inset-y-0 left-0 z-50",
    "bg-white border-r border-gray-200",
    "flex flex-col",
    "transition-all duration-300 ease-in-out",
    
    // Width - always accessible but responsive
    "w-72", // Fixed width for consistency
    
    // Positioning and visibility
    open 
      ? "translate-x-0" 
      : "lg:translate-x-0 -translate-x-full", // Always visible on desktop, hidden on mobile when closed
    
    // Shadow and backdrop
    "shadow-xl lg:shadow-none",
    
    // Ensure it's always above content
    "z-50"
  )
}

// Responsive overlay classes
export function getResponsiveOverlayClasses() {
  return cn(
    'fixed inset-0 bg-black bg-opacity-50 z-40',
    'lg:hidden'
  )
}

// Responsive breakpoint utilities
export const breakpointUtils = {
  isMobile: (width: number) => width < BREAKPOINTS.md,
  isTablet: (width: number) => width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
  isDesktop: (width: number) => width >= BREAKPOINTS.lg,
  isLargeDesktop: (width: number) => width >= BREAKPOINTS.xl,
}

// Enhanced mobile modal utilities
export function getMobileModalClasses() {
  return cn(
    'flex flex-col max-h-[85vh] overflow-hidden'
  )
}

export function getMobileModalHeader(isMobile: boolean = false) {
  return cn(
    'flex-shrink-0 space-y-1.5 text-center sm:text-left',
    isMobile ? 'px-5 pt-5 pb-5' : 'px-6 pt-4 pb-4'
  )
}

export function getMobileModalBody(isMobile: boolean = false) {
  return cn(
    'flex-1 overflow-y-auto',
    isMobile ? 'px-5 pb-5' : 'px-6 pb-4',
    // Smooth scrolling on mobile with proper bounds
    'overscroll-contain [-webkit-overflow-scrolling:touch]',
    // Prevent scroll chaining to parent
    'overscroll-behavior-contain',
    // Consistent 20px spacing between form elements
    'space-y-5',
    // Ensure content doesn't overflow modal bounds
    'max-h-full'
  )
}

export function getMobileModalFooter(isMobile: boolean = false) {
  return cn(
    'flex-shrink-0 border-t bg-background/95 backdrop-blur-sm',
    isMobile ? [
      'px-5 py-5 gap-4 flex flex-col',
      'safe-area-inset-bottom' // Handle notched phones
    ] : [
      'px-6 py-4 flex flex-row-reverse gap-2'
    ]
  )
}

// Enhanced button classes for mobile
export function getMobileButtonClasses(
  variant: 'primary' | 'secondary' | 'outline' = 'primary',
  isMobile: boolean = false
) {
  const baseClasses = cn(
    'inline-flex items-center justify-center font-medium',
    'transition-all duration-200 focus-visible:outline-none focus-visible:ring-2',
    'disabled:opacity-50 disabled:pointer-events-none',
    // Responsive sizing and spacing
    isMobile ? [
      'h-12 px-5 text-base min-w-[48px]',
      'rounded-[20px]' // 20px rounded corners for mobile
    ] : [
      'h-10 px-4 text-sm',
      'rounded-lg' // Standard rounded on desktop
    ]
  )

  const variants = {
    primary: cn(
      'bg-primary text-primary-foreground hover:bg-primary/90',
      'focus-visible:ring-primary/50'
    ),
    secondary: cn(
      'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      'focus-visible:ring-secondary/50'
    ),
    outline: cn(
      'border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground',
      'focus-visible:ring-ring/50'
    )
  }

  return cn(baseClasses, variants[variant])
}

// Update your existing getDialogClasses function
export function getEnhancedDialogClasses(isMobile: boolean) {
  if (isMobile) {
    return getMobileModalClasses()
  }
  return "w-[95vw] max-w-lg max-h-[90vh] mx-auto flex flex-col"
}
