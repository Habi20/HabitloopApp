import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContextType, User } from '@/types';
import { apiRequest } from '../lib/queryClient';

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Sync state with localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      checkAuthStatus();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also check localStorage immediately if user state is null
    const checkLocalStorage = () => {
      const verifiedUser = localStorage.getItem('verifiedUser');
      const guestUser = localStorage.getItem('guestUser');
      const authUser = localStorage.getItem('authUser');
      
      if (verifiedUser && !user?.id) {
        try {
          const userData = JSON.parse(verifiedUser);
          if (userData && userData.id) {
            setUser(userData);
            setIsAuthenticated(true);
            console.log('🔐 AuthContext: Verified user synced from localStorage:', userData.firstName);
          }
        } catch (error) {
          console.warn('Failed to parse verified user from localStorage:', error);
        }
      } else if (guestUser && !user?.id) {
        try {
          const userData = JSON.parse(guestUser);
          if (userData && userData.id) {
            setUser(userData);
            setIsAuthenticated(true);
            console.log('🔐 AuthContext: Guest user synced from localStorage:', userData.firstName);
          }
        } catch (error) {
          console.warn('Failed to parse guest user from localStorage:', error);
        }
      } else if (authUser && !user?.id) {
        try {
          const userData = JSON.parse(authUser);
          if (userData && userData.id) {
            setUser(userData);
            setIsAuthenticated(true);
            console.log('🔐 AuthContext: Auth user synced from localStorage:', userData.firstName);
          }
        } catch (error) {
          console.warn('Failed to parse auth user from localStorage:', error);
        }
      }
    };
    
    checkLocalStorage();
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user?.id]);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      
                      // Step 1: Check for stored user data first (avoid unnecessary API calls)
                const storedGuestUser = localStorage.getItem('guestUser');
                const storedVerifiedUser = localStorage.getItem('verifiedUser');
                const storedAuthUser = localStorage.getItem('authUser');
                
                if (storedGuestUser) {
                  try {
                    const guestUser = JSON.parse(storedGuestUser);
                    if (guestUser && guestUser.isGuest && guestUser.id) {
                      setUser(guestUser);
                      setIsAuthenticated(true);
                      setIsLoading(false);
                      return;
                    }
                  } catch (error) {
                    console.warn('Failed to parse stored guest user:', error);
                    localStorage.removeItem('guestUser');
                  }
                }
                
                if (storedVerifiedUser) {
                  try {
                    const verifiedUser = JSON.parse(storedVerifiedUser);
                    if (verifiedUser && !verifiedUser.isGuest && verifiedUser.id) {
                      setUser(verifiedUser);
                      setIsAuthenticated(true);
                      setIsLoading(false);
                      return;
                    }
                  } catch (error) {
                    console.warn('Failed to parse stored verified user:', error);
                    localStorage.removeItem('verifiedUser');
                  }
                }
                
                if (storedAuthUser) {
                  try {
                    const authUser = JSON.parse(storedAuthUser);
                    if (authUser && !authUser.isGuest && authUser.id) {
                      setUser(authUser);
                      setIsAuthenticated(true);
                      setIsLoading(false);
                      return;
                    }
                  } catch (error) {
                    console.warn('Failed to parse stored auth user:', error);
                    localStorage.removeItem('authUser');
                  }
                }
      
      // Step 2: Check for JWT tokens (only if no stored data)
      const guestToken = localStorage.getItem('guest_token');
      const verifiedToken = localStorage.getItem('verified_token');
      
      if (guestToken) {
        try {
          const response = await fetch('/api/guest/verify', {
            headers: { 'Authorization': `Bearer ${guestToken}` }
          });
          
          if (response.ok) {
            const { user: userData } = await response.json();
            if (userData && userData.id) {
              setUser(userData);
              setIsAuthenticated(true);
              setIsLoading(false);
              return;
            }
          }
        } catch (error) {
          console.warn('Guest token verification failed:', error);
        }
        
        // Clear invalid guest token
        localStorage.removeItem('guest_token');
        localStorage.removeItem('guestUser');
      }
      
      if (verifiedToken) {
        try {
          const response = await fetch('/api/guest/verify', {
            headers: { 'Authorization': `Bearer ${verifiedToken}` }
          });
          
          if (response.ok) {
            const { user: userData } = await response.json();
            if (userData && userData.id) {
              setUser(userData);
              setIsAuthenticated(true);
              setIsLoading(false);
              return;
            }
          }
        } catch (error) {
          console.warn('Verified token verification failed:', error);
        }
        
        // Clear invalid verified token
        localStorage.removeItem('verified_token');
        localStorage.removeItem('verifiedUser');
      }

      // Step 3: Check for authenticated Supabase session (only if no stored data)
      const authToken = localStorage.getItem('auth_token');
      if (authToken) {
        try {
          const response = await fetch('/api/auth/user', {
            credentials: 'include',
          });
          
          if (response.ok) {
            const userData = await response.json();
            if (userData && userData.id) {
              // Ensure this is not marked as guest
              const authenticatedUser = {
                ...userData,
                isGuest: false
              };
              setUser(authenticatedUser);
              setIsAuthenticated(true);
              setIsLoading(false);
              return;
            }
          }
        } catch (error) {
          console.warn('Authenticated session check failed:', error);
        }
      }

      // No valid session found
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      if (response.ok && data.user) {
        // Clear any guest data when authenticating
        localStorage.removeItem('guest_token');
        localStorage.removeItem('guestUser');
        
        // Store authenticated user data based on user type
        const authenticatedUser = {
          id: data.user.id,
          email: data.user.email,
          firstName: data.user.firstName || data.user.first_name,
          lastName: data.user.lastName || data.user.last_name,
          level: data.user.level || 1,
          xp: data.user.xp || 0,
          role: data.user.role || 'user',
          isGuest: false,
          difficulty: data.user.difficulty || 'medium',
          profileImageUrl: data.user.profileImageUrl || data.user.profile_image_url
        };
        
        // Store auth user data
        localStorage.setItem('authUser', JSON.stringify(authenticatedUser));
        
        setUser(authenticatedUser);
        setIsAuthenticated(true);
        
        // Store session token if available
        if (data.session?.access_token) {
          localStorage.setItem('auth_token', data.session.access_token);
        }
      } else {
        throw new Error(data.error?.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const loginAsGuest = async (userData?: any) => {
    console.log('🔐 AuthContext: loginAsGuest called with:', {
      hasUserData: !!userData,
      userDataKeys: userData ? Object.keys(userData) : [],
      userData: userData ? JSON.stringify(userData, null, 2) : 'undefined'
    });
    
    let user: User;
    
    if (userData && userData.user && userData.user.id) {
      // Use provided user data (from backend)
      const userInfo = userData.user;
      const isActuallyGuest = userInfo.isGuest || 
                             userInfo.role === 'guest' || 
                             userInfo.email?.includes('@guest.local');
      
      user = {
        id: userInfo.id,
        email: userInfo.email || '',
        firstName: userInfo.firstName || userInfo.first_name || 'Guest',
        lastName: userInfo.lastName || userInfo.last_name || 'User',
        level: userInfo.level || 1,
        xp: userInfo.xp || 0,
        role: userInfo.role || 'guest',
        isGuest: isActuallyGuest,
        difficulty: userInfo.difficulty || 'medium',
        profileImageUrl: userInfo.profileImageUrl || userInfo.profile_image_url
      };
      
      console.log('🔐 AuthContext: Processing user data:', {
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        isGuest: user.isGuest,
        email: user.email,
        role: user.role
      });

      // Store JWT token and user data based on user type
      if (userData.token && user.id) {
        console.log('🔐 AuthContext: Token and user ID present, storing data...');
        console.log('🔐 AuthContext: isActuallyGuest:', isActuallyGuest);
        console.log('🔐 AuthContext: Token length:', userData.token.length);
        
        if (isActuallyGuest) {
          // Guest user - store as guest
          localStorage.setItem('guest_token', userData.token);
          localStorage.setItem('guestUser', JSON.stringify(user));
          localStorage.removeItem('verified_token');
          localStorage.removeItem('verifiedUser');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('authUser');
          console.log('🔐 AuthContext: Stored as guest user');
        } else {
          // JWT-based authenticated user - store as verified
          localStorage.setItem('verified_token', userData.token);
          localStorage.setItem('verifiedUser', JSON.stringify(user));
          localStorage.removeItem('guest_token');
          localStorage.removeItem('guestUser');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('authUser');
          console.log('🔐 AuthContext: Stored as verified user');
          console.log('🔐 AuthContext: verifiedUser stored:', JSON.stringify(user, null, 2));
        }
      } else {
        console.warn('🔐 AuthContext: Missing token or user ID!');
        console.warn('🔐 AuthContext: userData.token:', !!userData.token);
        console.warn('🔐 AuthContext: user.id:', !!user.id);
      }
    } else {
      // Create temporary guest user (quick mode)
      user = {
        id: `temp-guest-${Date.now()}`,
        email: '',
        firstName: 'Guest',
        lastName: 'User',
        level: 1,
        xp: 0,
        role: 'guest',
        isGuest: true,
        difficulty: 'medium'
      };
      
      // Store temporary guest data (always as guest, never as verified)
      localStorage.setItem('guestUser', JSON.stringify(user));
      localStorage.removeItem('verified_token');
      localStorage.removeItem('verifiedUser');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('authUser');
    }
    
    setUser(user);
    setIsAuthenticated(true);
    
    console.log('🔐 AuthContext: User state updated:', {
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      isGuest: user.isGuest,
      storageKey: user.isGuest ? 'guestUser' : 'verifiedUser'
    });
  };

  const loginAsHabitLoopUser = async (userData: any) => {
    try {
      console.log('🔐 AuthContext: loginAsHabitLoopUser called with:', userData.id);
      
      const response = await apiRequest('/api/habitloop/signin', 'POST', { userId: userData.id });
      const userDataResponse = await response.json();
      
      console.log('🔐 AuthContext: HabitLoop login response:', {
        success: userDataResponse.success,
        hasUser: !!userDataResponse.user,
        hasToken: !!userDataResponse.token
      });

      if (userDataResponse.success && userDataResponse.user && userDataResponse.token) {
        const user = {
          id: userDataResponse.user.id,
          email: userDataResponse.user.email,
          firstName: userDataResponse.user.firstName,
          lastName: userDataResponse.user.lastName,
          level: userDataResponse.user.level,
          xp: userDataResponse.user.xp,
          role: userDataResponse.user.role,
          isGuest: false,
          difficulty: userDataResponse.user.difficulty,
          profileImageUrl: userDataResponse.user.profileImageUrl
        };

        // HabitLoop users should ONLY use verifiedUser storage (no guestUser)
        localStorage.setItem('verified_token', userDataResponse.token);
        localStorage.setItem('verifiedUser', JSON.stringify(user));
        
        // Clear any guest data to prevent conflicts
        localStorage.removeItem('guest_token');
        localStorage.removeItem('guestUser');
        
        // Clear any Supabase session data
        localStorage.removeItem('authUser');
        localStorage.removeItem('auth_token');
        
        setUser(user);
        setIsAuthenticated(true);
        
        console.log('🔐 AuthContext: HabitLoop user logged in successfully:', user.firstName);
        console.log('🔐 AuthContext: Stored as verifiedUser only (no guestUser)');
      } else {
        console.error('🔐 AuthContext: HabitLoop login failed - invalid response');
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('🔐 AuthContext: HabitLoop login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('verifiedUser');
    localStorage.removeItem('guestUser');
    localStorage.removeItem('authUser');
    localStorage.removeItem('verified_token');
    localStorage.removeItem('guest_token');
    localStorage.removeItem('auth_token');
    window.location.href = '/';
  };

  // Function to refresh user data from backend
  const refreshUserData = async () => {
    try {
      const guestToken = localStorage.getItem('guest_token');
      const verifiedToken = localStorage.getItem('verified_token');
      const authToken = localStorage.getItem('auth_token');
      
      let token = guestToken || verifiedToken || authToken;
      
      if (!token) {
        console.warn('No token found for user data refresh');
        return;
      }

      console.log('🔐 AuthContext: Refreshing user data with token length:', token.length);

      const response = await fetch('/api/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const responseData = await response.json();
        
        if (responseData.success && responseData.user) {
          const userData = responseData.user;
          setUser(userData);
          setIsAuthenticated(true);
          
          // Update localStorage with fresh data
          if (userData.isGuest) {
            localStorage.setItem('guestUser', JSON.stringify(userData));
          } else {
            localStorage.setItem('verifiedUser', JSON.stringify(userData));
          }
          
          console.log('🔐 AuthContext: User data refreshed from backend:', userData);
          return userData;
        } else {
          console.warn('Invalid response format from /api/auth/user');
          return null;
        }
      } else {
        console.warn('Failed to refresh user data:', response.status, response.statusText);
        
        // Try alternative endpoint for guest users
        if (response.status === 401) {
          console.log('🔐 AuthContext: Trying guest-compatible endpoint...');
          const guestResponse = await fetch('/api/guest/auth', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (guestResponse.ok) {
            const guestData = await guestResponse.json();
            if (guestData.success && guestData.user) {
              // Only create guest user if no verified user exists
              const verifiedUser = localStorage.getItem('verifiedUser');
              if (!verifiedUser) {
                setUser(guestData.user);
                setIsAuthenticated(true);
                localStorage.setItem('guestUser', JSON.stringify(guestData.user));
                console.log('🔐 AuthContext: User data refreshed via guest endpoint:', guestData.user);
                return guestData.user;
              } else {
                console.log('🔐 AuthContext: Verified user exists, skipping guest user creation');
                return null;
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const signup = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, firstName, lastName })
      });

      const data = await response.json();
      
      if (response.ok && data.user) {
        // Clear any guest data when signing up
        localStorage.removeItem('guest_token');
        localStorage.removeItem('guestUser');
        
        // Store authenticated user data based on user type
        const authenticatedUser = {
          id: data.user.id,
          email: data.user.email,
          firstName: data.user.firstName || data.user.first_name,
          lastName: data.user.lastName || data.user.last_name,
          level: data.user.level || 1,
          xp: data.user.xp || 0,
          role: data.user.role || 'user',
          isGuest: false,
          difficulty: data.user.difficulty || 'medium',
          profileImageUrl: data.user.profileImageUrl || data.user.profile_image_url
        };
        
        // Store auth user data
        localStorage.setItem('authUser', JSON.stringify(authenticatedUser));
        
        setUser(authenticatedUser);
        setIsAuthenticated(true);
        
        if (data.session?.access_token) {
          localStorage.setItem('auth_token', data.session.access_token);
        }
      } else {
        throw new Error(data.error?.message || 'Signup failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  // Helper functions for user data
  const getUserDisplayName = (user: User | null): string => {
    if (!user) return '';
    if (user.isGuest) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}`
      : user.email || 'User';
  };

  const getUserEmail = (user: User | null): string => {
    return user?.email || '';
  };

  const getUserInitials = (user: User | null): string => {
    if (!user) return '';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    const email = user.email || '';
    
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName[0].toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  const getCurrentUser = (): User | null => {
    return user;
  };

  const isGuestUser = (): boolean => {
    return user?.isGuest || false;
  };

  const isAuthenticatedUser = (): boolean => {
    return isAuthenticated && !user?.isGuest;
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    loginAsGuest,
    loginAsHabitLoopUser,
    signup,
    isAuthenticated,
    isLoading,
    checkAuthStatus,
    refreshUserData,
    getUserDisplayName,
    getUserEmail,
    getUserInitials,
    getCurrentUser,
    isGuestUser,
    isAuthenticatedUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
