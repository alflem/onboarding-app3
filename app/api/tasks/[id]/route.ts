import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

// Ändra interface för att matcha Next.js typkonvention
interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/tasks/[id] - Hämta en specifik uppgift
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // Hämta användarsession
    const session = await getServerSession(authOptions);

    // Kontrollera om användaren är inloggad
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Hämta uppgifts-id från URL:en - med await eftersom params är Promise
    const params = await context.params;
    const { id } = params;

    // Hämta uppgift från databasen
    const task = await prisma.task.findUnique({
      where: {
        id: id
      },
      include: {
        category: {
          include: {
            checklist: {
              select: {
                organizationId: true
              }
            }
          }
        }
      }
    });

    // Kontrollera om uppgiften finns
    if (!task) {
      return NextResponse.json(
        { error: 'Uppgiften hittades inte' },
        { status: 404 }
      );
    }

    // Kontrollera om användaren har tillgång till uppgiften
    if (task.category.checklist.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json(task);

  } catch (error) {
    console.error('Fel vid hämtning av uppgift:', error);
    return NextResponse.json(
      { error: 'Kunde inte hämta uppgift' },
      { status: 500 }
    );
  }
}

// PATCH /api/tasks/[id] - Uppdatera en uppgift
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    // Hämta användarsession
    const session = await getServerSession(authOptions);

    // Kontrollera om användaren är inloggad
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Kontrollera att användaren har behörighet (admin eller super_admin)
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Hämta uppgifts-id från URL:en - med await eftersom params är Promise
    const params = await context.params;
    const { id } = params;

    // Hämta existerande uppgift för att verifiera ägarskap
    const existingTask = await prisma.task.findUnique({
      where: {
        id: id
      },
      include: {
        category: {
          include: {
            checklist: {
              select: {
                organizationId: true
              }
            }
          }
        }
      }
    });

    // Kontrollera om uppgiften finns
    if (!existingTask) {
      return NextResponse.json(
        { error: 'Uppgiften hittades inte' },
        { status: 404 }
      );
    }

    // Kontrollera om användaren har tillgång till uppgiften
    if (existingTask.category.checklist.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Hämta och validera begäransdata
    const body = await request.json();

    // Om categoryId ska ändras, kontrollera att målkategorin tillhör samma organisation
    if (body.categoryId) {
      const targetCategory = await prisma.category.findUnique({
        where: { id: body.categoryId },
        include: {
          checklist: {
            select: { organizationId: true }
          }
        }
      });

      if (!targetCategory) {
        return NextResponse.json(
          { error: 'Målkategorin hittades inte' },
          { status: 404 }
        );
      }

      if (targetCategory.checklist.organizationId !== session.user.organizationId) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }
    }

    // Bygg uppdateringsdata
    const updateData: {
      title?: string;
      description?: string | null;
      link?: string | null;
      isBuddyTask?: boolean;
      order?: number;
      categoryId?: string;
    } = {};

    if (body.title) updateData.title = body.title.trim();
    if (body.description !== undefined) updateData.description = body.description;
    if (body.link !== undefined) updateData.link = body.link;
    if (body.isBuddyTask !== undefined) updateData.isBuddyTask = body.isBuddyTask;
    if (body.order !== undefined) updateData.order = body.order;
    if (body.categoryId) updateData.categoryId = body.categoryId;

    // Uppdatera uppgift i databasen
    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(updatedTask);

  } catch (error) {
    console.error('Fel vid uppdatering av uppgift:', error);
    return NextResponse.json(
      { error: 'Kunde inte uppdatera uppgift' },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - Ta bort en uppgift
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    // Hämta användarsession
    const session = await getServerSession(authOptions);

    // Kontrollera om användaren är inloggad
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Kontrollera att användaren har behörighet (admin eller super_admin)
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Hämta uppgifts-id från URL:en - med await eftersom params är Promise
    const params = await context.params;
    const { id } = params;

    // Hämta existerande uppgift för att verifiera ägarskap
    const existingTask = await prisma.task.findUnique({
      where: {
        id: id
      },
      include: {
        category: {
          include: {
            checklist: {
              select: {
                organizationId: true
              }
            }
          }
        }
      }
    });

    // Kontrollera om uppgiften finns
    if (!existingTask) {
      return NextResponse.json(
        { error: 'Uppgiften hittades inte' },
        { status: 404 }
      );
    }

    // Kontrollera om användaren har tillgång till uppgiften
    if (existingTask.category.checklist.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Ta först bort alla progress-poster för uppgiften
    await prisma.taskProgress.deleteMany({
      where: {
        taskId: id
      }
    });

    // Ta sedan bort uppgiften
    await prisma.task.delete({
      where: {
        id: id
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Fel vid borttagning av uppgift:', error);
    return NextResponse.json(
      { error: 'Kunde inte ta bort uppgift' },
      { status: 500 }
    );
  }
}