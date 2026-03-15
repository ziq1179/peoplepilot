import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  // Don't throw on 404 - it's expected when resources don't exist (e.g., user has no employee record)
  if (!res.ok && res.status !== 404) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
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
    // Start with base URL
    let url = queryKey[0] as string;
    let queryParams: Record<string, string> | null = null;
    
    // Process remaining queryKey elements
    for (let i = 1; i < queryKey.length; i++) {
      const element = queryKey[i];
      
      if (typeof element === 'string') {
        // Append string segments as path parts
        url += `/${element}`;
      } else if (typeof element === 'object' && element !== null) {
        // Store object as query parameters (only use the last object)
        queryParams = element as Record<string, string>;
      }
    }
    
    // Append query parameters if present
    if (queryParams) {
      const searchParams = new URLSearchParams();
      
      // Only add non-empty params
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value && value !== '') {
          searchParams.append(key, value);
        }
      });
      
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && (res.status === 401 || res.status === 403)) {
      return null;
    }

    // Handle 404 gracefully - return null instead of throwing
    if (res.status === 404) {
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
