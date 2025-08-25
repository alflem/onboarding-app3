import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/organization/users - Hämta alla användare för användarens organisation
export async function GET() {
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

    // Hämta organisationsid från användarsessionen
    const organizationId = session.user.organizationId;

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 });
    }

    // Hämta checklistan för organisationen först
    const checklist = await prisma.checklist.findUnique({
      where: { organizationId: organizationId },
      include: {
        categories: {
          include: {
            tasks: {
              select: { id: true, isBuddyTask: true }
            }
          }
        }
      }
    });

    if (!checklist) {
      return NextResponse.json({ error: 'Checklist not found' }, { status: 404 });
    }

    // Hämta alla användare för användarens organisation (alla roller)
    const users = await prisma.user.findMany({
      where: {
        organizationId: organizationId
      },
      include: {
        buddy: true,
        progress: {
          select: { taskId: true, completed: true }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Beräkna progress för varje användare baserat på checklistans uppgifter
    const usersWithProgress = users.map((user: typeof users[0]) => {
      // Skapa en Set av slutförda uppgifts-ID:n för snabbare lookup
      const completedTaskIds = new Set(
        user.progress
          .filter((p: typeof user.progress[0]) => p.completed)
          .map((p: typeof user.progress[0]) => p.taskId)
      );

      // Räkna totala och slutförda uppgifter från checklistan
      let totalTasks = 0;
      let completedTasks = 0;

      checklist.categories.forEach((category: typeof checklist.categories[0]) => {
        category.tasks.forEach((task: typeof category.tasks[0]) => {
          // Exkludera buddy-uppgifter från progress-beräkningen för vanliga användare
          if (!task.isBuddyTask) {
            totalTasks++;
            if (completedTaskIds.has(task.id)) {
              completedTasks++;
            }
          }
        });
      });

      // Beräkna progress-procent
      const progressPercentage = totalTasks > 0
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        progress: progressPercentage,
        hasBuddy: user.buddyId !== null,
        createdAt: user.createdAt
      };
    });

    return NextResponse.json(usersWithProgress);

  } catch (error) {
    console.error('Fel vid hämtning av användare:', error);
    return NextResponse.json(
      { error: 'Kunde inte hämta användare' },
      { status: 500 }
    );
  }
}