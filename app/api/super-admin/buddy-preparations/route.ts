import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only SUPER_ADMIN can view buddy preparations from all organizations
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    const whereClause: Record<string, string> = {};

    // If specific organization is requested, filter by it
    if (organizationId) {
      whereClause.organizationId = organizationId;
    }

    const preparations = await prisma.buddyPreparation.findMany({
      where: whereClause,
      include: {
        buddy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        buddies: {
          include: {
            buddy: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            buddyEnabled: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
        taskProgress: {
          include: {
            task: {
              select: {
                id: true,
                title: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [
        { organization: { name: "asc" } },
        { isActive: "desc" },
        { createdAt: "desc" },
      ],
    });

    // Calculate stats per organization
    const statsByOrg = preparations.reduce((acc, prep) => {
      const orgId = prep.organization.id;
      if (!acc[orgId]) {
        acc[orgId] = {
          organizationId: orgId,
          organizationName: prep.organization.name,
          total: 0,
          active: 0,
          completed: 0,
        };
      }

      acc[orgId].total++;
      if (prep.isActive) {
        acc[orgId].active++;
      } else {
        acc[orgId].completed++;
      }

      return acc;
    }, {} as Record<string, {
      organizationId: string;
      organizationName: string;
      total: number;
      active: number;
      completed: number;
    }>);

    const stats = Object.values(statsByOrg);

    return NextResponse.json({
      data: preparations,
      stats,
      totalPreparations: preparations.length,
    });
  } catch (error) {
    console.error("Error fetching buddy preparations:", error);
    return NextResponse.json(
      { error: "Failed to fetch buddy preparations" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only SUPER_ADMIN can delete buddy preparations
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const preparationId = searchParams.get("id");

    if (!preparationId) {
      return NextResponse.json({ error: "Preparation ID is required" }, { status: 400 });
    }

    // Delete the buddy preparation
    await prisma.buddyPreparation.delete({
      where: { id: preparationId },
    });

    return NextResponse.json({
      success: true,
      message: "Buddy preparation deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting buddy preparation:", error);
    return NextResponse.json(
      { error: "Failed to delete buddy preparation" },
      { status: 500 }
    );
  }
}
