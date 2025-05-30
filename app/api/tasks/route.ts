import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

// POST /api/tasks - Skapa en ny uppgift
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

    if (!body.title || typeof body.title !== 'string' || body.title.trim() === '') {
      return NextResponse.json(
        { error: 'Uppgiftstitel krävs' },
        { status: 400 }
      );
    }

    if (!body.categoryId) {
      return NextResponse.json(
        { error: 'Kategori ID krävs' },
        { status: 400 }
      );
    }

    // Hitta kategorin för att verifiera ägarskap
    const category = await prisma.category.findUnique({
      where: {
        id: body.categoryId
      },
      include: {
        checklist: {
          select: {
            organizationId: true
          }
        }
      }
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Kategorin hittades inte' },
        { status: 404 }
      );
    }

    // Kontrollera att användaren har tillgång till kategorin
    if (category.checklist.organizationId !== session.user.organization.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Skapa ny uppgift i databasen
    const newTask = await prisma.task.create({
      data: {
        title: body.title.trim(),
        description: body.description || "",
        link: body.link || null,
        isBuddyTask: body.isBuddyTask || false,
        order: body.order || 0,
        category: {
          connect: {
            id: body.categoryId
          }
        }
      }
    });

    // För varje användare i samma organisation som är av typen EMPLOYEE,
    // skapa en TaskProgress-post för den nya uppgiften
    await prisma.taskProgress.createMany({
      data: (await prisma.user.findMany({
        where: {
          organizationId: category.checklist.organizationId,
          role: 'EMPLOYEE'
        },
        select: {
          id: true
        }
      })).map(user => ({
        userId: user.id,
        taskId: newTask.id,
        completed: false
      })),
      skipDuplicates: true
    });

    return NextResponse.json(newTask);

  } catch (error) {
    console.error('Fel vid skapande av uppgift:', error);
    return NextResponse.json(
      { error: 'Kunde inte skapa uppgift' },
      { status: 500 }
    );
  }
}