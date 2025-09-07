import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { buildApiUrl } from '../config/api';

interface SessionStatus {
  valid: boolean;
  expiresAt?: string;
  timeoutMinutes: number;
  hasOtherDevice: boolean;
}

export const useEnhancedSessionMonitor = () => {
  const { user, logout } = useAuth();
  const sessionCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const lastActivity = useRef<number>(Date.now());
  
  // Modal states
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [showMultiDeviceModal, setShowMultiDeviceModal] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [modalType, setModalType] = useState<'timeout' | 'multiDevice' | 'expired'>('timeout');

  // Check session status
  const checkSessionStatus = useCallback(async () => {
    if (!user) return;

    try {
      // Get the correct token based on user type
      const guestToken = localStorage.getItem('guest_token');
      const verifiedToken = localStorage.getItem('verified_token');
      const authToken = localStorage.getItem('auth_token');
      
      const token = guestToken || verifiedToken || authToken;
      
      if (!token) {
        console.log('No token found for session check');
        return;
      }

      const response = await fetch(buildApiUrl('session/status'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Session expired
          setModalType('expired');
          setShowExpiredModal(true);
          return;
        }
        return;
      }

      const data = await response.json();
      const sessionStatus: SessionStatus = data.session;

      if (!sessionStatus.valid) {
        // Session is invalid
        setModalType('expired');
        setShowExpiredModal(true);
        return;
      }

      // Check for multi-device login
      if (sessionStatus.hasOtherDevice) {
        setModalType('multiDevice');
        setShowMultiDeviceModal(true);
        return;
      }

      // Check for timeout warning (5 minutes before expiry)
      if (sessionStatus.expiresAt) {
        const expiryTime = new Date(sessionStatus.expiresAt).getTime();
        const now = Date.now();
        const timeUntilExpiry = Math.floor((expiryTime - now) / 1000); // seconds
        
        if (timeUntilExpiry <= 300 && timeUntilExpiry > 0) { // 5 minutes warning
          setTimeRemaining(timeUntilExpiry);
          setModalType('timeout');
          setShowTimeoutModal(true);
        }
      }

      // Update last activity
      lastActivity.current = Date.now();
    } catch (error) {
      console.error('Session check failed:', error);
    }
  }, [user]);

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
      setModalType('expired');
      setShowExpiredModal(true);
    }
  }, [user]);

  // Extend session
  const extendSession = useCallback(async () => {
    try {
      // The session is automatically extended when we make any authenticated request
      await checkSessionStatus();
      setShowTimeoutModal(false);
    } catch (error) {
      console.error('Failed to extend session:', error);
      logout();
    }
  }, [checkSessionStatus, logout]);

  // Handle logout
  const handleLogout = useCallback(() => {
    setShowTimeoutModal(false);
    setShowMultiDeviceModal(false);
    setShowExpiredModal(false);
    logout();
  }, [logout]);

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setShowTimeoutModal(false);
    setShowMultiDeviceModal(false);
    setShowExpiredModal(false);
  }, []);

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
    // Modal states
    showTimeoutModal,
    showMultiDeviceModal,
    showExpiredModal,
    modalType,
    timeRemaining,
    
    // Actions
    extendSession,
    handleLogout,
    handleModalClose,
    
    // Utility functions
    checkSessionStatus,
    handleUserActivity,
  };
};
