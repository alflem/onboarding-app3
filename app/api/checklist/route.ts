// app/api/checklist/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

type ChecklistWithRelations = {
  id: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  categories: {
    id: string;
    name: string;
    checklistId: string;
    order: number;
    createdAt: Date;
    updatedAt: Date;
    tasks: {
      id: string;
      title: string;
      description: string | null;
      link: string | null;
      categoryId: string;
      order: number;
      isBuddyTask: boolean;
      createdAt: Date;
      updatedAt: Date;
    }[];
  }[];
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

    // Kontrollera om buddy-funktionen är aktiverad för organisationen
    const buddyEnabled = user.organization?.buddyEnabled || false;

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
    taskProgress.forEach((progress: typeof taskProgress[0]) => {
      progressMap.set(progress.taskId, progress.completed);
    });

    // Kombinera data från checklistan och användarens framsteg
    const checklistData = {
      categories: checklist.categories.map(category => ({
        id: category.id,
        name: category.name,
        order: category.order,
        tasks: category.tasks
          // Filtrera bort buddy-uppgifter om buddy-funktionen är avslagen
          .filter(task => buddyEnabled || !task.isBuddyTask)
          .map(task => ({
            id: task.id,
            title: task.title,
            description: task.description,
            link: task.link,
            isBuddyTask: task.isBuddyTask,
            order: task.order,
            // Använd progressMap för att avgöra om en uppgift är slutförd
            // Om ingen framstegsinformation finns, är uppgiften inte slutförd
            completed: progressMap.has(task.id) ? progressMap.get(task.id) : false
          }))
      }))
      // Ta bort kategorier som inte har några uppgifter kvar efter filtrering
      .filter(category => category.tasks.length > 0)
    };

    return NextResponse.json(checklistData);
  } catch (error) {
    console.error("Error fetching checklist:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}