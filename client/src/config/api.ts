// API Configuration
// This file manages the base URL for API calls

// Always use Railway backend URL since frontend is hosted separately
export const API_BASE_URL = 'https://habitloopapp-development.up.railway.app/api';

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

// Environment check helpers
export const isDevelopment = import.meta.env.DEV;

export const isProduction = import.meta.env.PROD;
