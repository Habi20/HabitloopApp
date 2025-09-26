// API Configuration
// This file manages the base URL for API calls

// Determine the API base URL based on environment
const getApiBaseUrl = () => {
  // Check if we're in development mode (localhost)
  const isDev = import.meta.env.DEV;
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  // Development: Use local backend via Vite proxy
  if (isDev && isLocalhost) {
    return '/api';
  }
  
  // Production: Use Railway backend
  return 'https://habitloopapp-development.up.railway.app/api';
};

export const API_BASE_URL = getApiBaseUrl();

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

// Environment check helpers
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;

// Debug logging
console.log('🔍 API Config Debug:', {
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  hostname: window.location.hostname,
  isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
  apiBaseUrl: API_BASE_URL,
  currentUrl: window.location.href
});
