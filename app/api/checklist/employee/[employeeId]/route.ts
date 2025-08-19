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

    // Kontrollera om det är en anställd eller en förberedelse
    let employee = null;
    let preparation = null;
    let organizationId = null;
    let personData = null;

    // Först, försök hitta som anställd användare
    employee = await prisma.user.findUnique({
      where: { id: employeeId },
      include: {
        organization: true,
        buddyAssignments: {
          where: { buddyId: session.user.id }
        }
      }
    });

    if (employee) {
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

      organizationId = employee.organizationId;
      personData = {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        type: 'employee' as const
      };
    } else {
      // Om inte anställd, försök hitta som förberedelse
      preparation = await prisma.buddyPreparation.findUnique({
        where: { id: employeeId },
        include: {
          organization: true
        }
      });

      if (!preparation) {
        return NextResponse.json({ error: "Person not found" }, { status: 404 });
      }

      // Kontrollera att den inloggade användaren är buddy för förberedelsen
      if (preparation.buddyId !== session.user.id) {
        return NextResponse.json({ error: "Not authorized to view this preparation's checklist" }, { status: 403 });
      }

      // Kontrollera att organisationen har buddy-funktionen aktiverad
      if (!preparation.organization?.buddyEnabled) {
        return NextResponse.json({ error: "Buddy function not enabled for this organization" }, { status: 403 });
      }

      organizationId = preparation.organizationId;
      personData = {
        id: preparation.id,
        name: `${preparation.firstName} ${preparation.lastName}`,
        email: preparation.email || null,
        type: 'preparation' as const
      };
    }

    // Hämta checklistan för organisationen
    const checklist = await prisma.checklist.findFirst({
      where: { organizationId: organizationId! },
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

    // Hämta framsteg för den specifika personen
    let completedTaskIds = new Set<string>();

    if (employee) {
      // För anställda användare - använd vanliga TaskProgress
      const taskProgress = await prisma.taskProgress.findMany({
        where: { userId: employeeId },
        select: { taskId: true, completed: true }
      });

      completedTaskIds = new Set(
        taskProgress.filter(p => p.completed).map(p => p.taskId)
      );
    } else if (preparation) {
      // För buddyförberedelser - använd BuddyPreparationTaskProgress
      const preparationTaskProgress = await prisma.buddyPreparationTaskProgress.findMany({
        where: { preparationId: employeeId },
        select: { taskId: true, completed: true }
      });

      completedTaskIds = new Set(
        preparationTaskProgress.filter(p => p.completed).map(p => p.taskId)
      );
    }

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
      employee: personData
    });

  } catch (error) {
    console.error("Error fetching employee checklist:", error);
    return NextResponse.json(
      { error: "Failed to fetch checklist" },
      { status: 500 }
    );
  }
}
