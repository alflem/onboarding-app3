import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({
        error: "No authenticated user found",
        hasSession: !!session,
        sessionUser: session?.user ? "exists" : "missing"
      }, { status: 401 });
    }

    console.log("Checking user organization for:", session.user.email);

    // Get user from database with organization
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organization: true
      }
    });

    console.log("Database user found:", !!dbUser);
    console.log("User has organization:", !!dbUser?.organization);

    if (!dbUser) {
      return NextResponse.json({
        error: "User not found in database",
        userId: session.user.id,
        sessionEmail: session.user.email
      }, { status: 404 });
    }

    // If user has no organization, try to assign Demo Company
    if (!dbUser.organizationId) {
      console.log("User has no organization, attempting to assign Demo Company...");

      let demoOrg = await prisma.organization.findFirst({
        where: { name: "Demo Company" }
      });

      if (!demoOrg) {
        console.log("Demo Company not found, creating...");
        demoOrg = await prisma.organization.create({
          data: {
            name: "Demo Company",
            buddyEnabled: true,
          }
        });
        console.log("Demo Company created:", demoOrg.id);
      }

      // Assign user to Demo Company
      const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: { organizationId: demoOrg.id },
        include: { organization: true }
      });

      console.log("User assigned to Demo Company successfully");

      return NextResponse.json({
        success: true,
        action: "assigned_to_demo_company",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          organizationId: updatedUser.organizationId,
          organizationName: updatedUser.organization?.name
        },
        demoCompanyId: demoOrg.id,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      action: "user_already_has_organization",
      user: {
        id: dbUser.id,
        email: dbUser.email,
        organizationId: dbUser.organizationId,
        organizationName: dbUser.organization?.name
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("User organization debug error:", error);
    return NextResponse.json({
      error: "Failed to check/assign user organization",
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}