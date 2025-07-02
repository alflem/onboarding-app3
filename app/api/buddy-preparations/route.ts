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

    // Only ADMIN and SUPER_ADMIN can view buddy preparations
    if (!session.user.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    // Super admin can see all, admin can only see their organization
    const whereClause = session.user.role === "SUPER_ADMIN"
      ? (organizationId ? { organizationId } : {})
      : { organizationId: session.user.organizationId };

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
      },
      orderBy: [
        { isActive: "desc" }, // Active preparations first
        { createdAt: "desc" },
      ],
    });

    // Calculate stats
    const stats = {
      total: preparations.length,
      active: preparations.filter(p => p.isActive).length,
      completed: preparations.filter(p => !p.isActive).length,
    };

    return NextResponse.json({
      success: true,
      data: preparations,
      stats,
    });
  } catch (error) {
    console.error("Error fetching buddy preparations:", error);
    return NextResponse.json(
      { error: "Failed to fetch buddy preparations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and SUPER_ADMIN can create buddy preparations
    if (!session.user.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const { firstName, lastName, email, buddyId, organizationId, notes } = body;

    // Validate required fields
    if (!firstName || !lastName || !buddyId || !organizationId) {
      return NextResponse.json(
        { error: "firstName, lastName, buddyId, and organizationId are required" },
        { status: 400 }
      );
    }

    // Validate that admin can only create for their organization
    if (session.user.role === "ADMIN" && organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: "Can only create preparations for your own organization" }, { status: 403 });
    }

    // Validate that buddy exists and belongs to the organization
    const buddy = await prisma.user.findFirst({
      where: {
        id: buddyId,
        organizationId: organizationId,
      },
    });

    if (!buddy) {
      return NextResponse.json(
        { error: "Buddy not found or does not belong to the specified organization" },
        { status: 400 }
      );
    }

    // Check if organization has buddy system enabled
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization?.buddyEnabled) {
      return NextResponse.json(
        { error: "Buddy system is not enabled for this organization" },
        { status: 400 }
      );
    }

    // Check for existing active preparation with same email in same organization
    if (email) {
      const existingPreparation = await prisma.buddyPreparation.findUnique({
        where: {
          email_organizationId: {
            email: email.toLowerCase(),
            organizationId,
          },
        },
      });

      if (existingPreparation && existingPreparation.isActive) {
        return NextResponse.json(
          { error: "Active buddy preparation already exists for this email in this organization" },
          { status: 400 }
        );
      }
    }

    // Create the buddy preparation
    const preparation = await prisma.buddyPreparation.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email ? email.toLowerCase().trim() : null,
        buddyId,
        organizationId,
        notes: notes?.trim() || null,
      },
      include: {
        buddy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            buddyEnabled: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: preparation,
      message: "Buddy preparation created successfully",
    });
  } catch (error) {
    console.error("Error creating buddy preparation:", error);
    return NextResponse.json(
      { error: "Failed to create buddy preparation" },
      { status: 500 }
    );
  }
}