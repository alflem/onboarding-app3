// app/api/organizations/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma"; // Använder din befintliga prisma-export

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // Hämta params från context
    const params = await context.params;
    const id = params.id;

    // Hämta användarens session
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Kontrollera att användaren är super admin
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.log(`Fetching organization ${id}...`);

    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            role: true,
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    console.log(`Found organization: ${organization.name}`);

    const adminCount = organization.users.filter(user =>
      user.role === 'ADMIN'
    ).length;

    return NextResponse.json({
      id: organization.id,
      name: organization.name,
      adminCount,
      userCount: organization.users.length,
      createdAt: organization.createdAt.toISOString().split('T')[0],
    });
  } catch (error) {
    console.error("Error fetching organization:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Uppdaterar PATCH-metoden för att matcha mönstret
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    // Hämta params från context
    const params = await context.params;
    const id = params.id;

    // Hämta användarens session
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Kontrollera att användaren är super admin
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.log(`Updating organization ${id}...`);

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: "Organization name is required" }, { status: 400 });
    }

    const updatedOrganization = await prisma.organization.update({
      where: { id },
      data: {
        name: name.trim(),
      },
      include: {
        users: {
          select: {
            id: true,
            role: true,
          },
        },
      },
    });

    console.log(`Updated organization: ${updatedOrganization.name}`);

    const adminCount = updatedOrganization.users.filter(user =>
      user.role === 'ADMIN'
    ).length;

    return NextResponse.json({
      id: updatedOrganization.id,
      name: updatedOrganization.name,
      adminCount,
      userCount: updatedOrganization.users.length,
      createdAt: updatedOrganization.createdAt.toISOString().split('T')[0],
    });
  } catch (error) {
    console.error("Error updating organization:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Uppdaterar DELETE-metoden för att matcha mönstret
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    // Hämta params från context
    const params = await context.params;
    const id = params.id;

    // Hämta användarens session
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Kontrollera att användaren är super admin
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.log(`Deleting organization ${id}...`);

    // Kontrollera om organisationen finns innan borttagning
    const organization = await prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    await prisma.organization.delete({
      where: { id },
    });

    console.log(`Organization deleted: ${id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting organization:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}