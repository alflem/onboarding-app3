import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ taskId: string; employeeId: string }>
}

// POST /api/buddy/tasks/[taskId]/progress/[employeeId] - Uppdatera task progress för en specifik anställd (för buddy)
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId, employeeId } = await context.params;
    const { completed } = await request.json();

    // Validera input
    if (typeof completed !== "boolean") {
      return NextResponse.json(
        { error: "Invalid input. 'completed' must be a boolean." },
        { status: 400 }
      );
    }

    // Kontrollera att uppgiften existerar och är en buddy-uppgift
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (!task.isBuddyTask) {
      return NextResponse.json({ error: "This is not a buddy task" }, { status: 403 });
    }

    // Kontrollera om det är en anställd eller en förberedelse
    let employee = null;
    let preparation = null;
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
      // Kontrollera buddy-relation
      const isBuddyLegacy = employee.buddyId === session.user.id;
      const isBuddyAssignment = employee.buddyAssignments.length > 0;

      if (!isBuddyLegacy && !isBuddyAssignment) {
        return NextResponse.json({ error: "Not authorized to update this employee's tasks" }, { status: 403 });
      }

      // Kontrollera att organisationen har buddy-funktionen aktiverad
      if (!employee.organization?.buddyEnabled) {
        return NextResponse.json({ error: "Buddy function not enabled for this organization" }, { status: 403 });
      }

      personData = {
        id: employee.id,
        name: employee.name,
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
        return NextResponse.json({ error: "Not authorized to update this preparation's tasks" }, { status: 403 });
      }

      // Kontrollera att organisationen har buddy-funktionen aktiverad
      if (!preparation.organization?.buddyEnabled) {
        return NextResponse.json({ error: "Buddy function not enabled for this organization" }, { status: 403 });
      }

      personData = {
        id: preparation.id,
        name: `${preparation.firstName} ${preparation.lastName}`,
        type: 'preparation' as const
      };
    }

    // Uppdatera eller skapa framsteg för den specifika anställda
    const taskProgress = await prisma.taskProgress.upsert({
      where: {
        userId_taskId: {
          userId: employeeId,
          taskId,
        },
      },
      update: {
        completed,
      },
      create: {
        userId: employeeId,
        taskId,
        completed,
      },
    });

    return NextResponse.json({
      success: true,
      taskProgress,
      employee: personData
    });

  } catch (error) {
    console.error("Error updating employee task progress:", error);
    return NextResponse.json(
      { error: "Failed to update task progress" },
      { status: 500 }
    );
  }
}
