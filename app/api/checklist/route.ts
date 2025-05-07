// app/api/checklist/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

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

    // Hämta mallen för användarens organisation
    const template = await prisma.template.findFirst({
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
    });

    if (!template) {
      return NextResponse.json({ error: "No template found for organization" }, { status: 404 });
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

    // Kombinera data från mallen och användarens framsteg
    const checklist = {
      categories: template.categories.map(category => ({
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

    return NextResponse.json(checklist);
  } catch (error) {
    console.error("Error fetching checklist:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}