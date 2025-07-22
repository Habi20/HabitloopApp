import { useQuery } from "@tanstack/react-query";

export function useAuth<T = unknown>() {
  const { data: user, isLoading } = useQuery<T>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
