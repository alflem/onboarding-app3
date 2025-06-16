import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";

const prisma = new PrismaClient();

// Kontrollera SUPER_ADMIN behörighet
async function checkSuperAdminAccess() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") {
    return false;
  }

  return true;
}

// GET - Hämta alla organisationer
export async function GET() {
  try {
    if (!(await checkSuperAdminAccess())) {
      return NextResponse.json({ error: "Unauthorized - SUPER_ADMIN required" }, { status: 403 });
    }

    const organizations = await prisma.organization.findMany({
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true
          }
        },
        checklist: {
          include: {
            categories: {
              include: {
                tasks: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: organizations
    });

  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json({
      error: "Failed to fetch organizations",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Skapa ny organisation
export async function POST(request: Request) {
  try {
    if (!(await checkSuperAdminAccess())) {
      return NextResponse.json({ error: "Unauthorized - SUPER_ADMIN required" }, { status: 403 });
    }

    const data = await request.json();
    const { name, buddyEnabled = true } = data;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const organization = await prisma.organization.create({
      data: {
        name,
        buddyEnabled
      },
      include: {
        users: true,
        checklist: true
      }
    });

    return NextResponse.json({
      success: true,
      data: organization
    });

  } catch (error) {
    console.error("Error creating organization:", error);
    return NextResponse.json({
      error: "Failed to create organization",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Uppdatera organisation
export async function PUT(request: Request) {
  try {
    if (!(await checkSuperAdminAccess())) {
      return NextResponse.json({ error: "Unauthorized - SUPER_ADMIN required" }, { status: 403 });
    }

    const data = await request.json();
    const { id, name, buddyEnabled } = data;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const organization = await prisma.organization.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(buddyEnabled !== undefined && { buddyEnabled })
      },
      include: {
        users: true,
        checklist: true
      }
    });

    return NextResponse.json({
      success: true,
      data: organization
    });

  } catch (error) {
    console.error("Error updating organization:", error);
    return NextResponse.json({
      error: "Failed to update organization",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Ta bort organisation
export async function DELETE(request: Request) {
  try {
    if (!(await checkSuperAdminAccess())) {
      return NextResponse.json({ error: "Unauthorized - SUPER_ADMIN required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // Ta bort organisation (kaskad-borttagning hanteras av Prisma schema)
    await prisma.organization.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: "Organization deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting organization:", error);
    return NextResponse.json({
      error: "Failed to delete organization",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}