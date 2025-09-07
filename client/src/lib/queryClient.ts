import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { buildApiUrl } from "@/config/api";

// Wrapper to suppress browser network error logs when admin has disabled logs
const silentFetch = async (url: string, options: RequestInit): Promise<Response> => {
  try {
    return await fetch(url, options);
  } catch (error) {
    // Check if admin has disabled logs
    if (typeof window !== 'undefined' && window.localStorage) {
      const logSettings = localStorage.getItem('admin_log_settings');
      if (logSettings) {
        const { enabled } = JSON.parse(logSettings);
        if (!enabled) {
          // Re-throw without browser logging
          throw error;
        }
      }
    }
    throw error;
  }
};

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    
    // Check if admin has disabled logs
    if (typeof window !== 'undefined' && window.localStorage) {
      const logSettings = localStorage.getItem('admin_log_settings');
      if (logSettings) {
        const { enabled } = JSON.parse(logSettings);
        if (!enabled) {
          // Still throw the error, but don't log it to console
          throw new Error(`${res.status}: ${text}`);
        }
      }
    }
    
    // Log error only if logs are enabled
    console.error(`API Error ${res.status}: ${text}`);
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  method: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {
    ...(data ? { "Content-Type": "application/json" } : {}),
  };

  // Get JWT tokens first (for guest and verified users)
  const guestToken = localStorage.getItem("guest_token");
  const verifiedToken = localStorage.getItem("verified_token");
  
  // Standard authentication flow for all users
  if (guestToken) {
    headers["Authorization"] = `Bearer ${guestToken}`;
  } else if (verifiedToken) {
    headers["Authorization"] = `Bearer ${verifiedToken}`;
  } else {
    // Fallback to Supabase token
    const session = localStorage.getItem("sb-" + import.meta.env.VITE_SUPABASE_PROJECT_ID + "-auth-token");
    if (session) {
      try {
        const { access_token } = JSON.parse(session);
        if (access_token) {
          headers["Authorization"] = `Bearer ${access_token}`;
        }
      } catch (e) {
        console.warn("Failed to parse auth token:", e);
      }
    }
  }

  // Use buildApiUrl to construct the proper URL
  const fullUrl = buildApiUrl(url);
  
  const res = await silentFetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // Handle 401 errors gracefully for auth endpoints
  if (res.status === 401 && url.includes('signin')) {
    // Don't throw for auth failures - return the response as-is
    return res;
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const headers: Record<string, string> = {};

    // Get JWT tokens first (for guest and verified users)
    const guestToken = localStorage.getItem("guest_token");
    const verifiedToken = localStorage.getItem("verified_token");
    
    // Standard authentication flow for all users
    if (guestToken) {
      headers["Authorization"] = `Bearer ${guestToken}`;
    } else if (verifiedToken) {
      headers["Authorization"] = `Bearer ${verifiedToken}`;
    } else {
      // Fallback to Supabase token
      const session = localStorage.getItem("sb-" + import.meta.env.VITE_SUPABASE_PROJECT_ID + "-auth-token");
      if (session) {
        try {
          const { access_token } = JSON.parse(session);
          if (access_token) {
            headers["Authorization"] = `Bearer ${access_token}`;
          }
        } catch (e) {
          console.warn("Failed to parse auth token:", e);
        }
      }
    }

    // Use buildApiUrl to construct the proper URL
    // Remove /api/ prefix from queryKey if present to avoid double /api/
    let endpoint = queryKey[0] as string;
    if (endpoint.startsWith('/api/')) {
      endpoint = endpoint.slice(4); // Remove '/api/' prefix
      console.log('🔍 Removed /api/ prefix, new endpoint:', endpoint);
    }
    const fullUrl = buildApiUrl(endpoint);
    console.log('🔍 Final URL:', fullUrl);
    
    const res = await silentFetch(fullUrl, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    // Handle 401 errors gracefully for auth endpoints
    if (res.status === 401 && endpoint.includes('signin')) {
      // Don't throw for auth failures - let the component handle them
      const errorData = await res.json().catch(() => ({ message: 'Authentication failed' }));
      return { error: errorData, status: 401 };
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});