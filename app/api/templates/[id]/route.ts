import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

// Ändra interface för att matcha Next.js typkonvention
interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/templates/[id] - Hämta en specifik checklista
export async function GET(request: NextRequest, context: RouteContext) {
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

    // Hämta checklista-id från URL:en - med await eftersom params är Promise
    const params = await context.params;
    const { id } = params;

    // Hämta checklista från databasen, inklusive kategorier och uppgifter
    const checklist = await prisma.checklist.findUnique({
      where: {
        id: id
      },
      include: {
        organization: true,
        categories: {
          orderBy: {
            order: 'asc'
          },
          include: {
            tasks: {
              orderBy: {
                order: 'asc'
              }
            }
          }
        }
      }
    });

    // Kontrollera om checklistan finns
    if (!checklist) {
      return NextResponse.json(
        { error: 'Checklistan hittades inte' },
        { status: 404 }
      );
    }

    // Kontrollera om användaren har tillgång till checklistan
    if (checklist.organizationId !== session.user.organization.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json(checklist);

  } catch (error) {
    console.error('Fel vid hämtning av checklista:', error);
    return NextResponse.json(
      { error: 'Kunde inte hämta checklista' },
      { status: 500 }
    );
  }
}

// PATCH /api/templates/[id] - Uppdatera checklistan
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

    // Hämta checklista-id från URL:en - med await eftersom params är Promise
    const params = await context.params;
    const { id } = params;

    // Hämta data från request body
    const data = await request.json();
    const { name } = data;

    // Hitta checklistan för att verifiera ägarskap
    const checklist = await prisma.checklist.findUnique({
      where: {
        id: id
      }
    });

    if (!checklist) {
      return NextResponse.json(
        { error: 'Checklistan hittades inte' },
        { status: 404 }
      );
    }

    // Kontrollera om användaren har tillgång till checklistan
    if (checklist.organizationId !== session.user.organization.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Uppdatera namn på Organization istället för Checklist (som inte har name-fält)
    const updatedOrganization = await prisma.organization.update({
      where: {
        id: checklist.organizationId
      },
      data: {
        name: name
      }
    });

    return NextResponse.json({
      ...checklist,
      name: updatedOrganization.name
    });

  } catch (error) {
    console.error('Fel vid uppdatering av checklista:', error);
    return NextResponse.json(
      { error: 'Kunde inte uppdatera checklista' },
      { status: 500 }
    );
  }
}

// DELETE /api/templates/[id] - Ta bort en checklista är inte tillåtet
export async function DELETE(_request: NextRequest, _context: RouteContext) {
  return NextResponse.json(
    { error: 'Method not allowed - checklistor kan inte tas bort' },
    { status: 405 }
  );
}