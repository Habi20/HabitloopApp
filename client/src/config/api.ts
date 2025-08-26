// API Configuration
// This file manages the base URL for API calls

// Determine the API base URL based on environment
const getApiBaseUrl = () => {
  // TEMPORARY: Force local backend for testing
  // Since both local and Railway use the same Supabase database
  return '/api';
  
  // TODO: Re-enable Railway logic after local testing is complete
  // Check for environment variable override first
  // if (typedEnv.apiBaseUrl) {
  //   return typedEnv.apiBaseUrl;
  // }
  
  // Check for local backend flag
  // if (typedEnv.useLocalBackend) {
  //   return '/api';
  // }
  
  // Use development vs production logic
  // if (isDev) {
  //   return '/api';
  // }
  
  // Default: use Railway backend for production
  // return 'https://habitloopapp-development.up.railway.app/api';
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
  apiBaseUrl: API_BASE_URL,
  currentUrl: window.location.href
});
