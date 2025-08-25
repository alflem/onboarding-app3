// lib/session-utils.ts
"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";

/**
 * Optimized session hook that prevents unnecessary re-renders
 * Use this instead of useSession when you don't need real-time updates
 */
export function useOptimizedSession() {
  const { data: session, status } = useSession();

  // Memoize the session data to prevent unnecessary re-renders
  const memoizedSession = useMemo(() => session, [session]);

  return {
    data: memoizedSession,
    status,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    isUnauthenticated: status === "unauthenticated"
  };
}

/**
 * Hook for pages that require authentication but don't need real-time updates
 * This reduces the frequency of session checks
 */
export function useRequiredSession() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      // This will redirect to signin page
    }
  });

  return {
    data: session,
    status,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated"
  };
}
