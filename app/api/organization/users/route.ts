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

    // Hämta alla användare för användarens organisation (alla roller)
    const users = await prisma.user.findMany({
      where: {
        organizationId: organizationId
      },
      include: {
        buddy: true,
        progress: {
          include: {
            task: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Beräkna progress för varje användare
    const usersWithProgress = users.map((user: typeof users[0]) => {
      // Räkna ut progress-procent
      const completedTasks = user.progress.filter((p: typeof user.progress[0]) => p.completed).length;
      const totalTasks = user.progress.length;
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