import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

// PATCH /api/categories/reorder - Ändra ordningen på flera kategorier
export async function PATCH(request: NextRequest) {
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

    if (!body.categories || !Array.isArray(body.categories) || body.categories.length === 0) {
      return NextResponse.json(
        { error: 'Kategorier krävs' },
        { status: 400 }
      );
    }

    interface CategoryOrder {
      id: string;
      order: number;
    }

    // Kontrollera om alla kategorier har id och order
    const isValid = body.categories.every((cat: CategoryOrder) =>
      cat.id && (cat.order !== undefined && cat.order !== null)
    );

    if (!isValid) {
      return NextResponse.json(
        { error: 'Alla kategorier måste ha id och order' },
        { status: 400 }
      );
    }

    interface CategoryOrder {
      id: string;
      order: number;
    }

    // Hämta alla kategorier som ska uppdateras för att verifiera ägarskap
    const categoryIds = body.categories.map((cat: CategoryOrder) => cat.id);

    const existingCategories = await prisma.category.findMany({
      where: {
        id: {
          in: categoryIds
        }
      },
      include: {
        checklist: {
          select: {
            organizationId: true
          }
        }
      }
    });

    // Kontrollera om alla kategorier finns
    if (existingCategories.length !== categoryIds.length) {
      return NextResponse.json(
        { error: 'En eller flera kategorier hittades inte' },
        { status: 404 }
      );
    }

    // Kontrollera om användaren har tillgång till alla kategorier
    const hasAccess = existingCategories.every(
      cat => cat.checklist.organizationId === session.user.organization.id
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    interface CategoryOrder {
      id: string;
      order: number;
    }

    // Uppdatera kategoriernas ordning i databasen
    const updatePromises = body.categories.map((cat: CategoryOrder) =>
      prisma.category.update({
        where: {
          id: cat.id
        },
        data: {
          order: cat.order
        }
      })
    );

    const updatedCategories = await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      categories: updatedCategories
    });

  } catch (error) {
    console.error('Fel vid omsortering av kategorier:', error);
    return NextResponse.json(
      { error: 'Kunde inte uppdatera ordningen på kategorier' },
      { status: 500 }
    );
  }
}