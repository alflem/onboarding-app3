import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/templates - Hämta alla mallar för användarens organisation
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
    const organizationId = session.user.organization?.id;

    // Hämta alla mallar för användarens organisation
    const templates = await prisma.template.findMany({
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Beräkna antalet uppgifter för varje mall
    const templatesWithCounts = templates.map(template => {
      // Räkna totalt antal uppgifter genom att summera för varje kategori
      const tasksCount = template.categories.reduce(
        (sum, category) => sum + category._count.tasks,
        0
      );

      return {
        id: template.id,
        name: template.name,
        organizationId: template.organizationId,
        categoriesCount: template._count.categories,
        tasksCount: tasksCount,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt
      };
    });

    return NextResponse.json(templatesWithCounts);

  } catch (error) {
    console.error('Fel vid hämtning av mallar:', error);
    return NextResponse.json(
      { error: 'Kunde inte hämta mallar' },
      { status: 500 }
    );
  }
}

// POST /api/templates - Skapa en ny mall
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

    // Hämta och validera begäransdata
    const body = await request.json();

    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return NextResponse.json(
        { error: 'Mallnamn krävs' },
        { status: 400 }
      );
    }

    // Hämta organisationsid från användarsessionen
    const organizationId = session.user.organization?.id;

    // Skapa ny mall i databasen
    const newTemplate = await prisma.template.create({
      data: {
        name: body.name.trim(),
        organization: {
          connect: {
            id: organizationId
          }
        }
      }
    });

    // Returnera den skapade mallen med räkningen satt till 0
    return NextResponse.json({
      id: newTemplate.id,
      name: newTemplate.name,
      organizationId: newTemplate.organizationId,
      categoriesCount: 0,
      tasksCount: 0,
      createdAt: newTemplate.createdAt,
      updatedAt: newTemplate.updatedAt
    });

  } catch (error) {
    console.error('Fel vid skapande av mall:', error);
    return NextResponse.json(
      { error: 'Kunde inte skapa mall' },
      { status: 500 }
    );
  }
}