import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

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

    // Check if user is a buddy for someone (existing users)
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

    // Check if user has active buddy preparations
    const activeBuddyPreparations = await prisma.buddyPreparation.findMany({
      where: {
        buddyId: session.user.id,
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      }
    });

    // User is a buddy if they have either existing employees or active preparations
    const isBuddy = employeesWithThisBuddy.length > 0 || activeBuddyPreparations.length > 0;

    return NextResponse.json({
      isBuddy,
      buddyFor: employeesWithThisBuddy,
      buddyPreparations: activeBuddyPreparations,
      buddyEnabled: true
    });
  } catch (error) {
    console.error('Error checking buddy status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}