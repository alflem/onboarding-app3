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

    return NextResponse.json({
      isBuddy: employeesWithThisBuddy.length > 0,
      buddyFor: employeesWithThisBuddy,
      buddyEnabled: true
    });
  } catch (error) {
    console.error('Error checking buddy status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}