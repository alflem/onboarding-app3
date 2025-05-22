import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

// POST /api/categories - Skapa en ny kategori
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
        { error: 'Kategorinamn krävs' },
        { status: 400 }
      );
    }

    if (!body.checklistId) {
      return NextResponse.json(
        { error: 'Checklist ID krävs' },
        { status: 400 }
      );
    }

    // Hitta checklistan för att verifiera ägarskap
    const checklist = await prisma.checklist.findUnique({
      where: {
        id: body.checklistId
      }
    });

    if (!checklist) {
      return NextResponse.json(
        { error: 'Checklistan hittades inte' },
        { status: 404 }
      );
    }

    // Kontrollera att användaren har tillgång till checklistan
    if (checklist.organizationId !== session.user.organization.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Skapa ny kategori i databasen
    const newCategory = await prisma.category.create({
      data: {
        name: body.name.trim(),
        order: body.order || 0,
        checklist: {
          connect: {
            id: body.checklistId
          }
        }
      }
    });

    return NextResponse.json(newCategory);

  } catch (error) {
    console.error('Fel vid skapande av kategori:', error);
    return NextResponse.json(
      { error: 'Kunde inte skapa kategori' },
      { status: 500 }
    );
  }
}