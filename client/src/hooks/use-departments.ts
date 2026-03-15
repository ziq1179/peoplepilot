import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { getQueryFn } from "@/lib/queryClient";
import type { Department } from "@shared/schema";

/**
 * Fetch departments only when user is authenticated.
 * Avoids 401/403 console errors on initial load or when logged out.
 */
export function useDepartments() {
  const { user } = useAuth();
  return useQuery<Department[] | null>({
    queryKey: ["/api/departments"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user,
  });
}
