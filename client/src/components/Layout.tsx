import { useState, ReactNode, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useIsMobile, useIsTouchDevice, useScreenSize } from '@/hooks/use-mobile';

interface LayoutProps {
  children: ReactNode;
  className?: string;
  showSidebar?: boolean;
  onSidebarToggle?: (open: boolean) => void;
  sidebarOpen?: boolean;
  onSidebarOpen?: () => void;
  pageTitle?: string;
}

export function Layout({ 
  children, 
  className, 
  showSidebar = true, 
  onSidebarToggle,
  sidebarOpen: externalSidebarOpen,
  onSidebarOpen,
  pageTitle = "HabitLoop"
}: LayoutProps) {
  const [internalSidebarOpen, setInternalSidebarOpen] = useState(false);
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const isTouchDevice = useIsTouchDevice();
  const { isLg } = useScreenSize();

  // Use external state if provided, otherwise use internal state
  const sidebarOpen = externalSidebarOpen !== undefined ? externalSidebarOpen : internalSidebarOpen;
  const setSidebarOpen = (open: boolean) => {
    if (externalSidebarOpen !== undefined) {
      onSidebarToggle?.(open);
    } else {
      setInternalSidebarOpen(open);
    }
  };

  // Close sidebar when route changes (on mobile)
  const handleRouteChange = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [sidebarOpen]);

  // Auto-close sidebar on mobile when screen size changes
  useEffect(() => {
    if (isLg && sidebarOpen && isMobile) {
      setSidebarOpen(false);
    }
  }, [isLg, sidebarOpen, isMobile]);

  // If not authenticated, just render the children without layout
  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className={cn('min-h-screen flex bg-gray-50', className)}>
      {/* Sidebar - Always present but responsive */}
      {showSidebar && (
        <Sidebar 
          open={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
      )}
      
      {/* Main Content */}
      <main 
        className={cn(
          "flex-1 transition-all duration-300 ease-in-out",
          "flex flex-col"
        )}
        onClick={handleRouteChange}
      >
        {/* Universal Header - Always visible */}
        <header className={cn(
          "sticky top-0 z-30 bg-white border-b border-gray-200",
          "flex items-center justify-between",
          "px-4 sm:px-6 lg:px-8 py-3 sm:py-4"
        )}>
          {/* Left: Hamburger Menu (Mobile/Tablet only) + Page Title */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Hamburger Menu - Only show on mobile/tablet */}
            <button
              type="button"
              className={cn(
                "p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                isTouchDevice ? "h-12 w-12" : "h-10 w-10",
                "lg:hidden" // Hide on desktop
              )}
              onClick={(e) => {
                e.stopPropagation();
                if (onSidebarOpen) {
                  onSidebarOpen();
                } else {
                  setSidebarOpen(true);
                }
              }}
              aria-label="Open sidebar"
              aria-expanded={sidebarOpen}
              aria-controls="sidebar-navigation"
            >
              <i className="fas fa-bars text-lg sm:text-xl"></i>
            </button>
            
            {/* Page Title - Show on mobile/tablet only */}
            <div className="flex items-center space-x-2 lg:hidden">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">{pageTitle}</h1>
            </div>
          </div>
          
          {/* Center: Page Title (Desktop only) */}
          <div className="hidden lg:flex items-center justify-center flex-1">
            <h1 className="text-xl font-bold text-gray-900">{pageTitle}</h1>
          </div>
          
          {/* Right: Spacer for centering */}
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 lg:hidden"></div> {/* Spacer for mobile/tablet */}
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
