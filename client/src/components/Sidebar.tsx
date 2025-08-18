
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open = true, onClose }: SidebarProps) {
  const [location] = useLocation();

  const navigation = [
    { name: "Today", href: "/", icon: "fas fa-home" },
    { name: "Your Stats", href: "/stats", icon: "fas fa-chart-bar" },
    { name: "All Habits", href: "/habits", icon: "fas fa-list" },
    { name: "Challenges", href: "/challenges", icon: "fas fa-trophy" },
  ];

  const secondaryNavigation = [
    { name: "Profile", href: "/profile", icon: "fas fa-user" },
    { name: "Settings", href: "/settings", icon: "fas fa-cog" },
  ];

  const sidebarClasses = cn(
    "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
    open ? "translate-x-0" : "-translate-x-full"
  );

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={sidebarClasses}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-chart-line text-white text-sm"></i>
            </div>
            <h1 className="text-xl font-bold text-gray-900">HabitLoop</h1>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="lg:hidden text-gray-400 hover:text-gray-600"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link href={item.href}>
                  <span 
                    className={cn(
                      "flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors cursor-pointer",
                      location === item.href
                        ? "text-primary bg-indigo-50"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                    onClick={() => onClose?.()}
                  >
                    <i className={`${item.icon} w-5`}></i>
                    <span>{item.name}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          
          <div className="border-t border-gray-200 mt-8 pt-4">
            <ul className="space-y-2">
              {secondaryNavigation.map((item) => (
                <li key={item.name}>
                  <Link href={item.href}>
                    <span 
                      className={cn(
                        "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer",
                        location === item.href
                          ? "text-primary bg-indigo-50"
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                      onClick={() => onClose?.()}
                    >
                      <i className={`${item.icon} w-5`}></i>
                      <span>{item.name}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </aside>
    </>
  );
}
