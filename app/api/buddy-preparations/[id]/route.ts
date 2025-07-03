import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and SUPER_ADMIN can delete buddy preparations
    if (!session.user.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { id } = await context.params;

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

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and SUPER_ADMIN can update buddy preparations
    if (!session.user.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { firstName, lastName, email, buddyId, notes } = body;

    // Check if the preparation exists
    const existingPreparation = await prisma.buddyPreparation.findUnique({
      where: { id },
    });

    if (!existingPreparation) {
      return NextResponse.json(
        { error: "Buddy preparation not found" },
        { status: 404 }
      );
    }

    // Validate that admin can only update from their organization
    if (session.user.role === "ADMIN" && existingPreparation.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: "Can only update preparations from your own organization" }, { status: 403 });
    }

    // Validate required fields
    if (!firstName || !lastName || !buddyId) {
      return NextResponse.json(
        { error: "firstName, lastName, and buddyId are required" },
        { status: 400 }
      );
    }

    // Validate that buddy exists and belongs to the organization
    const buddy = await prisma.user.findFirst({
      where: {
        id: buddyId,
        organizationId: existingPreparation.organizationId,
      },
    });

    if (!buddy) {
      return NextResponse.json(
        { error: "Buddy not found or does not belong to the organization" },
        { status: 400 }
      );
    }

    // Check for email conflicts if email is being changed
    if (email && email !== existingPreparation.email) {
      const emailNormalized = email.toLowerCase().trim();
      const conflictingPreparation = await prisma.buddyPreparation.findUnique({
        where: {
          email_organizationId: {
            email: emailNormalized,
            organizationId: existingPreparation.organizationId,
          },
        },
      });

      if (conflictingPreparation && conflictingPreparation.id !== id && conflictingPreparation.isActive) {
        return NextResponse.json(
          { error: "Active buddy preparation already exists for this email in this organization" },
          { status: 400 }
        );
      }
    }

    // Update the preparation
    const updatedPreparation = await prisma.buddyPreparation.update({
      where: { id },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email ? email.toLowerCase().trim() : null,
        buddyId,
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

    return NextResponse.json({
      success: true,
      data: updatedPreparation,
      message: "Buddy preparation updated successfully",
    });
  } catch (error) {
    console.error("Error updating buddy preparation:", error);
    return NextResponse.json(
      { error: "Failed to update buddy preparation" },
      { status: 500 }
    );
  }
}