import { useState, useEffect } from 'react';

// Hook for PWA installation status
export function usePWAInstall() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const checkInstallStatus = () => {
      // Check if already installed
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      
      if (isStandalone || isIOSStandalone) {
        setIsInstalled(true);
        return;
      }

      // Check if installable
      const hasInstallPrompt = 'onbeforeinstallprompt' in window;
      setIsInstallable(hasInstallPrompt);
    };

    checkInstallStatus();

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  return { isInstallable, isInstalled };
}
