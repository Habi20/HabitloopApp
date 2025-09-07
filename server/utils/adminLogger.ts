// Admin Logger Utility for Global Log Control
declare global {
  var logsEnabled: boolean;
  var logLevel: string;
}

// Initialize global log settings
if (typeof global.logsEnabled === 'undefined') {
  global.logsEnabled = true;
}
if (typeof global.logLevel === 'undefined') {
  global.logLevel = 'info';
}

// Store original console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Admin-controlled logging functions
export const adminLog = {
  log: (...args: any[]) => {
    if (global.logsEnabled) {
      originalConsoleLog(...args);
    }
  },
  
  error: (...args: any[]) => {
    if (global.logsEnabled) {
      originalConsoleError(...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (global.logsEnabled) {
      originalConsoleWarn(...args);
    }
  }
};

// Override console methods globally
export const overrideConsole = () => {
  console.log = adminLog.log;
  console.error = adminLog.error;
  console.warn = adminLog.warn;
};

// Get current log status
export const getLogStatus = () => ({
  enabled: global.logsEnabled,
  level: global.logLevel
});

// Set log status
export const setLogStatus = (enabled: boolean, level: string = 'info') => {
  global.logsEnabled = enabled;
  global.logLevel = level;
  originalConsoleLog(`🔧 Admin Log Control: ${enabled ? 'ENABLED' : 'DISABLED'} (Level: ${level})`);
};

// Initialize console override
overrideConsole();
