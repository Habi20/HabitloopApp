import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

// Enhanced Theme Types
export type Theme = 'light' | 'dark' | 'system';

// Professional Color Systems
export const themeColors = {
  light: {
    // Primary colors - Sophisticated neutral palette
    primary: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
    },
    // Background colors - Clean & Modern
    background: {
      primary: '#FFFFFF',
      secondary: '#F8FAFC',
      tertiary: '#F1F5F9',
      card: '#FFFFFF',
      cardHover: '#F8FAFC',
      overlay: 'rgba(0, 0, 0, 0.5)',
    },
    // Text colors - High contrast for accessibility
    text: {
      primary: '#0F172A',
      secondary: '#334155',
      tertiary: '#64748B',
      muted: '#94A3B8',
      inverse: '#FFFFFF',
    },
    // Border colors - Subtle but visible
    border: {
      primary: '#E2E8F0',
      secondary: '#CBD5E1',
      focus: '#3B82F6',
      error: '#EF4444',
    },
    // Accent colors - Professional palette
    accent: {
      primary: '#3B82F6',    // Blue
      secondary: '#8B5CF6',  // Purple
      success: '#10B981',    // Green
      warning: '#F59E0B',    // Amber
      error: '#EF4444',      // Red
    },
    // Interactive states
    interactive: {
      hover: '#F1F5F9',
      active: '#E2E8F0',
      disabled: '#F1F5F9',
      focus: '#DBEAFE',
    },
  },
  dark: {
    // Primary colors - Premium & Eye-friendly
    primary: {
      50: '#0D1117',
      100: '#161B22',
      200: '#21262D',
      300: '#30363D',
      400: '#484F58',
      500: '#7D8590',
      600: '#9CA3AF',
      700: '#C9D1D9',
      800: '#E6EDF3',
      900: '#F0F6FC',
    },
    // Background colors - GitHub-inspired
    background: {
      primary: '#0D1117',
      secondary: '#161B22',
      tertiary: '#21262D',
      card: '#21262D',
      cardHover: '#30363D',
      overlay: 'rgba(1, 4, 9, 0.8)',
    },
    // Text colors - High contrast whites
    text: {
      primary: '#F0F6FC',
      secondary: '#E6EDF3',
      tertiary: '#7D8590',
      muted: '#484F58',
      inverse: '#0D1117',
    },
    // Border colors - Visible but not harsh
    border: {
      primary: '#30363D',
      secondary: '#484F58',
      focus: '#58A6FF',
      error: '#F85149',
    },
    // Accent colors - Slightly desaturated
    accent: {
      primary: '#58A6FF',    // Blue
      secondary: '#A371F7',  // Purple
      success: '#3FB950',    // Green
      warning: '#D29922',    // Amber
      error: '#F85149',      // Red
    },
    // Interactive states
    interactive: {
      hover: '#21262D',
      active: '#30363D',
      disabled: '#21262D',
      focus: '#1F6FEB',
    },
  },
};

// Enhanced Theme Configuration Interface
export interface ThemeConfig {
  id: string;
  name: string;
  displayName: string;
  description: string;
  preview: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  colors: typeof themeColors.light;
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      xxl: string;
    };
    fontWeight: {
      normal: string;
      medium: string;
      semibold: string;
      bold: string;
    };
    lineHeight: {
      tight: string;
      normal: string;
      relaxed: string;
    };
  };
}

// Theme configurations
export const themeConfigs: Record<'light' | 'dark', ThemeConfig> = {
  light: {
    id: 'light',
    name: 'light',
    displayName: 'Light',
    description: 'Clean and modern interface',
    preview: {
      primary: '#0F172A',
      secondary: '#334155',
      accent: '#3B82F6',
      background: '#FFFFFF',
    },
    colors: themeColors.light,
    shadows: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
    },
    borderRadius: {
      sm: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
    },
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        xxl: '1.5rem',
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      lineHeight: {
        tight: '1.25',
        normal: '1.5',
        relaxed: '1.75',
      },
    },
  },
  dark: {
    id: 'dark',
    name: 'dark',
    displayName: 'Dark',
    description: 'Premium and eye-friendly',
    preview: {
      primary: '#F0F6FC',
      secondary: '#7D8590',
      accent: '#58A6FF',
      background: '#0D1117',
    },
    colors: themeColors.dark,
    shadows: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
    },
    borderRadius: {
      sm: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
    },
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        xxl: '1.5rem',
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      lineHeight: {
        tight: '1.25',
        normal: '1.5',
        relaxed: '1.75',
      },
    },
  },
};

