import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

// Ändra interface för att matcha Next.js typkonvention
interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/templates/[id] - Hämta en specifik mall
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

    // Hämta mall-id från URL:en - med await eftersom params är Promise
    const params = await context.params;
    const { id } = params;

    // Hämta mall från databasen, inklusive kategorier och uppgifter
    const template = await prisma.template.findUnique({
      where: {
        id: id
      },
      include: {
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

    // Kontrollera om mallen finns
    if (!template) {
      return NextResponse.json(
        { error: 'Mallen hittades inte' },
        { status: 404 }
      );
    }

    // Kontrollera om användaren har tillgång till mallen
    if (template.organizationId !== session.user.organization.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json(template);

  } catch (error) {
    console.error('Fel vid hämtning av mall:', error);
    return NextResponse.json(
      { error: 'Kunde inte hämta mall' },
      { status: 500 }
    );
  }
}

// PATCH /api/templates/[id] - Uppdatera en mall
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

    // Hämta mall-id från URL:en - med await eftersom params är Promise
    const params = await context.params;
    const { id } = params;

    // Hämta existerande mall för att verifiera ägarskap
    const existingTemplate = await prisma.template.findUnique({
      where: {
        id: id
      }
    });

    // Kontrollera om mallen finns
    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Mallen hittades inte' },
        { status: 404 }
      );
    }

    // Kontrollera om användaren har tillgång till mallen
    if (existingTemplate.organizationId !== session.user.organization.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Hämta och validera begäransdata
    const body = await request.json();

    // Uppdatera mall i databasen
    const updatedTemplate = await prisma.template.update({
      where: {
        id: id
      },
      data: {
        name: body.name ? body.name.trim() : undefined
      }
    });

    return NextResponse.json(updatedTemplate);

  } catch (error) {
    console.error('Fel vid uppdatering av mall:', error);
    return NextResponse.json(
      { error: 'Kunde inte uppdatera mall' },
      { status: 500 }
    );
  }
}

// DELETE /api/templates/[id] - Ta bort en mall
export async function DELETE(request: NextRequest, context: RouteContext) {
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

    // Hämta mall-id från URL:en - med await eftersom params är Promise
    const params = await context.params;
    const { id } = params;

    // Hämta existerande mall för att verifiera ägarskap
    const existingTemplate = await prisma.template.findUnique({
      where: {
        id: id
      }
    });

    // Kontrollera om mallen finns
    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Mallen hittades inte' },
        { status: 404 }
      );
    }

    // Kontrollera om användaren har tillgång till mallen
    if (existingTemplate.organizationId !== session.user.organization.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Ta först bort alla uppgifter i mallen
    await prisma.task.deleteMany({
      where: {
        category: {
          templateId: id
        }
      }
    });

    // Ta sedan bort alla kategorier i mallen
    await prisma.category.deleteMany({
      where: {
        templateId: id
      }
    });

    // Slutligen ta bort själva mallen
    await prisma.template.delete({
      where: {
        id: id
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Fel vid borttagning av mall:', error);
    return NextResponse.json(
      { error: 'Kunde inte ta bort mall' },
      { status: 500 }
    );
  }
}