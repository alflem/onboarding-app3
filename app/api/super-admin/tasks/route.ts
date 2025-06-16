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

// GET - Hämta alla tasks
export async function GET() {
  try {
    if (!(await checkSuperAdminAccess())) {
      return NextResponse.json({ error: "Unauthorized - SUPER_ADMIN required" }, { status: 403 });
    }

    const tasks = await prisma.task.findMany({
      include: {
        category: {
          include: {
            checklist: {
              include: {
                organization: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        },
        progress: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: [
        { category: { checklist: { organization: { name: 'asc' } } } },
        { category: { order: 'asc' } },
        { order: 'asc' }
      ]
    });

    return NextResponse.json({
      success: true,
      data: tasks
    });

  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({
      error: "Failed to fetch tasks",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Skapa ny task
export async function POST(request: Request) {
  try {
    if (!(await checkSuperAdminAccess())) {
      return NextResponse.json({ error: "Unauthorized - SUPER_ADMIN required" }, { status: 403 });
    }

    const data = await request.json();
    const { title, description, link, categoryId, order, isBuddyTask = false } = data;

    if (!title || !categoryId) {
      return NextResponse.json({ error: "Title and categoryId are required" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        link,
        categoryId,
        order: order || 1,
        isBuddyTask
      },
      include: {
        category: {
          include: {
            checklist: {
              include: {
                organization: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: task
    });

  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json({
      error: "Failed to create task",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Uppdatera task
export async function PUT(request: Request) {
  try {
    if (!(await checkSuperAdminAccess())) {
      return NextResponse.json({ error: "Unauthorized - SUPER_ADMIN required" }, { status: 403 });
    }

    const data = await request.json();
    const { id, title, description, link, categoryId, order, isBuddyTask } = data;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // Define proper type for updateData
    const updateData: {
      title?: string;
      description?: string | null;
      link?: string | null;
      categoryId?: string;
      order?: number;
      isBuddyTask?: boolean;
    } = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (link !== undefined) updateData.link = link;
    if (categoryId) updateData.categoryId = categoryId;
    if (order !== undefined) updateData.order = order;
    if (isBuddyTask !== undefined) updateData.isBuddyTask = isBuddyTask;

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          include: {
            checklist: {
              include: {
                organization: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: task
    });

  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json({
      error: "Failed to update task",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Ta bort task
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

    await prisma.task.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: "Task deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json({
      error: "Failed to delete task",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}