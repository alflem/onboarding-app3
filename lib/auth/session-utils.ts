import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";
import { NextResponse } from "next/server";

export interface SafeSession {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    role?: "SUPER_ADMIN" | "ADMIN" | "EMPLOYEE";
    organizationId: string;
    organizationName: string;
    isAzureManaged?: boolean;
    organization: {
      id: string;
      name: string;
    };
  };
}

/**
 * Get session and ensure organization is always present
 * Returns null if user is not authenticated
 * Always provides organization fallback if user is authenticated
 */
export async function getSafeSession(): Promise<SafeSession | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  // If user has no organizationId, we need to handle this gracefully
  if (!session.user.organizationId) {
    // This should not happen in normal flow, but if it does, return null
    // The user needs to be properly onboarded first
    console.error(`User ${session.user.email} has no organizationId - authentication incomplete`);
    return null;
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      organizationId: session.user.organizationId,
      organizationName: session.user.organizationName || "Unknown Organization",
      isAzureManaged: session.user.isAzureManaged,
      organization: {
        id: session.user.organizationId,
        name: session.user.organizationName || "Unknown Organization"
      }
    }
  };
}

/**
 * Get session and return 401 response if not authenticated
 */
export async function requireAuth(): Promise<SafeSession | NextResponse> {
  const session = await getSafeSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return session;
}

/**
 * Require specific role and return appropriate error response if not authorized
 */
export async function requireRole(requiredRole: "SUPER_ADMIN" | "ADMIN" | "EMPLOYEE"): Promise<SafeSession | NextResponse> {
  const sessionOrResponse = await requireAuth();

  if (sessionOrResponse instanceof NextResponse) {
    return sessionOrResponse;
  }

  if (sessionOrResponse.user.role !== requiredRole) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return sessionOrResponse;
}

/**
 * Require admin role (ADMIN or SUPER_ADMIN)
 */
export async function requireAdmin(): Promise<SafeSession | NextResponse> {
  const sessionOrResponse = await requireAuth();

  if (sessionOrResponse instanceof NextResponse) {
    return sessionOrResponse;
  }

  if (sessionOrResponse.user.role !== "ADMIN" && sessionOrResponse.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return sessionOrResponse;
}