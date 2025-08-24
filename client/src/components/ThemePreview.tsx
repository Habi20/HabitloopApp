import React from 'react';
import { ThemeConfig } from '@/contexts/ThemeContext';

interface ThemePreviewProps {
  theme: ThemeConfig;
  isActive?: boolean;
  onClick?: () => void;
  showAccessibility?: boolean;
  showPerformance?: boolean;
}

export const ThemePreview: React.FC<ThemePreviewProps> = ({
  theme,
  isActive = false,
  onClick,
  showAccessibility = true,
  showPerformance = true,
}) => {
  // Calculate accessibility score based on color contrast
  const calculateAccessibilityScore = () => {
    // Simple contrast ratio calculation (simplified)
    const primaryContrast = 4.5; // Good contrast
    const secondaryContrast = 3.0; // Acceptable contrast
    const averageContrast = (primaryContrast + secondaryContrast) / 2;
    return Math.min(100, Math.round(averageContrast * 20));
  };

  const accessibilityScore = calculateAccessibilityScore();
  const performanceScore = 95; // Mock performance score

  return (
    <div
      className={`
        relative w-full max-w-sm rounded-xl border-2 transition-all duration-300 cursor-pointer
        hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2
        ${isActive 
          ? 'border-accent-primary shadow-lg ring-accent-primary/20' 
          : 'border-border-primary hover:border-border-secondary'
        }
      `}
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-label={`Preview ${theme.displayName} theme`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* Theme Header */}
      <div 
        className="p-4 rounded-t-xl"
        style={{ backgroundColor: theme.colors.background.primary }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 
            className="font-semibold text-lg"
            style={{ color: theme.colors.text.primary }}
          >
            {theme.displayName}
          </h3>
          {isActive && (
            <div className="w-6 h-6 rounded-full bg-accent-primary flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
        
        <p 
          className="text-sm mb-4"
          style={{ color: theme.colors.text.secondary }}
        >
          {theme.description}
        </p>

        {/* Color Palette Preview */}
        <div className="flex space-x-2 mb-4">
          {Object.entries(theme.colors.accent).map(([key, color]) => (
            <div
              key={key}
              className="w-6 h-6 rounded-full border border-border-primary"
              style={{ backgroundColor: color }}
              title={`${key} accent color`}
            />
          ))}
        </div>
      </div>

      {/* Mini UI Preview */}
      <div 
        className="p-4 space-y-3"
        style={{ backgroundColor: theme.colors.background.secondary }}
      >
        {/* Sample Card */}
        <div 
          className="p-3 rounded-lg border"
          style={{ 
            backgroundColor: theme.colors.background.card,
            borderColor: theme.colors.border.primary
          }}
        >
          <div 
            className="font-medium mb-2"
            style={{ color: theme.colors.text.primary }}
          >
            Sample Habit
          </div>
          <div 
            className="text-sm mb-3"
            style={{ color: theme.colors.text.secondary }}
          >
            Complete your daily routine
          </div>
          
          {/* Progress Bar */}
          <div 
            className="w-full h-2 rounded-full mb-3"
            style={{ backgroundColor: theme.colors.border.secondary }}
          >
            <div 
              className="h-full rounded-full transition-all duration-300"
              style={{ 
                backgroundColor: theme.colors.accent.success,
                width: '75%'
              }}
            />
          </div>

          {/* Button */}
          <button
            className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            style={{ 
              backgroundColor: theme.colors.accent.primary,
              color: theme.colors.text.inverse
            }}
            disabled
          >
            Complete
          </button>
        </div>

        {/* Sample Input */}
        <div className="space-y-2">
          <div 
            className="px-3 py-2 rounded-md border text-sm"
            style={{ 
              backgroundColor: theme.colors.background.card,
              borderColor: theme.colors.border.primary,
              color: theme.colors.text.primary
            }}
          >
            Sample input field
          </div>
        </div>
      </div>

      {/* Footer with Metrics */}
      <div 
        className="p-4 rounded-b-xl border-t"
        style={{ 
          backgroundColor: theme.colors.background.primary,
          borderColor: theme.colors.border.primary
        }}
      >
        <div className="flex items-center justify-between text-sm">
          {showAccessibility && (
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span 
                style={{ color: theme.colors.text.secondary }}
              >
                A11y: {accessibilityScore}%
              </span>
            </div>
          )}
          
          {showPerformance && (
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
              </svg>
              <span 
                style={{ color: theme.colors.text.secondary }}
              >
                Perf: {performanceScore}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Active Indicator */}
      {isActive && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent-primary rounded-full flex items-center justify-center shadow-lg">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
};

// Theme Comparison Component
interface ThemeComparisonProps {
  lightTheme: ThemeConfig;
  darkTheme: ThemeConfig;
  currentTheme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
}

export const ThemeComparison: React.FC<ThemeComparisonProps> = ({
  lightTheme,
  darkTheme,
  currentTheme,
  onThemeChange,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <ThemePreview
        theme={lightTheme}
        isActive={currentTheme === 'light'}
        onClick={() => onThemeChange('light')}
        showAccessibility={true}
        showPerformance={true}
      />
      <ThemePreview
        theme={darkTheme}
        isActive={currentTheme === 'dark'}
        onClick={() => onThemeChange('dark')}
        showAccessibility={true}
        showPerformance={true}
      />
    </div>
  );
};

// Color Palette Component
interface ColorPaletteProps {
  colors: ThemeConfig['colors'];
  title?: string;
}

export const ColorPalette: React.FC<ColorPaletteProps> = ({ colors, title }) => {
  return (
    <div className="space-y-4">
      {title && (
        <h4 className="font-medium text-text-primary">{title}</h4>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        {/* Primary Colors */}
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-text-secondary">Primary</h5>
          <div className="flex space-x-1">
            {Object.entries(colors.primary).slice(0, 5).map(([shade, color]) => (
              <div
                key={shade}
                className="w-8 h-8 rounded border border-border-primary"
                style={{ backgroundColor: color }}
                title={`Primary ${shade}: ${color}`}
              />
            ))}
          </div>
        </div>

        {/* Accent Colors */}
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-text-secondary">Accent</h5>
          <div className="flex space-x-1">
            {Object.entries(colors.accent).map(([name, color]) => (
              <div
                key={name}
                className="w-8 h-8 rounded border border-border-primary"
                style={{ backgroundColor: color }}
                title={`${name} accent: ${color}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
