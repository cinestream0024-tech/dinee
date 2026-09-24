import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError, initializeCsrf } from "@/services/api";
import type { CurrentUser } from "@/types/auth";
export const sessionKey = ["session"] as const;
export function useSession() {
  return useQuery({
    queryKey: sessionKey,
    queryFn: async () => {
      try {
        return (await api<{ data: CurrentUser }>("/api/v1/auth/user")).data;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    retry: false,
    staleTime: 0,
  });
}
export function useLogin() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      await initializeCsrf();
      return (
        await api<{ data: CurrentUser }>("/api/v1/auth/login", {
          method: "POST",
          body: JSON.stringify(credentials),
        })
      ).data;
    },
    onSuccess: async (user) => {
      await client.cancelQueries();
      client.clear();
      client.setQueryData(sessionKey, user);
    },
  });
}
export function useLogout() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await initializeCsrf();
      try {
        await api<void>("/api/v1/auth/logout", { method: "POST" });
      } catch (error) {
        if (!(error instanceof ApiError && error.status === 401)) throw error;
      }
    },
    onSuccess: async () => {
      await client.cancelQueries();
      client.clear();
      client.setQueryData(sessionKey, null);
    },
  });
}
