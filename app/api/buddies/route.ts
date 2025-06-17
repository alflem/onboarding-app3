import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/buddies - Hämta alla möjliga buddies för användarens organisation
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

    // Kontrollera om buddyfunktionen är aktiverad för organisationen
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { buddyEnabled: true }
    });

    if (!organization || !organization.buddyEnabled) {
      return NextResponse.json([]);
    }

    // Hämta alla möjliga buddies (personal som kan vara buddies)
    // Detta kan vara alla användare utom EMPLOYEE, men kan anpassas efter behov
    const buddies = await prisma.user.findMany({
      where: {
        organizationId: organizationId,
        role: {
          in: ['ADMIN', 'SUPER_ADMIN'] // Endast användare med dessa roller kan vara buddies
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Förenkla resultatet till bara id och namn för API-svaret
    const simplifiedBuddies = buddies.map((buddy: { id: string; name: string }) => ({
      id: buddy.id,
      name: buddy.name
    }));

    return NextResponse.json(simplifiedBuddies);

  } catch (error) {
    console.error('Fel vid hämtning av buddies:', error);
    return NextResponse.json(
      { error: 'Kunde inte hämta buddies' },
      { status: 500 }
    );
  }
}