// Enhanced Theme Context Interface
interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  colors: typeof themeColors.light;
  config: ThemeConfig;
  isSystemTheme: boolean;
  isLoading: boolean;
  error: string | null;
  // Advanced features
  toggleTheme: () => void;
  getThemeConfig: (theme: 'light' | 'dark') => ThemeConfig;
  validateTheme: (theme: Theme) => boolean;
}

// Create context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme Provider Component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [isSystemTheme, setIsSystemTheme] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load theme from localStorage on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('habitloop-theme') as Theme;
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setTheme(savedTheme);
      }
    } catch (err) {
      console.error('Failed to load theme from localStorage:', err);
      setError('Failed to load theme preferences');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle system theme detection
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        setResolvedTheme(e.matches ? 'dark' : 'light');
        setIsSystemTheme(true);
      }
    };

    // Set initial system theme
    if (theme === 'system') {
      setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
      setIsSystemTheme(true);
    } else {
      setResolvedTheme(theme);
      setIsSystemTheme(false);
    }

    // Listen for system theme changes
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [theme]);

  // Update resolved theme when theme changes
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
      setIsSystemTheme(true);
    } else {
      setResolvedTheme(theme);
      setIsSystemTheme(false);
    }
  }, [theme]);

  // Apply theme to document with smooth transitions
  useEffect(() => {
    const root = document.documentElement;
    
    // Add transition class for smooth theme switching
    root.classList.add('theme-transition');
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    // Add current theme class
    root.classList.add(resolvedTheme);
    
    // Apply CSS custom properties
    const colors = themeColors[resolvedTheme];
    Object.entries(colors).forEach(([category, colorSet]) => {
      Object.entries(colorSet).forEach(([shade, color]) => {
        root.style.setProperty(`--color-${category}-${shade}`, color);
      });
    });

    // Remove transition class after animation
    const timer = setTimeout(() => {
      root.classList.remove('theme-transition');
    }, 300);

    return () => clearTimeout(timer);
  }, [resolvedTheme]);

  // Save theme to localStorage with error handling
  const handleSetTheme = (newTheme: Theme) => {
    try {
      setTheme(newTheme);
      localStorage.setItem('habitloop-theme', newTheme);
      setError(null);
    } catch (err) {
      console.error('Failed to save theme to localStorage:', err);
      setError('Failed to save theme preferences');
    }
  };

  // Enhanced theme functions
  const toggleTheme = () => {
    const newTheme = resolvedTheme === 'light' ? 'dark' : 'light';
    handleSetTheme(newTheme);
  };

  const getThemeConfig = (theme: 'light' | 'dark'): ThemeConfig => {
    return themeConfigs[theme];
  };

  const validateTheme = (theme: Theme): boolean => {
    return ['light', 'dark', 'system'].includes(theme);
  };

  // Memoized values for performance
  const colors = useMemo(() => themeColors[resolvedTheme], [resolvedTheme]);
  const config = useMemo(() => themeConfigs[resolvedTheme], [resolvedTheme]);

  const value: ThemeContextType = {
    theme,
    resolvedTheme,
    setTheme: handleSetTheme,
    colors,
    config,
    isSystemTheme,
    isLoading,
    error,
    toggleTheme,
    getThemeConfig,
    validateTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Enhanced Theme Toggle Component
export const ThemeToggle: React.FC = () => {
  const { theme, setTheme, isLoading } = useTheme();

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-5 h-5 rounded-full bg-gray-200 animate-pulse"></div>
        <div className="w-5 h-5 rounded-full bg-gray-200 animate-pulse"></div>
        <div className="w-5 h-5 rounded-full bg-gray-200 animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => setTheme('light')}
        className={`p-2 rounded-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          theme === 'light'
            ? 'bg-accent-primary/10 text-accent-primary ring-accent-primary/20'
            : 'bg-background-tertiary text-text-secondary hover:bg-interactive-hover hover:text-text-primary'
        }`}
        title="Light theme"
        aria-label="Switch to light theme"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      </button>
      
      <button
        onClick={() => setTheme('dark')}
        className={`p-2 rounded-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          theme === 'dark'
            ? 'bg-accent-primary/10 text-accent-primary ring-accent-primary/20'
            : 'bg-background-tertiary text-text-secondary hover:bg-interactive-hover hover:text-text-primary'
        }`}
        title="Dark theme"
        aria-label="Switch to dark theme"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      </button>
      
      <button
        onClick={() => setTheme('system')}
        className={`p-2 rounded-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          theme === 'system'
            ? 'bg-accent-primary/10 text-accent-primary ring-accent-primary/20'
            : 'bg-background-tertiary text-text-secondary hover:bg-interactive-hover hover:text-text-primary'
        }`}
        title="System theme"
        aria-label="Use system theme"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};
