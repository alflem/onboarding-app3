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

    // Legacy single-buddy relation
    const employeesWithThisBuddy = await prisma.user.findMany({
      where: { buddyId: session.user.id },
      select: { id: true, name: true, email: true }
    });

    // New multi-buddy assignments
    const assignmentLinks = await prisma.buddyAssignment.findMany({
      where: { buddyId: session.user.id },
      include: { user: { select: { id: true, name: true, email: true } } }
    });
    const assignedUsers = assignmentLinks.map(a => a.user);

    // Check if user has active buddy preparations
    const activeBuddyPreparations = await prisma.buddyPreparation.findMany({
      where: {
        isActive: true,
        OR: [
          { buddyId: session.user.id },
          { buddies: { some: { buddyId: session.user.id } } }
        ]
      },
      select: { id: true, firstName: true, lastName: true, email: true }
    });

    // Combine and deduplicate buddy users based on ID
    const allBuddyUsers = [...employeesWithThisBuddy, ...assignedUsers];
    const uniqueBuddyUsersMap = new Map();
    allBuddyUsers.forEach(user => {
      uniqueBuddyUsersMap.set(user.id, user);
    });
    const uniqueBuddyUsers = Array.from(uniqueBuddyUsersMap.values());

    // User is a buddy if they have either existing employees or active preparations
    const isBuddy = uniqueBuddyUsers.length > 0 || activeBuddyPreparations.length > 0;

    return NextResponse.json({
      isBuddy,
      buddyFor: uniqueBuddyUsers,
      buddyPreparations: activeBuddyPreparations,
      buddyEnabled: true
    });
  } catch (error) {
    console.error('Error checking buddy status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}