"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => {
  const isMobile = useIsMobile()
  
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        "fixed inset-0 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        // Enhanced mobile backdrop
        isMobile 
          ? "bg-black/50 backdrop-blur-md" 
          : "bg-black/80 backdrop-blur-sm",
        className
      )}
      {...props}
    />
  )
})
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    showCloseButton?: boolean
    mobileVariant?: "bottom-sheet" | "center"
  }
>(({ className, children, showCloseButton = true, mobileVariant = "bottom-sheet", ...props }, ref) => {
  const isMobile = useIsMobile()
  
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          // Base styles
          "fixed z-50 gap-4 bg-background shadow-lg duration-200",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          
          // Mobile-specific styles
          isMobile && mobileVariant === "bottom-sheet" ? [
            // Bottom sheet positioning
            "inset-x-0 bottom-0 top-auto",
            "border-t border-l border-r rounded-t-[20px]",
            "data-[state=closed]:slide-out-to-bottom",
            "data-[state=open]:slide-in-from-bottom",
            "max-h-[85vh] flex flex-col",
            // Prevent overscroll
            "overscroll-contain",
            // Enhanced mobile styling
            "shadow-2xl"
          ] : [
            // Desktop center positioning
            "left-[50%] top-[50%] max-h-[85vh] w-full max-w-lg translate-x-[-50%] translate-y-[-50%]",
            "border rounded-xl",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
            "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
            "sm:rounded-xl flex flex-col",
            // Enhanced desktop styling
            "shadow-xl"
          ],
          className
        )}
        {...props}
      >
        {/* Mobile drag handle */}
        {isMobile && mobileVariant === "bottom-sheet" && (
          <div className="mx-auto mt-4 h-2 w-20 rounded-full bg-gray-300 dark:bg-gray-600 cursor-grab active:cursor-grabbing hover:bg-gray-400 dark:hover:bg-gray-500 transition-all duration-200 flex items-center justify-center">
            <div className="w-8 h-0.5 bg-gray-500 dark:bg-gray-400 rounded-full"></div>
          </div>
        )}
        
        {children}
        
        {/* Close button - responsive positioning */}
        {showCloseButton && (
          <DialogPrimitive.Close 
            className={cn(
              "absolute ring-offset-background transition-all duration-200 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
              isMobile ? [
                "right-4 top-4 rounded-lg opacity-70 hover:opacity-100",
                "h-10 w-10", // Larger touch target
                "hover:bg-muted/50 active:bg-muted/70"
              ] : [
                "right-4 top-4 rounded-md opacity-70 hover:opacity-100",
                "h-8 w-8",
                "hover:bg-muted/50 active:bg-muted/70"
              ]
            )}
          >
            <X className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
