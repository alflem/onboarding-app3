import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";
import { CreateBuddyPreparationData, UpdateBuddyPreparationData } from "@/types/buddy-preparation";
import { hasBuddyPreparationModel } from "@/types/prisma-extended";

// Note: This API requires the BuddyPreparation model migration to be run first
// Run: npx prisma migrate dev --name add_buddy_preparation

// GET /api/buddy-preparations - Hämta alla buddy preparations för användaren
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Kontrollera att användaren har behörighet
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if BuddyPreparation model exists (migration might not be run yet)
    if (!hasBuddyPreparationModel(prisma)) {
      return NextResponse.json({ preparations: [] });
    }

    // Hämta aktiva preparations för organisationen
    const preparations = await (prisma as any).buddyPreparation.findMany({
      where: {
        organizationId: session.user.organizationId!,
        isActive: true
      },
      include: {
        buddy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        linkedUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ preparations });
  } catch (error) {
    console.error('Error fetching buddy preparations:', error);
    return NextResponse.json({ preparations: [] });
  }
}

// POST /api/buddy-preparations - Skapa en ny buddy preparation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Kontrollera att användaren har behörighet
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { upcomingEmployeeName, upcomingEmployeeEmail, buddyId, notes }: CreateBuddyPreparationData = body;

    if (!upcomingEmployeeName) {
      return NextResponse.json({ error: 'Namn på blivande medarbetare krävs' }, { status: 400 });
    }

    // Check if BuddyPreparation model exists (migration might not be run yet)
    if (!hasBuddyPreparationModel(prisma)) {
      return NextResponse.json({ error: 'Buddy preparations feature not available yet. Please run database migration.' }, { status: 503 });
    }

    // Om buddyId inte anges, använd den inloggade användaren
    const finalBuddyId = buddyId || session.user.id;

    // Kontrollera att buddy tillhör samma organisation
    const buddy = await prisma.user.findUnique({
      where: { id: finalBuddyId }
    });

    if (!buddy || buddy.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Ogiltig buddy' }, { status: 400 });
    }

    // Skapa preparation
    const preparation = await (prisma as any).buddyPreparation.create({
      data: {
        buddyId: finalBuddyId,
        upcomingEmployeeName,
        upcomingEmployeeEmail,
        organizationId: session.user.organizationId!,
        notes
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

    return NextResponse.json({ preparation });
  } catch (error) {
    console.error('Error creating buddy preparation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/buddy-preparations - Uppdatera en buddy preparation (byta buddy)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Kontrollera att användaren har behörighet
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const preparationId = searchParams.get('id');
    const body = await request.json();
    const { buddyId, upcomingEmployeeName, upcomingEmployeeEmail, notes }: UpdateBuddyPreparationData = body;

    if (!preparationId) {
      return NextResponse.json({ error: 'Preparation ID krävs' }, { status: 400 });
    }

    // Check if BuddyPreparation model exists (migration might not be run yet)
    if (!hasBuddyPreparationModel(prisma)) {
      return NextResponse.json({ error: 'Buddy preparations feature not available yet. Please run database migration.' }, { status: 503 });
    }

    // Kontrollera att preparation tillhör användarens organisation
    const preparation = await (prisma as any).buddyPreparation.findUnique({
      where: { id: preparationId }
    });

    if (!preparation || preparation.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Preparation hittades inte' }, { status: 404 });
    }

    // Om ny buddyId anges, kontrollera att den nya buddyn tillhör samma organisation
    if (buddyId) {
      const buddy = await prisma.user.findUnique({
        where: { id: buddyId }
      });

      if (!buddy || buddy.organizationId !== session.user.organizationId) {
        return NextResponse.json({ error: 'Ogiltig buddy' }, { status: 400 });
      }
    }

    // Uppdatera preparation
    const updateData: UpdateBuddyPreparationData = {};
    if (buddyId !== undefined) updateData.buddyId = buddyId;
    if (upcomingEmployeeName !== undefined) updateData.upcomingEmployeeName = upcomingEmployeeName;
    if (upcomingEmployeeEmail !== undefined) updateData.upcomingEmployeeEmail = upcomingEmployeeEmail;
    if (notes !== undefined) updateData.notes = notes;

    const updatedPreparation = await (prisma as any).buddyPreparation.update({
      where: { id: preparationId },
      data: updateData,
      include: {
        buddy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        linkedUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({ preparation: updatedPreparation });
  } catch (error) {
    console.error('Error updating buddy preparation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/buddy-preparations - Avaktivera en buddy preparation
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const preparationId = searchParams.get('id');

    if (!preparationId) {
      return NextResponse.json({ error: 'Preparation ID krävs' }, { status: 400 });
    }

    // Check if BuddyPreparation model exists (migration might not be run yet)
    if (!hasBuddyPreparationModel(prisma)) {
      return NextResponse.json({ error: 'Buddy preparations feature not available yet. Please run database migration.' }, { status: 503 });
    }

    // Kontrollera att preparation tillhör användarens organisation
    const preparation = await (prisma as any).buddyPreparation.findUnique({
      where: { id: preparationId }
    });

    if (!preparation || preparation.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Preparation hittades inte' }, { status: 404 });
    }

    // Avaktivera preparation
    await (prisma as any).buddyPreparation.update({
      where: { id: preparationId },
      data: { isActive: false }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting buddy preparation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}