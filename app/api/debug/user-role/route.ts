import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organization: true,
        accounts: {
          select: {
            provider: true,
            providerAccountId: true,
          }
        }
      }
    });

    // Get browser info from request headers
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome');
    const isChrome = userAgent.includes('Chrome');
    const cookies = request.headers.get('cookie') || '';

    // Check for specific NextAuth cookies
    const hasSessionToken = cookies.includes('next-auth.session-token') || cookies.includes('__Secure-next-auth.session-token');
    const hasCallbackUrl = cookies.includes('next-auth.callback-url') || cookies.includes('__Secure-next-auth.callback-url');
    const hasCsrfToken = cookies.includes('next-auth.csrf-token') || cookies.includes('__Host-next-auth.csrf-token');

    return NextResponse.json({
      debug: {
        timestamp: new Date().toISOString(),
        browser: {
          userAgent,
          isSafari,
          isChrome,
          cookies: {
            hasSessionToken,
            hasCallbackUrl,
            hasCsrfToken,
            total: cookies.length,
          }
        },
        session: {
          exists: !!session,
          userId: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role,
          organizationId: session.user.organizationId,
          organizationName: session.user.organizationName,
        },
        database: {
          exists: !!dbUser,
          userId: dbUser?.id,
          email: dbUser?.email,
          role: dbUser?.role,
          organizationId: dbUser?.organizationId,
          organizationName: dbUser?.organization?.name,
          accounts: dbUser?.accounts?.map(acc => ({
            provider: acc.provider,
            accountId: acc.providerAccountId,
          })),
          createdAt: dbUser?.createdAt,
        },
        comparison: {
          rolesDiffer: session.user.role !== dbUser?.role,
          sessionRole: session.user.role,
          dbRole: dbUser?.role,
          organizationsDiffer: session.user.organizationId !== dbUser?.organizationId,
          sessionOrgId: session.user.organizationId,
          dbOrgId: dbUser?.organizationId,
        },
        recommendations: []
      }
    });

  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}