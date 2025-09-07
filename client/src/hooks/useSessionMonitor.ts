import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { buildApiUrl } from '../config/api';

interface SessionStatus {
  valid: boolean;
  expiresAt?: string;
  timeoutMinutes: number;
  hasOtherDevice: boolean;
}

export const useSessionMonitor = () => {
  const { user, logout } = useAuth();
  const sessionCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const lastActivity = useRef<number>(Date.now());

  // Check session status
  const checkSessionStatus = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch(buildApiUrl('/session/status'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Session expired
          logout();
          return;
        }
        return;
      }

      const data = await response.json();
      const sessionStatus: SessionStatus = data.session;

      if (!sessionStatus.valid) {
        // Session is invalid
        logout();
        return;
      }

      // Check for multi-device login
      if (sessionStatus.hasOtherDevice) {
        // Show warning about other device login
        const shouldLogout = window.confirm(
          'You have been logged in on another device. Would you like to log out from this device?'
        );
        if (shouldLogout) {
          logout();
          return;
        }
      }

      // Update last activity
      lastActivity.current = Date.now();
    } catch (error) {
      console.error('Session check failed:', error);
    }
  }, [user, logout]);

  // Handle user activity
  const handleUserActivity = useCallback(() => {
    lastActivity.current = Date.now();
  }, []);

  // Check for inactivity timeout
  const checkInactivity = useCallback(() => {
    if (!user) return;

    const now = Date.now();
    const inactiveTime = now - lastActivity.current;
    const timeoutMinutes = 30; // 30 minutes timeout
    const timeoutMs = timeoutMinutes * 60 * 1000;

    if (inactiveTime > timeoutMs) {
      // User has been inactive for too long
      alert('You have been inactive for too long. Please log in again.');
      logout();
    }
  }, [user, logout]);

  useEffect(() => {
    if (!user) {
      // Clear interval if no user
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
        sessionCheckInterval.current = null;
      }
      return;
    }

    // Check session status every 30 seconds
    sessionCheckInterval.current = setInterval(checkSessionStatus, 30000);

    // Check for inactivity every minute
    const inactivityInterval = setInterval(checkInactivity, 60000);

    // Add event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });

    return () => {
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
      }
      clearInterval(inactivityInterval);
      
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });
    };
  }, [user, checkSessionStatus, checkInactivity, handleUserActivity]);

  return {
    checkSessionStatus,
    handleUserActivity,
  };
};
