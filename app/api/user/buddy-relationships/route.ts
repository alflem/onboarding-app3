import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get users this person is buddy for (legacy single buddy)
    const buddyForUsersLegacy = await prisma.user.findMany({
      where: { buddyId: userId },
      select: { id: true, name: true, email: true, createdAt: true, role: true },
      orderBy: { createdAt: "desc" },
    });

    // And via multi-buddy assignments
    const assignmentUsers = await prisma.buddyAssignment.findMany({
      where: { buddyId: userId },
      include: { user: { select: { id: true, name: true, email: true, createdAt: true, role: true } } },
      orderBy: { createdAt: "desc" },
    });
    const buddyForUsers = [
      ...buddyForUsersLegacy,
      ...assignmentUsers.map(a => a.user)
    ];

    // Get active buddy preparations this person is buddy for
    const activeBuddyPreparations = await prisma.buddyPreparation.findMany({
      where: {
        isActive: true,
        OR: [
          { buddyId: userId },
          { buddies: { some: { buddyId: userId } } }
        ]
      },
      select: { id: true, firstName: true, lastName: true, email: true, notes: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    // Get completed buddy preparations this person was buddy for
    const completedBuddyPreparations = await prisma.buddyPreparation.findMany({
      where: {
        isActive: false,
        OR: [
          { buddyId: userId },
          { buddies: { some: { buddyId: userId } } }
        ]
      },
      include: { user: { select: { id: true, name: true, email: true, createdAt: true, role: true } } },
      orderBy: { updatedAt: "desc" },
    });

    // Calculate stats
    const stats = {
      totalActiveUsers: buddyForUsers.length,
      totalActivePreparations: activeBuddyPreparations.length,
      totalCompletedPreparations: completedBuddyPreparations.length,
      totalAll: buddyForUsers.length + activeBuddyPreparations.length,
    };

    return NextResponse.json({
      success: true,
      data: {
        activeUsers: buddyForUsers,
        activePreparations: activeBuddyPreparations,
        completedPreparations: completedBuddyPreparations,
        stats,
      },
    });
  } catch (error) {
    console.error("Error fetching buddy relationships:", error);
    return NextResponse.json(
      { error: "Failed to fetch buddy relationships" },
      { status: 500 }
    );
  }
}