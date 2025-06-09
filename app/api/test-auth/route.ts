import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    return NextResponse.json({
      authenticated: !!session,
      session: session ? {
        user: {
          id: session.user?.id,
          email: session.user?.email,
          name: session.user?.name,
          role: session.user?.role,
          organizationId: session.user?.organizationId,
          organizationName: session.user?.organizationName
        }
      } : null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Test auth endpoint error:", error);
    return NextResponse.json({
      error: "Authentication check failed",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}