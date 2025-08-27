import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  getResponsiveSidebarClasses,
  getResponsiveOverlayClasses,
  getTouchButtonClasses,
} from "@/lib/utils";
import { useIsTouchDevice } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open = true, onClose }: SidebarProps) {
  const [location] = useLocation();
  const isTouchDevice = useIsTouchDevice();
  const { logout } = useAuth();
  const sidebarClasses = getResponsiveSidebarClasses(open);

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          className={getResponsiveOverlayClasses()}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={sidebarClasses}>
        {/* Header with Logo */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <i className="fas fa-chart-line text-white text-sm sm:text-base"></i>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">
              HabitLoop
            </h1>
          </Link>

          {/* Close button - only show on mobile/tablet */}
          <button
            onClick={onClose}
            className={cn(
              "lg:hidden p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors",
              getTouchButtonClasses(isTouchDevice ? "md" : "sm")
            )}
            aria-label="Close menu"
          >
            <i className="fas fa-times w-5 h-5 flex items-center justify-center"></i>
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 sm:p-6 flex-1 overflow-y-auto">
          <div className="space-y-2">
            {/* Navigation Items */}
            <Link
              href="/"
              className={cn(
                "flex items-center space-x-3 px-3 py-3 sm:py-4 rounded-lg transition-all duration-200",
                "hover:bg-gray-100 hover:text-primary group",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                location === "/"
                  ? "bg-primary text-white hover:bg-primary-dark"
                  : "text-gray-700 hover:text-primary"
              )}
              role="button"
              tabIndex={0}
              aria-label="Go to Today page"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  window.location.href = "/";
                }
              }}
            >
              <i
                className={cn(
                  "fas fa-home w-5 h-5 flex items-center justify-center",
                  location === "/"
                    ? "text-white"
                    : "text-gray-500 group-hover:text-primary"
                )}
              ></i>
              <span className="font-medium">Today</span>
            </Link>

            <Link
              href="/stats"
              className={cn(
                "flex items-center space-x-3 px-3 py-3 sm:py-4 rounded-lg transition-all duration-200",
                "hover:bg-gray-100 hover:text-primary group",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                location === "/stats"
                  ? "bg-primary text-white hover:bg-primary-dark"
                  : "text-gray-700 hover:text-primary"
              )}
              role="button"
              tabIndex={0}
              aria-label="Go to Stats page"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  window.location.href = "/stats";
                }
              }}
            >
              <i
                className={cn(
                  "fas fa-chart-bar w-5 h-5 flex items-center justify-center",
                  location === "/stats"
                    ? "text-white"
                    : "text-gray-500 group-hover:text-primary"
                )}
              ></i>
              <span className="font-medium">Your Stats</span>
            </Link>

            <Link
              href="/habits"
              className={cn(
                "flex items-center space-x-3 px-3 py-3 sm:py-4 rounded-lg transition-all duration-200",
                "hover:bg-gray-100 hover:text-primary group",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                location === "/habits"
                  ? "bg-primary text-white hover:bg-primary-dark"
                  : "text-gray-700 hover:text-primary"
              )}
              role="button"
              tabIndex={0}
              aria-label="Go to All Habits page"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  window.location.href = "/habits";
                }
              }}
            >
              <i
                className={cn(
                  "fas fa-list w-5 h-5 flex items-center justify-center",
                  location === "/habits"
                    ? "text-white"
                    : "text-gray-500 group-hover:text-primary"
                )}
              ></i>
              <span className="font-medium">All Habits</span>
            </Link>

            <Link
              href="/challenges"
              className={cn(
                "flex items-center space-x-3 px-3 py-3 sm:py-4 rounded-lg transition-all duration-200",
                "hover:bg-gray-100 hover:text-primary group",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                location === "/challenges"
                  ? "bg-primary text-white hover:bg-primary-dark"
                  : "text-gray-700 hover:text-primary"
              )}
              role="button"
              tabIndex={0}
              aria-label="Go to Challenges page"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  window.location.href = "/challenges";
                }
              }}
            >
              <i
                className={cn(
                  "fas fa-trophy w-5 h-5 flex items-center justify-center",
                  location === "/challenges"
                    ? "text-white"
                    : "text-gray-500 group-hover:text-primary"
                )}
              ></i>
              <span className="font-medium">Challenges</span>
            </Link>

            <Link
              href="/profile"
              className={cn(
                "flex items-center space-x-3 px-3 py-3 sm:py-4 rounded-lg transition-all duration-200",
                "hover:bg-gray-100 hover:text-primary group",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                location === "/profile"
                  ? "bg-primary text-white hover:bg-primary-dark"
                  : "text-gray-700 hover:text-primary"
              )}
              role="button"
              tabIndex={0}
              aria-label="Go to Profile page"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  window.location.href = "/profile";
                }
              }}
            >
              <i
                className={cn(
                  "fas fa-user w-5 h-5 flex items-center justify-center",
                  location === "/profile"
                    ? "text-white"
                    : "text-gray-500 group-hover:text-primary"
                )}
              ></i>
              <span className="font-medium">Profile</span>
            </Link>

            <Link
              href="/settings"
              className={cn(
                "flex items-center space-x-3 px-3 py-3 sm:py-4 rounded-lg transition-all duration-200",
                "hover:bg-gray-100 hover:text-primary group",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                location === "/settings"
                  ? "bg-primary text-white hover:bg-primary-dark"
                  : "text-gray-700 hover:text-primary"
              )}
              role="button"
              tabIndex={0}
              aria-label="Go to Settings page"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  window.location.href = "/settings";
                }
              }}
            >
              <i
                className={cn(
                  "fas fa-cog w-5 h-5 flex items-center justify-center",
                  location === "/settings"
                    ? "text-white"
                    : "text-gray-500 group-hover:text-primary"
                )}
              ></i>
              <span className="font-medium">Settings</span>
            </Link>
          </div>

          {/* Sign Out Button - Bottom of sidebar */}
          <div className="p-4 sm:p-6 border-t border-gray-200">
            <button
              onClick={logout}
              className={cn(
                "w-full flex items-center space-x-3 px-3 py-3 sm:py-4 rounded-lg transition-all duration-200",
                "hover:bg-red-50 hover:text-red-600 group",
                "focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
                "text-gray-700 hover:text-red-600"
              )}
              role="button"
              tabIndex={0}
              aria-label="Sign out"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  logout();
                }
              }}
            >
              <i className="fas fa-sign-out-alt w-5 h-5 flex items-center justify-center text-gray-500 group-hover:text-red-600"></i>
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}
