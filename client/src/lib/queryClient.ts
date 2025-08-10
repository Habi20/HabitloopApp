import { QueryClient, QueryFunction } from "@tanstack/react-query";

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

  // Get session token from localStorage
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

  const res = await fetch(url, {
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

    // Get session token from localStorage
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

    const res = await fetch(queryKey[0] as string, {
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