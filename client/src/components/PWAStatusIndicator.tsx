import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Download, CheckCircle } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAStatusIndicatorProps {
  className?: string;
}

export function PWAStatusIndicator({ className = '' }: PWAStatusIndicatorProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isPWA, setIsPWA] = useState(false);
  const { isInstallable } = usePWAInstall();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check if running as PWA
    const checkPWAStatus = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      setIsPWA(isStandalone || isIOSStandalone);
    };

    checkPWAStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getStatusIcon = () => {
    if (!isOnline) {
      return <WifiOff className="h-4 w-4 text-red-500" />;
    }
    if (isPWA) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (isInstallable) {
      return <Download className="h-4 w-4 text-blue-500" />;
    }
    return <Wifi className="h-4 w-4 text-gray-500" />;
  };

  const getStatusText = () => {
    if (!isOnline) {
      return 'Offline';
    }
    if (isPWA) {
      return 'PWA Mode';
    }
    if (isInstallable) {
      return 'Installable';
    }
    return 'Online';
  };

  const getStatusColor = () => {
    if (!isOnline) {
      return 'text-red-600 bg-red-50 border-red-200';
    }
    if (isPWA) {
      return 'text-green-600 bg-green-50 border-green-200';
    }
    if (isInstallable) {
      return 'text-blue-600 bg-blue-50 border-blue-200';
    }
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium ${getStatusColor()} ${className}`}>
      {getStatusIcon()}
      <span>{getStatusText()}</span>
    </div>
  );
}

export default PWAStatusIndicator;
