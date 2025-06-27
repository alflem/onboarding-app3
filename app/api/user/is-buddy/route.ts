import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";
import { hasBuddyPreparationModel } from "@/types/prisma-extended";

// GET /api/user/is-buddy - Check if logged-in user is a buddy for someone
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization to check buddy settings
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organization: {
          select: {
            buddyEnabled: true
          }
        }
      }
    });

    if (!user || !user.organization) {
      return NextResponse.json({
        isBuddy: false,
        buddyFor: [],
        buddyEnabled: false
      });
    }

    // If buddy function is disabled for the organization
    if (!user.organization.buddyEnabled) {
      return NextResponse.json({
        isBuddy: false,
        buddyFor: [],
        buddyEnabled: false
      });
    }

    // Check if user is a buddy for someone
    const employeesWithThisBuddy = await prisma.user.findMany({
      where: {
        buddyId: session.user.id
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    // Check for active buddy preparations
    let activePreparations = [];
    if (hasBuddyPreparationModel(prisma)) {
      try {
        activePreparations = await (prisma as any).buddyPreparation.findMany({
          where: {
            buddyId: session.user.id,
            isActive: true,
            linkedUserId: null
          },
          select: {
            id: true,
            upcomingEmployeeName: true,
            upcomingEmployeeEmail: true,
            notes: true
          }
        });
             } catch (_error) {
         console.log('BuddyPreparation model not available yet');
       }
    }

    return NextResponse.json({
      isBuddy: employeesWithThisBuddy.length > 0 || activePreparations.length > 0,
      buddyFor: employeesWithThisBuddy,
      activePreparations: activePreparations,
      buddyEnabled: true
    });
  } catch (error) {
    console.error('Error checking buddy status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}