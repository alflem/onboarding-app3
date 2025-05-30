import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>
}

// PATCH /api/employees/[id]/buddy - Uppdatera buddy-tilldelning för en medarbetare
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
    const { buddyId } = body;

    // buddyId kan vara null för att ta bort buddy
    if (buddyId !== null && (typeof buddyId !== 'string' || buddyId.trim() === '')) {
      return NextResponse.json(
        { error: 'Ogiltigt buddy-ID' },
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

    if (employee.organizationId !== session.user.organization.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Om buddyId inte är null, verifiera att buddy-användaren finns
    if (buddyId !== null) {
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

      if (buddy.organizationId !== session.user.organization.id) {
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

    // Uppdatera användaren med den nya buddy-relationen (eller ta bort den)
    const updatedEmployee = await prisma.user.update({
      where: {
        id: id
      },
      data: {
        buddyId: buddyId
      },
      include: {
        buddy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      id: updatedEmployee.id,
      buddyId: updatedEmployee.buddyId,
      buddy: updatedEmployee.buddy
    });

  } catch (error) {
    console.error('Fel vid uppdatering av buddy:', error);
    return NextResponse.json(
      { error: 'Kunde inte uppdatera buddy' },
      { status: 500 }
    );
  }
}