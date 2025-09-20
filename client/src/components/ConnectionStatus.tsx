import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { WifiOff } from 'lucide-react';

interface ConnectionStatusProps {
  showToast?: boolean;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  showToast = true, 
  className = '' 
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (showToast) {
        toast({
          title: "Back Online",
          description: "Your connection has been restored.",
          duration: 3000,
        });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      if (showToast) {
        toast({
          title: "You're Offline",
          description: "Some features may not be available. Your data will sync when you're back online.",
          variant: "destructive",
          duration: 5000,
        });
      }
    };

    // Listen to browser online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen to PWA connection change events
    const handlePWAConnectionChange = (event: CustomEvent) => {
      const { isOnline: pwaOnline } = event.detail;
      setIsOnline(pwaOnline);
    };

    window.addEventListener('pwa-connection-change', handlePWAConnectionChange as EventListener);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('pwa-connection-change', handlePWAConnectionChange as EventListener);
    };
  }, [showToast, toast]);

  if (isOnline) {
    return null; // Don't show anything when online
  }

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <div className="flex items-center gap-2 bg-red-100 text-red-800 px-3 py-2 rounded-lg shadow-lg border border-red-200">
        <WifiOff className="h-4 w-4" />
        <span className="text-sm font-medium">Offline Mode</span>
      </div>
    </div>
  );
};

export default ConnectionStatus;
