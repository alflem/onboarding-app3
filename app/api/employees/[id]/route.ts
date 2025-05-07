import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>
}

interface EmployeeTask {
  id: string;
  title: string;
  description: string | null;
  isBuddyTask: boolean;
  completed: boolean;
  progressId: string;
}

// GET /api/employees/[id] - Hämta en specifik medarbetare
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

    // Kontrollera att användaren har behörighet (admin eller super_admin)
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Hämta medarbetare-id från URL:en
    const params = await context.params;
    const { id } = params;

    // Hämta medarbetare från databasen
    const employee = await prisma.user.findUnique({
      where: {
        id: id
      },
      include: {
        buddy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        progress: {
          include: {
            task: {
              include: {
                category: true
              }
            }
          }
        }
      }
    });

    // Kontrollera om medarbetaren finns
    if (!employee) {
      return NextResponse.json(
        { error: 'Medarbetaren hittades inte' },
        { status: 404 }
      );
    }

    // Kontrollera om användaren har tillgång till medarbetaren
    if (employee.organizationId !== session.user.organization.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Beräkna progress
    const completedTasks = employee.progress.filter(p => p.completed).length;
    const totalTasks = employee.progress.length;
    const progressPercentage = totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

    // Organisera progress efter kategori
    const progressByCategory = employee.progress.reduce((acc, progress) => {
      const categoryId = progress.task.category.id;

      if (!acc[categoryId]) {
        acc[categoryId] = {
          id: categoryId,
          name: progress.task.category.name,
          tasks: []
        };
      }

      acc[categoryId].tasks.push({
        id: progress.task.id,
        title: progress.task.title,
        description: progress.task.description,
        isBuddyTask: progress.task.isBuddyTask,
        completed: progress.completed,
        progressId: progress.id
      });

      return acc;
    }, {} as Record<string, { id: string; name: string; tasks: EmployeeTask[] }>);

    // Konvertera till array
    const categories = Object.values(progressByCategory);

    // Strukturera svaret
    const response = {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      organizationId: employee.organizationId,
      progress: progressPercentage,
      hasBuddy: employee.buddyId !== null,
      buddy: employee.buddy,
      categories: categories
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Fel vid hämtning av medarbetare:', error);
    return NextResponse.json(
      { error: 'Kunde inte hämta medarbetare' },
      { status: 500 }
    );
  }
}

// DELETE /api/employees/[id] - Ta bort en medarbetare
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

    // Hämta medarbetare-id från URL:en
    const params = await context.params;
    const { id } = params;


    // Hämta existerande medarbetare för att verifiera ägarskap
    const existingEmployee = await prisma.user.findUnique({
      where: {
        id: id
      }
    });

    // Kontrollera om medarbetaren finns
    if (!existingEmployee) {
      return NextResponse.json(
        { error: 'Medarbetaren hittades inte' },
        { status: 404 }
      );
    }

    // Kontrollera om användaren har tillgång till medarbetaren
    if (existingEmployee.organizationId !== session.user.organization.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Uppdatera alla användare som har denna medarbetare som buddy
    await prisma.user.updateMany({
      where: {
        buddyId: id
      },
      data: {
        buddyId: null
      }
    });

    // Ta bort progress-poster
    await prisma.taskProgress.deleteMany({
      where: {
        userId: id
      }
    });

    // Ta bort själva användaren
    await prisma.user.delete({
      where: {
        id: id
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Fel vid borttagning av medarbetare:', error);
    return NextResponse.json(
      { error: 'Kunde inte ta bort medarbetare' },
      { status: 500 }
    );
  }
}