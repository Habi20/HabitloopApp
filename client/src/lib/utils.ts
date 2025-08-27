import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { BREAKPOINTS, type ScreenSize } from "@/hooks/use-mobile";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Responsive utility functions
export const responsiveUtils = {
  // Generate responsive text classes
  text: {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
    "3xl": "text-3xl",
    "4xl": "text-4xl",
    "5xl": "text-5xl",
  },

  // Generate responsive spacing classes
  spacing: {
    xs: "p-2",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
    xl: "p-10",
    "2xl": "p-12",
  },

  // Generate responsive grid classes
  grid: {
    cols1: "grid-cols-1",
    cols2: "grid-cols-2",
    cols3: "grid-cols-3",
    cols4: "grid-cols-4",
    cols5: "grid-cols-5",
    cols6: "grid-cols-6",
  },

  // Generate responsive flex classes
  flex: {
    col: "flex-col",
    row: "flex-row",
    wrap: "flex-wrap",
    nowrap: "flex-nowrap",
  },

  // Generate responsive gap classes
  gap: {
    xs: "gap-2",
    sm: "gap-4",
    md: "gap-6",
    lg: "gap-8",
    xl: "gap-10",
    "2xl": "gap-12",
  },
};

// Responsive class generators
export function getResponsiveText(size: ScreenSize, fallback = "text-base") {
  const textMap: Record<ScreenSize, string> = {
    xs: responsiveUtils.text.xs,
    sm: responsiveUtils.text.sm,
    md: responsiveUtils.text.base,
    lg: responsiveUtils.text.lg,
    xl: responsiveUtils.text.xl,
    "2xl": responsiveUtils.text["2xl"],
  };
  return textMap[size] || fallback;
}

export function getResponsiveSpacing(size: ScreenSize, fallback = "p-4") {
  const spacingMap: Record<ScreenSize, string> = {
    xs: responsiveUtils.spacing.xs,
    sm: responsiveUtils.spacing.sm,
    md: responsiveUtils.spacing.md,
    lg: responsiveUtils.spacing.lg,
    xl: responsiveUtils.spacing.xl,
    "2xl": responsiveUtils.spacing["2xl"],
  };
  return spacingMap[size] || fallback;
}

export function getResponsiveGrid(cols: number, fallback = "grid-cols-1") {
  return (
    responsiveUtils.grid[`cols${cols}` as keyof typeof responsiveUtils.grid] ||
    fallback
  );
}

// Mobile-first responsive class builder
export function responsiveClass(
  base: string,
  responsive: Partial<Record<ScreenSize, string>> = {}
) {
  const classes = [base];

  Object.entries(responsive).forEach(([, className]) => {
    if (className) {
      classes.push(className);
    }
  });

  return cn(...classes);
}

// Touch-friendly button classes
export function getTouchButtonClasses(size: "sm" | "md" | "lg" = "md") {
  const sizes = {
    sm: "h-10 px-4 text-sm",
    md: "h-12 px-6 text-base",
    lg: "h-14 px-8 text-lg",
  };

  return cn(
    "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
    sizes[size]
  );
}

// Responsive card classes
export function getResponsiveCardClasses() {
  return cn(
    "rounded-lg border bg-card text-card-foreground shadow-sm",
    "p-4 sm:p-6 lg:p-8"
  );
}

// Responsive modal classes
export function getResponsiveModalClasses() {
  return cn(
    "fixed inset-0 z-50 flex items-center justify-center",
    "p-4 sm:p-6 lg:p-8"
  );
}

// Responsive form classes
export function getResponsiveFormClasses() {
  return cn("space-y-4 sm:space-y-6", "p-4 sm:p-6 lg:p-8");
}

// Responsive navigation classes
export function getResponsiveNavClasses() {
  return cn("flex items-center space-x-4", "p-2 sm:p-4");
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
    open ? "translate-x-0" : "lg:translate-x-0 -translate-x-full", // Always visible on desktop, hidden on mobile when closed

    // Shadow and backdrop
    "shadow-xl lg:shadow-none",

    // Ensure it's always above content
    "z-50"
  );
}

// Responsive overlay classes
export function getResponsiveOverlayClasses() {
  return cn("fixed inset-0 bg-black bg-opacity-50 z-40", "lg:hidden");
}

// Responsive breakpoint utilities
export const breakpointUtils = {
  isMobile: (width: number) => width < BREAKPOINTS.md,
  isTablet: (width: number) =>
    width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
  isDesktop: (width: number) => width >= BREAKPOINTS.lg,
  isLargeDesktop: (width: number) => width >= BREAKPOINTS.xl,
};
