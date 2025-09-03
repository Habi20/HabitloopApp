// Frontend Logger Utility for Admin Control
interface LogSettings {
  enabled: boolean;
  level: string;
}

class FrontendLogger {
  private settings: LogSettings = {
    enabled: true,
    level: 'info'
  };

  private originalConsoleLog = console.log;
  private originalConsoleError = console.error;
  private originalConsoleWarn = console.warn;
  private originalConsoleInfo = console.info;
  private originalConsoleDebug = console.debug;

  constructor() {
    this.overrideConsole();
    this.loadSettings();
  }

  public loadSettings() {
    try {
      const saved = localStorage.getItem('admin_log_settings');
      if (saved) {
        this.settings = JSON.parse(saved);
        this.applySettings();
      }
    } catch (error) {
      console.warn('Failed to load admin log settings:', error);
    }
  }

  private saveSettings() {
    try {
      localStorage.setItem('admin_log_settings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Failed to save admin log settings:', error);
    }
  }

  private overrideConsole() {
    console.log = (...args: any[]) => {
      if (this.settings.enabled) {
        this.originalConsoleLog(...args);
      }
    };

    console.error = (...args: any[]) => {
      if (this.settings.enabled) {
        this.originalConsoleError(...args);
      }
    };

    console.warn = (...args: any[]) => {
      if (this.settings.enabled) {
        this.originalConsoleWarn(...args);
      }
    };

    console.info = (...args: any[]) => {
      if (this.settings.enabled) {
        this.originalConsoleInfo(...args);
      }
    };

    console.debug = (...args: any[]) => {
      if (this.settings.enabled && this.settings.level === 'debug') {
        this.originalConsoleDebug(...args);
      }
    };
  }

  private applySettings() {
    // Re-override console with new settings
    this.overrideConsole();
  }

  public setLogStatus(enabled: boolean, level: string = 'info') {
    this.settings.enabled = enabled;
    this.settings.level = level;
    this.applySettings();
    this.saveSettings();
    
    // Suppress browser network error logs when disabled
    if (!enabled) {
      this.suppressNetworkErrors();
    } else {
      this.restoreNetworkErrors();
    }
    
    // Log the change (this will work even when disabled)
    this.originalConsoleLog(`🔧 Frontend Log Control: ${enabled ? 'ENABLED' : 'DISABLED'} (Level: ${level})`);
  }

  private suppressNetworkErrors() {
    // Override console.error to filter out network error logs
    const originalError = console.error;
    console.error = (...args: any[]) => {
      const message = args.join(' ');
      // Filter out common network error patterns
      if (message.includes('POST') && message.includes('401') && message.includes('Unauthorized')) {
        return; // Don't log network auth errors
      }
      if (message.includes('fetch') && message.includes('401')) {
        return; // Don't log fetch auth errors
      }
      if (this.settings.enabled) {
        originalError(...args);
      }
    };
  }

  private restoreNetworkErrors() {
    // Restore original console.error behavior
    console.error = this.originalConsoleError;
  }

  public getLogStatus(): LogSettings {
    return { ...this.settings };
  }

  public isEnabled(): boolean {
    return this.settings.enabled;
  }
}

// Create global instance
export const frontendLogger = new FrontendLogger();

// Export functions for easy access
export const setFrontendLogStatus = (enabled: boolean, level: string = 'info') => {
  frontendLogger.setLogStatus(enabled, level);
};

export const getFrontendLogStatus = () => {
  return frontendLogger.getLogStatus();
};

// Listen for admin log toggle events
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'admin_log_settings') {
      frontendLogger.loadSettings();
    }
  });
}
