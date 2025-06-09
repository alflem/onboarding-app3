import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";

const prisma = new PrismaClient();

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check user in database
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organization: true,
        accounts: true
      }
    });

    // Check all organizations
    const allOrgs = await prisma.organization.findMany();

    // Check Demo Company specifically
    const demoOrg = await prisma.organization.findFirst({
      where: { name: "Demo Company" }
    });

    return NextResponse.json({
      session: {
        userId: session.user.id,
        email: session.user.email,
        organizationFromSession: session.user.organization
      },
      database: {
        user: dbUser ? {
          id: dbUser.id,
          email: dbUser.email,
          organizationId: dbUser.organizationId,
          organization: dbUser.organization,
          hasAccounts: dbUser.accounts.length > 0
        } : null,
        allOrganizations: allOrgs,
        demoCompany: demoOrg
      }
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json({
      error: "Database error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}