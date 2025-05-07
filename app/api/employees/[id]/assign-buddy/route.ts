import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

// Ändrat från Props till RouteContext för att matcha Next.js typkonvention
interface RouteContext {
  params: Promise<{ id: string }>
}

// POST /api/employees/[id]/assign-buddy - Tilldela en buddy till en medarbetare
export async function POST(request: NextRequest, context: RouteContext) {
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

    // Hämta medarbetare-id från URL:en - med await eftersom params är Promise
    const params = await context.params;
    const { id } = params;

    // Hämta och validera begäransdata
    const body = await request.json();

    if (!body.buddyId || typeof body.buddyId !== 'string') {
      return NextResponse.json(
        { error: 'Buddy-ID krävs' },
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

    // Verifiera att buddy-användaren finns och tillhör samma organisation
    const buddy = await prisma.user.findUnique({
      where: {
        id: body.buddyId
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
    if (id === body.buddyId) {
      return NextResponse.json(
        { error: 'En medarbetare kan inte vara sin egen buddy' },
        { status: 400 }
      );
    }

    // Uppdatera användaren med den nya buddy-relationen
    const updatedEmployee = await prisma.user.update({
      where: {
        id: id
      },
      data: {
        buddyId: body.buddyId
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
    console.error('Fel vid tilldelning av buddy:', error);
    return NextResponse.json(
      { error: 'Kunde inte tilldela buddy' },
      { status: 500 }
    );
  }
}