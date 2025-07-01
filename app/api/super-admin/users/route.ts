import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

// Kontrollera SUPER_ADMIN behörighet
async function checkSuperAdminAccess() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") {
    return false;
  }

  return true;
}

// GET - Hämta alla användare
export async function GET() {
  try {
    if (!(await checkSuperAdminAccess())) {
      return NextResponse.json({ error: "Unauthorized - SUPER_ADMIN required" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      include: {
        organization: true,
        buddy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        buddyFor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        progress: {
          include: {
            task: {
              select: {
                id: true,
                title: true,
                isBuddyTask: true
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
      data: users
    });

  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({
      error: "Failed to fetch users",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Skapa ny användare
export async function POST(request: Request) {
  try {
    if (!(await checkSuperAdminAccess())) {
      return NextResponse.json({ error: "Unauthorized - SUPER_ADMIN required" }, { status: 403 });
    }

    const data = await request.json();
    const { name, email, role = "EMPLOYEE", organizationId, buddyId, password = "" } = data;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password,
        role,
        organizationId,
        buddyId
      },
      include: {
        organization: true,
        buddy: true
      }
    });

    return NextResponse.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({
      error: "Failed to create user",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Uppdatera användare
export async function PUT(request: Request) {
  try {
    if (!(await checkSuperAdminAccess())) {
      return NextResponse.json({ error: "Unauthorized - SUPER_ADMIN required" }, { status: 403 });
    }

    const data = await request.json();
    const { id, name, email, role, organizationId, buddyId, password } = data;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // Define proper type for updateData
    const updateData: {
      name?: string;
      email?: string;
      role?: "SUPER_ADMIN" | "ADMIN" | "EMPLOYEE";
      organizationId?: string | null;
      buddyId?: string | null;
      password?: string;
    } = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (organizationId !== undefined) updateData.organizationId = organizationId;
    if (buddyId !== undefined) updateData.buddyId = buddyId;
    if (password !== undefined) updateData.password = password;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        organization: true,
        buddy: true
      }
    });

    return NextResponse.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({
      error: "Failed to update user",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Ta bort användare
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

    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: "User deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({
      error: "Failed to delete user",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}