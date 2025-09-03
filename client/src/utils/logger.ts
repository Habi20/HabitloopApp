// Centralized logging utility for easy production control
interface LoggerConfig {
  enabled: boolean;
  level: 'debug' | 'info' | 'warn' | 'error' | 'none';
  includeTimestamp: boolean;
  includeContext: boolean;
}

class Logger {
  private config: LoggerConfig = {
    enabled: true,
    level: 'info',
    includeTimestamp: true,
    includeContext: true
  };

  private levels = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    none: 4
  };

  // Toggle all console logs on/off
  toggleLogs(enabled: boolean) {
    this.config.enabled = enabled;
    if (!enabled) {
      console.log = () => {};
      console.info = () => {};
      console.warn = () => {};
      console.error = () => {};
      console.debug = () => {};
    } else {
      // Restore original console methods
      this.restoreConsole();
    }
  }

  // Set log level
  setLevel(level: LoggerConfig['level']) {
    this.config.level = level;
  }

  // Enable/disable timestamps
  setTimestamp(enabled: boolean) {
    this.config.includeTimestamp = enabled;
  }

  // Enable/disable context
  setContext(enabled: boolean) {
    this.config.includeContext = enabled;
  }

  private shouldLog(level: string): boolean {
    return this.config.enabled && 
           this.levels[level as keyof typeof this.levels] >= this.levels[this.config.level];
  }

  private formatMessage(level: string, message: string, context?: string): string {
    const parts: string[] = [];
    
    if (this.config.includeTimestamp) {
      parts.push(`[${new Date().toISOString()}]`);
    }
    
    parts.push(`[${level.toUpperCase()}]`);
    
    if (this.config.includeContext && context) {
      parts.push(`[${context}]`);
    }
    
    parts.push(message);
    
    return parts.join(' ');
  }

  debug(message: string, context?: string) {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: string) {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: string) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  error(message: string, context?: string) {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, context));
    }
  }

  // Quick toggle for development
  devMode(enabled: boolean) {
    if (enabled) {
      this.toggleLogs(true);
      this.setLevel('debug');
      this.setTimestamp(true);
      this.setContext(true);
    } else {
      this.toggleLogs(false);
    }
  }

  // Production mode
  productionMode() {
    this.toggleLogs(false);
  }

  private restoreConsole() {
    // Store original console methods if not already stored
    if (!(console as any)._original) {
      (console as any)._original = {
        log: console.log,
        info: console.info,
        warn: console.warn,
        error: console.error,
        debug: console.debug
      };
    }
    
    // Restore original methods
    console.log = (console as any)._original.log;
    console.info = (console as any)._original.info;
    console.warn = (console as any)._original.warn;
    console.error = (console as any)._original.error;
    console.debug = (console as any)._original.debug;
  }
}

// Export singleton instance
export const logger = new Logger();

// Quick access functions
export const log = {
  debug: (msg: string, ctx?: string) => logger.debug(msg, ctx),
  info: (msg: string, ctx?: string) => logger.info(msg, ctx),
  warn: (msg: string, ctx?: string) => logger.warn(msg, ctx),
  error: (msg: string, ctx?: string) => logger.error(msg, ctx),
  toggle: (enabled: boolean) => logger.toggleLogs(enabled),
  dev: () => logger.devMode(true),
  prod: () => logger.productionMode()
};

// Environment-based auto-configuration
if (import.meta.env.PROD) {
  logger.productionMode();
} else {
  logger.devMode(true);
}
