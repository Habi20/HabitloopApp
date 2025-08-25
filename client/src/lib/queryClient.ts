import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { buildApiUrl } from "@/config/api";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
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
  
  // TEMPORARY EXCEPTION - REMOVE AFTER SUPABASE FIX
  // Special handling for akeel.lithan@gmail.com to use Supabase auth for email testing
  const authUser = localStorage.getItem("authUser");
  let isExceptionUser = false;
  if (authUser) {
    try {
      const userData = JSON.parse(authUser);
      if (userData.email === 'akeel.lithan@gmail.com') {
        isExceptionUser = true;
        console.log('🔧 Using Supabase auth exception for akeel.lithan@gmail.com');
      }
    } catch (e) {
      console.warn("Failed to parse authUser:", e);
    }
  }
  
  if (isExceptionUser) {
    // For akeel.lithan@gmail.com, prioritize Supabase auth_token
    const authToken = localStorage.getItem("auth_token");
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }
  } else if (guestToken) {
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
  
  const res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

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
    
    // TEMPORARY EXCEPTION - REMOVE AFTER SUPABASE FIX
    // Special handling for akeel.lithan@gmail.com to use Supabase auth for email testing
    const authUser = localStorage.getItem("authUser");
    let isExceptionUser = false;
    if (authUser) {
      try {
        const userData = JSON.parse(authUser);
        if (userData.email === 'akeel.lithan@gmail.com') {
          isExceptionUser = true;
          console.log('🔧 Using Supabase auth exception for akeel.lithan@gmail.com');
        }
      } catch (e) {
        console.warn("Failed to parse authUser:", e);
      }
    }
    
    if (isExceptionUser) {
      // For akeel.lithan@gmail.com, prioritize Supabase auth_token
      const authToken = localStorage.getItem("auth_token");
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }
    } else if (guestToken) {
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
    }
    const fullUrl = buildApiUrl(endpoint); 
    
    const res = await fetch(fullUrl, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
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
