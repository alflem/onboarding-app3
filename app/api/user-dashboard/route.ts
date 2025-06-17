// app/api/user-dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Hämta användaren med organisation och progress
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organization: true,
        progress: {
          include: {
            task: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "User has no organization" }, { status: 400 });
    }

    // Hämta organisationens checklist för att beräkna total progress
    const checklist = await prisma.checklist.findFirst({
      where: { organizationId: user.organizationId },
      include: {
        categories: {
          include: {
            tasks: true,
          },
        },
      },
    });

    // Beräkna progress (exkludera buddyuppgifter)
    let totalTasks = 0;
    let completedTasks = 0;

    if (checklist) {
      checklist.categories.forEach((category: typeof checklist.categories[0]) => {
        category.tasks.forEach((task: typeof category.tasks[0]) => {
          // Exkludera buddyuppgifter från progress-beräkningen
          if (!task.isBuddyTask) {
            totalTasks++;
            // Kontrollera om denna uppgift är avklarad av användaren
            const taskProgress = user.progress.find((p: typeof user.progress[0]) => p.taskId === task.id);
            if (taskProgress && taskProgress.completed) {
              completedTasks++;
            }
          }
        });
      });
    }

    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      organization: user.organization,
      progress: progressPercentage,
      completedTasks,
      totalTasks,
      recentTasks: user.progress
        .filter((p: typeof user.progress[0]) => p.completed)
        .sort((a: typeof user.progress[0], b: typeof user.progress[0]) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 3) // Hämta de 3 senast avklarade uppgifterna
        .map((p: typeof user.progress[0]) => ({
          id: p.taskId,
          title: p.task.title,
          description: p.task.description,
          completedAt: p.updatedAt,
        })),
    });
  } catch (error) {
    console.error("Error fetching user dashboard data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}