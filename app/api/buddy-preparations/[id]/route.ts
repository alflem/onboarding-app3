import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session?.user?.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and SUPER_ADMIN can delete buddy preparations
    if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { id } = await params;

    // Check if the preparation exists
    const preparation = await prisma.buddyPreparation.findUnique({
      where: { id },
      include: {
        organization: {
          select: { id: true, name: true },
        },
      },
    });

    if (!preparation) {
      return NextResponse.json(
        { error: "Buddy preparation not found" },
        { status: 404 }
      );
    }

    // Validate that admin can only delete from their organization
    if (session.user.role === "ADMIN" && preparation.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: "Can only delete preparations from your own organization" }, { status: 403 });
    }

    // Delete the preparation
    await prisma.buddyPreparation.delete({
      where: { id },
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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!session?.user?.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    const { userId } = body;
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    // Update the buddy preparation
    const updatedPreparation = await prisma.buddyPreparation.update({
      where: { id },
      data: {
        userId,
        isActive: false,
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
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
      },
    });
    return NextResponse.json({ success: true, data: updatedPreparation });
  } catch (error) {
    console.error("Error manually linking buddy preparation:", error);
    return NextResponse.json({ error: "Failed to link buddy preparation" }, { status: 500 });
  }
}