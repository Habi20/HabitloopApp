import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { AlertTriangle, Clock, Smartphone } from 'lucide-react';

interface SessionTimeoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExtend: () => void;
  onLogout: () => void;
  type: 'timeout' | 'multiDevice' | 'expired';
  timeRemaining?: number; // in seconds
}

export const SessionTimeoutModal: React.FC<SessionTimeoutModalProps> = ({
  isOpen,
  onClose,
  onExtend,
  onLogout,
  type,
  timeRemaining = 0,
}) => {
  const [countdown, setCountdown] = useState(timeRemaining);

  useEffect(() => {
    if (!isOpen || type !== 'timeout') return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, type, onLogout]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getModalContent = () => {
    switch (type) {
      case 'timeout':
        return {
          title: 'Session Timeout Warning',
          description: `Your session will expire in ${formatTime(countdown)}. Would you like to extend your session?`,
          icon: <Clock className="h-6 w-6 text-yellow-500" />,
          primaryAction: 'Extend Session',
          secondaryAction: 'Logout Now',
          onPrimary: onExtend,
          onSecondary: onLogout,
        };
      case 'multiDevice':
        return {
          title: 'New Login Detected',
          description: 'You have been logged in on another device. This session will be terminated for security.',
          icon: <Smartphone className="h-6 w-6 text-blue-500" />,
          primaryAction: 'Continue on This Device',
          secondaryAction: 'Logout',
          onPrimary: onClose,
          onSecondary: onLogout,
        };
      case 'expired':
        return {
          title: 'Session Expired',
          description: 'Your session has expired due to inactivity. Please log in again to continue.',
          icon: <AlertTriangle className="h-6 w-6 text-red-500" />,
          primaryAction: 'Log In Again',
          secondaryAction: 'Logout',
          onPrimary: onLogout,
          onSecondary: onLogout,
        };
      default:
        return {
          title: 'Session Alert',
          description: 'There is an issue with your session.',
          icon: <AlertTriangle className="h-6 w-6 text-red-500" />,
          primaryAction: 'OK',
          secondaryAction: 'Logout',
          onPrimary: onClose,
          onSecondary: onLogout,
        };
    }
  };

  const content = getModalContent();

  return (
    <Dialog open={isOpen} onOpenChange={type === 'expired' ? undefined : onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {content.icon}
            <DialogTitle>{content.title}</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            {content.description}
          </DialogDescription>
        </DialogHeader>
        
        {type === 'timeout' && countdown > 0 && (
          <div className="flex items-center justify-center py-4">
            <div className="text-2xl font-mono font-bold text-red-500">
              {formatTime(countdown)}
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={content.onSecondary}
            className="flex-1"
          >
            {content.secondaryAction}
          </Button>
          <Button
            onClick={content.onPrimary}
            className="flex-1"
            variant={type === 'timeout' ? 'default' : 'secondary'}
          >
            {content.primaryAction}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
