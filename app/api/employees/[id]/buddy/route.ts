import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>
}

  // PATCH /api/employees/[id]/buddy - Uppdatera buddytilldelning för en medarbetare (single or multi)
export async function PATCH(request: NextRequest, context: RouteContext) {
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

    // Hämta medarbetare-id från URL:en
    const params = await context.params;
    const { id } = params;

        // Hämta och validera begäransdata
    const body = await request.json();
    const { buddyId, additionalBuddyId } = body as {
      buddyId?: string | null;
      additionalBuddyId?: string | null;
    };

    // Debug-loggning
    console.log('API Request Body:', body);
    console.log('buddyId:', buddyId);

    // buddyId kan vara null för att ta bort buddy
    if (buddyId !== undefined && buddyId !== null && (typeof buddyId !== 'string' || buddyId.trim() === '')) {
      return NextResponse.json(
        { error: 'Ogiltigt buddyID' },
        { status: 400 }
      );
    }
    if (additionalBuddyId !== undefined && additionalBuddyId !== null && (typeof additionalBuddyId !== 'string' || additionalBuddyId.trim() === '')) {
      return NextResponse.json(
        { error: 'Ogiltigt additionalBuddyId' },
        { status: 400 }
      );
    }

    // Verifiera att medarbetaren finns och tillhör användarens organisation
    const employee = await prisma.user.findUnique({
      where: {
        id: id
      }
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Medarbetaren hittades inte' },
        { status: 404 }
      );
    }

    if (employee.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Om buddyId inte är null, verifiera att buddyanvändaren finns
    if (buddyId !== null && buddyId !== undefined) {
      const buddy = await prisma.user.findUnique({
        where: {
          id: buddyId
        }
      });

      if (!buddy) {
        return NextResponse.json(
          { error: 'Buddy-användaren hittades inte' },
          { status: 404 }
        );
      }

      if (buddy.organizationId !== session.user.organizationId) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }

      // Kontrollera om buddy och medarbetare är samma person
      if (id === buddyId) {
        return NextResponse.json(
          { error: 'En medarbetare kan inte vara sin egen buddy' },
          { status: 400 }
        );
      }
    }
    if (additionalBuddyId !== null && additionalBuddyId !== undefined) {
      const buddy = await prisma.user.findUnique({ where: { id: additionalBuddyId } });
      if (!buddy) {
        return NextResponse.json({ error: 'Buddy-användaren (extra) hittades inte' }, { status: 404 });
      }
      if (buddy.organizationId !== session.user.organizationId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (id === additionalBuddyId) {
        return NextResponse.json({ error: 'En medarbetare kan inte vara sin egen buddy' }, { status: 400 });
      }
    }



        // Enkel single-buddy hantering
    const updatedEmployee = await prisma.user.update({
      where: { id },
      data: { buddyId: buddyId ?? null },
      include: { buddy: { select: { id: true, name: true, email: true } } }
    });

    // Keep assignments in sync: ensure the single buddy is assigned; remove others
    await prisma.buddyAssignment.deleteMany({ where: { userId: id } });
    if (buddyId) {
      await prisma.buddyAssignment.create({ data: { userId: id, buddyId } });
    }

    return NextResponse.json({
      id: updatedEmployee?.id ?? id,
      buddyId: (updatedEmployee as any)?.buddyId ?? null,
      buddy: (updatedEmployee as any)?.buddy ?? null
    });

  } catch (error) {
    console.error('Fel vid uppdatering av buddy:', error);
    return NextResponse.json(
      { error: 'Kunde inte uppdatera buddy' },
      { status: 500 }
    );
  }
}