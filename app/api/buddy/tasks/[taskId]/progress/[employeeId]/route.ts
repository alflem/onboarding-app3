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

    // Kontrollera att den anställda existerar och att användaren är buddy
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
      employee: {
        id: employee.id,
        name: employee.name
      }
    });

  } catch (error) {
    console.error("Error updating employee task progress:", error);
    return NextResponse.json(
      { error: "Failed to update task progress" },
      { status: 500 }
    );
  }
}
