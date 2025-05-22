// app/api/checklist/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";
import { Checklist, Category, Task } from "@prisma/client";

type ChecklistWithRelations = Checklist & {
  categories: (Category & {
    tasks: Task[];
  })[];
};

export async function GET() {
  try {
    // Hämta användarens session
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Hämta användaren med organisation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "User has no organization" }, { status: 404 });
    }

    // Hämta checklistan för användarens organisation
    const checklist = await prisma.checklist.findFirst({
      where: { organizationId: user.organizationId },
      include: {
        categories: {
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    }) as ChecklistWithRelations | null;

    if (!checklist) {
      return NextResponse.json({ error: "No checklist found for organization" }, { status: 404 });
    }

    // Hämta användarens framsteg för alla uppgifter
    const taskProgress = await prisma.taskProgress.findMany({
      where: { userId }
    });

    // Skapa en map för enkel lookup av task completion status
    const progressMap = new Map();
    taskProgress.forEach(progress => {
      progressMap.set(progress.taskId, progress.completed);
    });

    // Kombinera data från checklistan och användarens framsteg
    const checklistData = {
      categories: checklist.categories.map(category => ({
        id: category.id,
        name: category.name,
        order: category.order,
        tasks: category.tasks.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          isBuddyTask: task.isBuddyTask,
          order: task.order,
          // Använd progressMap för att avgöra om en uppgift är slutförd
          // Om ingen framstegsinformation finns, är uppgiften inte slutförd
          completed: progressMap.has(task.id) ? progressMap.get(task.id) : false
        }))
      }))
    };

    return NextResponse.json(checklistData);
  } catch (error) {
    console.error("Error fetching checklist:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}