// components/auth-provider.tsx
"use client"

import { SessionProvider } from "next-auth/react";

export function AuthProvider({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider
      refetchInterval={60 * 60} // Refetch session every 1 hour (Azure AD access token lifetime)
      refetchOnWindowFocus={false} // Don't refetch when window gains focus
      refetchWhenOffline={false} // Don't refetch when offline
    >
      {children}
    </SessionProvider>
  );
}