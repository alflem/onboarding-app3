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
    const { buddyId, additionalBuddyId, mode, buddyIds } = body as {
      buddyId?: string | null;
      additionalBuddyId?: string | null;
      mode?: 'single' | 'multi';
      buddyIds?: string[];
    };

    // Debug-loggning
    console.log('API Request Body:', body);
    console.log('buddyIds:', buddyIds);
    console.log('mode:', mode);

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

    // Validera buddyIds array om den finns
    if (buddyIds && (!Array.isArray(buddyIds) || buddyIds.some(id => typeof id !== 'string' || id.trim() === ''))) {
      return NextResponse.json(
        { error: 'Ogiltig buddyIds array' },
        { status: 400 }
      );
    }

    // Validera att alla buddies i buddyIds arrayen finns och tillhör rätt organisation
    if (buddyIds && Array.isArray(buddyIds)) {
      for (const bId of buddyIds) {
        const buddy = await prisma.user.findUnique({ where: { id: bId } });
        if (!buddy) {
          return NextResponse.json({ error: `Buddy-användaren med ID ${bId} hittades inte` }, { status: 404 });
        }
        if (buddy.organizationId !== session.user.organizationId) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        if (id === bId) {
          return NextResponse.json({ error: 'En medarbetare kan inte vara sin egen buddy' }, { status: 400 });
        }
      }
    }

    let updatedEmployee;
    if (mode === 'multi') {
      // Handle multiple buddies via buddyIds array
      if (buddyIds && Array.isArray(buddyIds)) {
        console.log('Processing buddyIds array:', buddyIds);

        // Clear existing assignments
        await prisma.buddyAssignment.deleteMany({ where: { userId: id } });
        console.log('Cleared existing assignments for user:', id);

        // Create new assignments for all selected buddies
        for (const bId of buddyIds) {
          console.log('Creating assignment for buddy:', bId);
          await prisma.buddyAssignment.create({
            data: { userId: id, buddyId: bId }
          });
        }
        console.log('Created assignments for all buddies');

        // Set the first buddy as the primary buddy for legacy compatibility
        const primaryBuddyId = buddyIds.length > 0 ? buddyIds[0] : null;
        console.log('Setting primary buddy:', primaryBuddyId);
        updatedEmployee = await prisma.user.update({
          where: { id },
          data: { buddyId: primaryBuddyId },
          include: { buddy: { select: { id: true, name: true, email: true } } }
        });
      } else {
        // Legacy support for buddyId + additionalBuddyId
        if (buddyId !== undefined) {
          updatedEmployee = await prisma.user.update({ where: { id }, data: { buddyId }, include: { buddy: { select: { id: true, name: true, email: true } } } });
        } else {
          updatedEmployee = await prisma.user.findUnique({ where: { id }, include: { buddy: true } });
        }
        // Upsert BuddyAssignment(s)
        const toCreate: string[] = [];
        if (buddyId) toCreate.push(buddyId);
        if (additionalBuddyId) toCreate.push(additionalBuddyId);
        for (const bId of toCreate) {
          await prisma.buddyAssignment.upsert({
            where: { userId_buddyId: { userId: id, buddyId: bId } as any },
            update: {},
            create: { userId: id, buddyId: bId }
          } as any);
        }
        // If buddyId === null and no additional specified, clear all assignments
        if (buddyId === null && !additionalBuddyId) {
          await prisma.buddyAssignment.deleteMany({ where: { userId: id } });
        }
      }
    } else {
      // Default: single mode
      updatedEmployee = await prisma.user.update({
        where: { id },
        data: { buddyId: buddyId ?? null },
        include: { buddy: { select: { id: true, name: true, email: true } } }
      });
      // Keep assignments in sync: ensure the single buddy is assigned; remove others
      await prisma.buddyAssignment.deleteMany({ where: { userId: id } });
      if (buddyId) {
        await prisma.buddyAssignment.create({ data: { userId: id, buddyId } });
      }
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