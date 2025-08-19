import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ employeeId: string }>
}

// GET /api/checklist/employee/[employeeId] - Hämta checklista för en specifik anställd (för buddy)
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { employeeId } = await context.params;

    // Kontrollera att den inloggade användaren är buddy för den anställda
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      include: {
        organization: true,
        buddyAssignments: {
          where: { buddyId: session.user.id }
        }
      }
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Kontrollera buddy-relation (både legacy och nya systemet)
    const isBuddyLegacy = employee.buddyId === session.user.id;
    const isBuddyAssignment = employee.buddyAssignments.length > 0;

    if (!isBuddyLegacy && !isBuddyAssignment) {
      return NextResponse.json({ error: "Not authorized to view this employee's checklist" }, { status: 403 });
    }

    // Kontrollera att organisationen har buddy-funktionen aktiverad
    if (!employee.organization?.buddyEnabled) {
      return NextResponse.json({ error: "Buddy function not enabled for this organization" }, { status: 403 });
    }

    // Hämta checklistan för organisationen
    const checklist = await prisma.checklist.findFirst({
      where: { organizationId: employee.organizationId! },
      include: {
        categories: {
          include: {
            tasks: {
              where: { isBuddyTask: true }, // Endast buddy-uppgifter
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!checklist) {
      return NextResponse.json({ error: "Checklist not found" }, { status: 404 });
    }

    // Hämta framsteg för den specifika anställda
    const taskProgress = await prisma.taskProgress.findMany({
      where: { userId: employeeId },
      select: { taskId: true, completed: true }
    });

    const completedTaskIds = new Set(
      taskProgress.filter(p => p.completed).map(p => p.taskId)
    );

    // Filtrera kategorier som har buddy-uppgifter och lägg till completion status
    const categoriesWithTasks = checklist.categories
      .map(category => ({
        ...category,
        tasks: category.tasks.map(task => ({
          ...task,
          completed: completedTaskIds.has(task.id)
        }))
      }))
      .filter(category => category.tasks.length > 0);

    return NextResponse.json({
      categories: categoriesWithTasks,
      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.email
      }
    });

  } catch (error) {
    console.error("Error fetching employee checklist:", error);
    return NextResponse.json(
      { error: "Failed to fetch checklist" },
      { status: 500 }
    );
  }
}
