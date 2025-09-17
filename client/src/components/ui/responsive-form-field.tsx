import React from 'react';
import { useScreenSize, useIsTouchDevice } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Input } from './input';
import { Textarea } from './textarea';
import { Label } from './label';
import { FormMessage } from './form';

interface ResponsiveFormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
  variant?: 'default' | 'floating' | 'inline';
}

export function ResponsiveFormField({
  label,
  required = false,
  error,
  className,
  children,
  variant = 'default'
}: ResponsiveFormFieldProps) {
  const { isMobile, isXs } = useScreenSize();
  const isTouchDevice = useIsTouchDevice();

  // Auto-determine variant based on screen size and touch capability
  const autoVariant = isMobile && isTouchDevice ? 'floating' : 'default';
  const finalVariant = variant === 'default' ? autoVariant : variant;

  const getLabelClasses = () => {
    switch (finalVariant) {
      case 'floating':
        return 'absolute left-3 top-3 text-xs text-muted-foreground transition-all duration-200 pointer-events-none z-10 bg-white dark:bg-gray-900 px-1';
      case 'inline':
        return 'text-sm font-medium min-w-0 flex-shrink-0';
      default:
        return 'text-sm font-medium';
    }
  };

  const getContainerClasses = () => {
    switch (finalVariant) {
      case 'floating':
        return 'relative';
      case 'inline':
        return 'flex items-center gap-2';
      default:
        return 'space-y-2';
    }
  };

  const getSpacingClasses = () => {
    if (isXs) return 'mb-5';
    if (isMobile) return 'mb-5';
    return 'mb-4';
  };

  return (
    <div className={cn(getContainerClasses(), getSpacingClasses(), className)}>
      <Label className={getLabelClasses()}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div className={finalVariant === 'floating' ? 'pt-6' : ''}>
        {children}
      </div>
      {error && (
        <FormMessage className="text-xs text-red-500 mt-1">
          {error}
        </FormMessage>
      )}
    </div>
  );
}

interface ResponsiveInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  floatingLabel?: boolean;
  icon?: React.ReactNode;
}

export const ResponsiveInput = React.forwardRef<HTMLInputElement, ResponsiveInputProps>(({ 
  floatingLabel = false, 
  icon,
  className,
  ...props 
}, ref) => {
  const { isMobile } = useScreenSize();
  const isTouchDevice = useIsTouchDevice();

  const getInputClasses = () => {
    const baseClasses = 'w-full transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary';
    const sizeClasses = isMobile ? 'h-12 text-base px-5 py-3' : 'h-10 text-sm px-3 py-2';
    const touchClasses = isTouchDevice ? 'touch-manipulation' : '';
    const borderClasses = isMobile ? 'rounded-[20px] border-2 border-gray-200 focus:border-primary focus:ring-primary/50' : 'rounded-lg border border-gray-300 focus:border-primary focus:ring-primary/30';
    
    return cn(baseClasses, sizeClasses, touchClasses, borderClasses, className);
  };

  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
          {icon}
        </div>
      )}
      <Input
        ref={ref}
        {...props}
        className={cn(
          getInputClasses(),
          icon && 'pl-10',
          floatingLabel && 'pt-7 pb-3'
        )}
      />
    </div>
  );
});

ResponsiveInput.displayName = 'ResponsiveInput';

interface ResponsiveTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  floatingLabel?: boolean;
  icon?: React.ReactNode;
}

export const ResponsiveTextarea = React.forwardRef<HTMLTextAreaElement, ResponsiveTextareaProps>(({ 
  floatingLabel = false, 
  icon,
  className,
  ...props 
}, ref) => {
  const { isMobile } = useScreenSize();
  const isTouchDevice = useIsTouchDevice();

  const getTextareaClasses = () => {
    const baseClasses = 'w-full resize-none transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary';
    const sizeClasses = isMobile ? 'min-h-[100px] text-base px-5 py-3' : 'min-h-[80px] text-sm px-3 py-2';
    const touchClasses = isTouchDevice ? 'touch-manipulation' : '';
    const borderClasses = isMobile ? 'rounded-[20px] border-2 border-gray-200 focus:border-primary focus:ring-primary/50' : 'rounded-lg border border-gray-300 focus:border-primary focus:ring-primary/30';
    
    return cn(baseClasses, sizeClasses, touchClasses, borderClasses, className);
  };

  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-3 text-muted-foreground">
          {icon}
        </div>
      )}
      <Textarea
        ref={ref}
        {...props}
        className={cn(
          getTextareaClasses(),
          icon && 'pl-10',
          floatingLabel && 'pt-7 pb-3'
        )}
      />
    </div>
  );
});

ResponsiveTextarea.displayName = 'ResponsiveTextarea';

interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: number;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ResponsiveGrid({ 
  children, 
  cols = 2, 
  gap = 'md',
  className 
}: ResponsiveGridProps) {
  const { isMobile, isXs } = useScreenSize();

  const getGridClasses = () => {
    const gapClasses = {
      sm: 'gap-2',
      md: isMobile ? 'gap-3' : 'gap-4',
      lg: 'gap-6'
    };

    const responsiveCols = isXs ? 1 : isMobile ? 1 : cols;

    return cn(
      'grid',
      `grid-cols-${responsiveCols}`,
      gapClasses[gap],
      className
    );
  };

  return (
    <div className={getGridClasses()}>
      {children}
    </div>
  );
}

interface ResponsiveButtonGroupProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ResponsiveButtonGroup({ 
  children, 
  orientation = 'horizontal',
  spacing = 'md',
  className 
}: ResponsiveButtonGroupProps) {
  const { isMobile, isXs } = useScreenSize();

  const getButtonGroupClasses = () => {
    const spacingClasses = {
      sm: isMobile ? 'gap-2' : 'gap-2',
      md: isMobile ? 'gap-3' : 'gap-4',
      lg: 'gap-4'
    };

    const directionClasses = isMobile && isXs 
      ? 'flex-col' 
      : orientation === 'vertical' 
        ? 'flex-col' 
        : 'flex-row';

    return cn(
      'flex',
      directionClasses,
      spacingClasses[spacing],
      className
    );
  };

  return (
    <div className={getButtonGroupClasses()}>
      {children}
    </div>
  );
}
