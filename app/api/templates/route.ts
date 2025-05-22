import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/templates - Hämta checklista för användarens organisation
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
    const organizationId = session.user.organization.id;

    // Hämta checklistan för användarens organisation
    const checklist = await prisma.checklist.findFirst({
      where: {
        organizationId: organizationId
      },
      include: {
        _count: {
          select: {
            categories: true
          }
        },
        categories: {
          include: {
            _count: {
              select: {
                tasks: true
              }
            }
          }
        }
      }
    });

    if (!checklist) {
      return NextResponse.json([]);
    }

    // Beräkna antalet uppgifter
    const tasksCount = checklist.categories.reduce(
      (sum, category) => sum + category._count.tasks,
      0
    );

    const checklistWithCounts = {
      id: checklist.id,
      organizationId: checklist.organizationId,
      categoriesCount: checklist._count.categories,
      tasksCount: tasksCount,
      createdAt: checklist.createdAt,
      updatedAt: checklist.updatedAt
    };

    // Returnera som en array för kompatibilitet med existerande kod
    return NextResponse.json([checklistWithCounts]);

  } catch (error) {
    console.error('Fel vid hämtning av checklista:', error);
    return NextResponse.json(
      { error: 'Kunde inte hämta checklista' },
      { status: 500 }
    );
  }
}

// POST /api/templates - Skapa eller uppdatera organisationens checklista
export async function POST(request: NextRequest) {
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
    const organizationId = session.user.organization.id;

    // Kontrollera om det redan finns en checklista för organisationen
    const existingChecklist = await prisma.checklist.findFirst({
      where: {
        organizationId: organizationId
      }
    });

    let checklist;

    if (existingChecklist) {
      // Om en checklista redan finns, returnera den befintliga
      checklist = existingChecklist;
    } else {
      // Skapa ny checklista om det inte finns någon
      checklist = await prisma.checklist.create({
        data: {
          organization: {
            connect: {
              id: organizationId
            }
          }
        }
      });
    }

    // Returnera checklistan
    return NextResponse.json({
      id: checklist.id,
      organizationId: checklist.organizationId,
      categoriesCount: 0,
      tasksCount: 0,
      createdAt: checklist.createdAt,
      updatedAt: checklist.updatedAt
    });

  } catch (error) {
    console.error('Fel vid hantering av checklista:', error);
    return NextResponse.json(
      { error: 'Kunde inte hantera checklista' },
      { status: 500 }
    );
  }
}