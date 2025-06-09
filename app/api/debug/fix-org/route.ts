import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check current user state
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    // Find or create Demo Company
    let demoOrganization = await prisma.organization.findFirst({
      where: { name: "Demo Company" }
    });

    if (!demoOrganization) {
      console.log("Creating Demo Company...");
      demoOrganization = await prisma.organization.create({
        data: {
          name: "Demo Company",
          buddyEnabled: true,
        }
      });
    }

    // Force update user with Demo Company
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { organizationId: demoOrganization.id },
      include: { organization: true }
    });

    return NextResponse.json({
      message: "Organization assignment fixed",
      before: {
        organizationId: currentUser.organizationId,
        organizationName: currentUser.organization?.name
      },
      after: {
        organizationId: updatedUser.organizationId,
        organizationName: updatedUser.organization?.name
      }
    });
  } catch (error) {
    console.error("Fix organization error:", error);
    return NextResponse.json({
      error: "Database error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}