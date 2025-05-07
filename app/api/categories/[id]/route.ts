import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

// Ändra interface för att bättre matcha Next.js förväntningar
// Next.js App Router förväntar sig att params är en Promise
interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/categories/[id] - Hämta en specifik kategori
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

    // Hämta kategori-id från URL:en - nu med await eftersom params är en Promise
    const params = await context.params;
    const { id } = params;

    // Hämta kategori från databasen
    const category = await prisma.category.findUnique({
      where: {
        id: id
      },
      include: {
        template: {
          select: {
            organizationId: true
          }
        },
        tasks: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    // Kontrollera om kategorin finns
    if (!category) {
      return NextResponse.json(
        { error: 'Kategorin hittades inte' },
        { status: 404 }
      );
    }

    // Kontrollera om användaren har tillgång till kategorin
    if (category.template.organizationId !== session.user.organization.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json(category);

  } catch (error) {
    console.error('Fel vid hämtning av kategori:', error);
    return NextResponse.json(
      { error: 'Kunde inte hämta kategori' },
      { status: 500 }
    );
  }
}

// PATCH /api/categories/[id] - Uppdatera en kategori
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

    // Hämta kategori-id från URL:en - nu med await eftersom params är en Promise
    const params = await context.params;
    const { id } = params;

    // Hämta existerande kategori för att verifiera ägarskap
    const existingCategory = await prisma.category.findUnique({
      where: {
        id: id
      },
      include: {
        template: {
          select: {
            organizationId: true
          }
        }
      }
    });

    // Kontrollera om kategorin finns
    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Kategorin hittades inte' },
        { status: 404 }
      );
    }

    // Kontrollera om användaren har tillgång till kategorin
    if (existingCategory.template.organizationId !== session.user.organization.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Hämta och validera begäransdata
    const body = await request.json();

    // Uppdatera kategori i databasen
    const updatedCategory = await prisma.category.update({
      where: {
        id: id
      },
      data: {
        name: body.name ? body.name.trim() : undefined,
        order: body.order !== undefined ? body.order : undefined
      }
    });

    return NextResponse.json(updatedCategory);

  } catch (error) {
    console.error('Fel vid uppdatering av kategori:', error);
    return NextResponse.json(
      { error: 'Kunde inte uppdatera kategori' },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[id] - Ta bort en kategori
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

    // Hämta kategori-id från URL:en - nu med await eftersom params är en Promise
    const params = await context.params;
    const { id } = params;

    // Hämta existerande kategori för att verifiera ägarskap
    const existingCategory = await prisma.category.findUnique({
      where: {
        id: id
      },
      include: {
        template: {
          select: {
            organizationId: true
          }
        }
      }
    });

    // Kontrollera om kategorin finns
    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Kategorin hittades inte' },
        { status: 404 }
      );
    }

    // Kontrollera om användaren har tillgång till kategorin
    if (existingCategory.template.organizationId !== session.user.organization.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Ta först bort alla uppgifter i kategorin
    await prisma.task.deleteMany({
      where: {
        categoryId: id
      }
    });

    // Ta sedan bort kategorin
    await prisma.category.delete({
      where: {
        id: id
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Fel vid borttagning av kategori:', error);
    return NextResponse.json(
      { error: 'Kunde inte ta bort kategori' },
      { status: 500 }
    );
  }
}