// Simple toggle for console logs - just change this value
export const ENABLE_LOGS = true; // Set to false to disable all console logs

// Import and configure logger
import { logger } from './logger';

// Auto-configure based on toggle
if (!ENABLE_LOGS) {
  logger.productionMode();
  console.log('🔇 Console logs disabled');
} else {
  logger.devMode(true);
  console.log('🔊 Console logs enabled');
}

// Quick functions for runtime control
export const toggleLogs = (enabled: boolean) => {
  if (enabled) {
    logger.devMode(true);
    console.log('🔊 Console logs enabled');
  } else {
    logger.productionMode();
    console.log('🔇 Console logs disabled');
  }
};

// Usage in components:
// import { log } from '@/utils/logger';
// log.info('User logged in', 'Auth');
// log.error('API call failed', 'API');
