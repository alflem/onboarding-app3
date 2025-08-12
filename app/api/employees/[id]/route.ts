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
        progress: true
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
    if (employee.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Hämta checklistans uppgifter för medarbetarens organisation
    const checklist = await prisma.checklist.findUnique({
      where: { organizationId: employee.organizationId! },
      include: {
        categories: {
          include: {
            tasks: {
              select: { id: true, title: true, description: true, isBuddyTask: true }
            }
          }
        }
      }
    });

    // Bygg upp uppgiftskarta och kategorier
    const userProgress = await prisma.taskProgress.findMany({
      where: { userId: employee.id },
      select: { id: true, taskId: true, completed: true }
    });
    const completedTaskIdSet = new Set(userProgress.filter(p => p.completed).map(p => p.taskId));

    const allCategories = (checklist?.categories || []).map(cat => {
      const totalTasksForCategory = cat.tasks.length;
      const completedInCategory = cat.tasks.reduce((sum, task) => sum + (completedTaskIdSet.has(task.id) ? 1 : 0), 0);
      return {
        id: cat.id,
        name: cat.name,
        isBuddyCategory: !!(cat as any).isBuddyCategory,
        tasks: cat.tasks.map((t): EmployeeTask => ({
          id: t.id,
          title: t.title,
          description: t.description,
          isBuddyTask: t.isBuddyTask,
          completed: completedTaskIdSet.has(t.id),
          progressId: userProgress.find(p => p.taskId === t.id)?.id || ""
        })),
        completedTasks: completedInCategory,
        totalTasks: totalTasksForCategory
      };
    });

    const totalTasks = allCategories.reduce((sum, c) => sum + c.totalTasks, 0);
    const completedTasks = allCategories.reduce((sum, c) => sum + c.completedTasks, 0);
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Flata listor för visning: buddyuppgifter respektive vanliga uppgifter
    const buddyTasks = allCategories.flatMap(cat =>
      cat.tasks
        .filter(t => t.isBuddyTask)
        .map(t => ({ id: t.id, title: t.title, completed: t.completed, categoryId: cat.id, categoryName: cat.name }))
    );
    const regularTasks = allCategories.flatMap(cat =>
      cat.tasks
        .filter(t => !t.isBuddyTask)
        .map(t => ({ id: t.id, title: t.title, completed: t.completed, categoryId: cat.id, categoryName: cat.name }))
    );

    // Strukturera svaret
    // Är denna användare buddy för någon?
    const [usersWithThisBuddyCount, activePreparationsCount] = await Promise.all([
      prisma.user.count({ where: { buddyId: employee.id } }),
      prisma.buddyPreparation.count({ where: { buddyId: employee.id, isActive: true } })
    ]);
    const isBuddyForSomeone = usersWithThisBuddyCount > 0 || activePreparationsCount > 0;

    const response = {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      organizationId: employee.organizationId,
      createdAt: employee.createdAt,
      progress: progressPercentage,
      hasBuddy: employee.buddyId !== null,
      isBuddyForSomeone,
      buddy: employee.buddy,
      categories: allCategories.map(c => ({ id: c.id, name: c.name, completedTasks: c.completedTasks, totalTasks: c.totalTasks, isBuddyCategory: c.isBuddyCategory })),
      totalTasks,
      completedTasks,
      buddyTasks,
      regularTasks
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
    if (existingEmployee.organizationId !== session.user.organizationId) {
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