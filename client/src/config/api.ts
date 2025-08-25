// API Configuration
// This file manages the base URL for API calls

// Determine the API base URL based on environment
const getApiBaseUrl = () => {
  // In development, use relative URLs (handled by Vite proxy)
  if (import.meta.env.DEV) {
    return '/api';
  }
  
  // In production, use the Railway backend URL
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
