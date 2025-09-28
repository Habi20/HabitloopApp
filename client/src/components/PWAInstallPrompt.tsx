import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { X, Download, Smartphone, Monitor, Tablet } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
  isAuthenticated?: boolean;
}

export function PWAInstallPrompt({ onInstall, onDismiss, isAuthenticated = false }: PWAInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop' | 'tablet'>('desktop');
  const { toast } = useToast();

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      // Check for standalone mode (PWA installed)
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return;
      }
      
      // Check for iOS Safari
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true);
        return;
      }
      
      // Check if running in app mode
      if (window.location.protocol === 'https:' && window.navigator.userAgent.includes('Mobile')) {
        // Additional checks for mobile PWA
        const isInApp = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true ||
                       document.referrer.includes('android-app://');
        setIsInstalled(isInApp);
      }
    };

    checkIfInstalled();

    // Check if user has previously dismissed the prompt or seen it
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    const hasSeenPrompt = localStorage.getItem('pwa-prompt-seen');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const now = Date.now();
    const daysSinceDismissed = (now - dismissedTime) / (1000 * 60 * 60 * 24);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      
      // Only show prompt if:
      // 1. Not already installed
      // 2. Never seen before OR dismissed more than 7 days ago
      // 3. Not in standalone mode
      // 4. User is authenticated (engaged user)
      if (!isInstalled && (!hasSeenPrompt || daysSinceDismissed > 7) && isAuthenticated) {
        // Show prompt after a delay to not be too aggressive
        setTimeout(() => {
          setShowPrompt(true);
        }, 5000); // Increased delay to 5 seconds
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.setItem('pwa-prompt-seen', 'true');
      localStorage.setItem('pwa-installed', 'true');
      toast({
        title: "🎉 HabitLoop Installed!",
        description: "You can now access HabitLoop from your home screen for quick habit tracking.",
        variant: "default",
      });
      onInstall?.();
    };

    // Detect device type
    const detectDeviceType = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
        setDeviceType('mobile');
      } else if (/tablet|ipad|android(?!.*mobile)/i.test(userAgent)) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    detectDeviceType();

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled, onInstall, toast]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback instructions for manual installation
      showManualInstallInstructions();
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('✅ PWA installation accepted');
        toast({
          title: "Installing HabitLoop...",
          description: "Please follow the prompts to add HabitLoop to your home screen.",
          variant: "default",
        });
      } else {
        console.log('❌ PWA installation dismissed');
        handleDismiss();
      }
    } catch (error) {
      console.error('PWA installation failed:', error);
      showManualInstallInstructions();
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    const now = Date.now();
    localStorage.setItem('pwa-prompt-dismissed', now.toString());
    localStorage.setItem('pwa-prompt-seen', 'true');
    
    // Show a subtle toast that they can install later
    toast({
      title: "No problem!",
      description: "You can install HabitLoop anytime from your browser menu.",
      variant: "default",
      duration: 3000,
    });
    
    onDismiss?.();
  };

  const showManualInstallInstructions = () => {
    const instructions = getInstallInstructions(deviceType);
    toast({
      title: "📱 Install HabitLoop",
      description: instructions,
      variant: "default",
      duration: 10000,
    });
  };

  const getInstallInstructions = (device: string) => {
    switch (device) {
      case 'mobile':
        return "Tap the share button in your browser, then select 'Add to Home Screen' to install HabitLoop.";
      case 'tablet':
        return "Tap the menu button (⋮) in your browser, then select 'Add to Home Screen' to install HabitLoop.";
      default:
        return "Click the install button in your browser's address bar, or use the browser menu to install HabitLoop.";
    }
  };

  const getDeviceIcon = () => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-6 w-6" />;
      case 'tablet':
        return <Tablet className="h-6 w-6" />;
      default:
        return <Monitor className="h-6 w-6" />;
    }
  };

  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            {getDeviceIcon()}
          </div>
          <CardTitle className="text-xl">Install HabitLoop</CardTitle>
          <CardDescription>
            Get instant access to your habits with our app-like experience
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Quick habit logging from home screen</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Works offline for consistent tracking</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Push notifications for reminders</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>Native app-like experience</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleInstallClick}
              className="flex-1"
              size="lg"
            >
              <Download className="h-4 w-4 mr-2" />
              Install App
            </Button>
            <Button 
              onClick={handleDismiss}
              variant="outline"
              size="lg"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-xs text-center text-gray-500">
            {deviceType === 'mobile' 
              ? "Tap 'Add to Home Screen' when prompted"
              : "Look for the install button in your browser"
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

