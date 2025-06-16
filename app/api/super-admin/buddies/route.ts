import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/auth-options";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Define types for organization buddy data
interface OrganizationBuddyData {
  organization: {
    id: string;
    name: string;
    buddyEnabled: boolean;
  } | null;
  buddyRelations: Array<{
    id: string;
    name: string;
    email: string;
    organizationId: string | null;
    buddy: {
      id: string;
      name: string;
      email: string;
      role: string;
    } | null;
    organization: {
      id: string;
      name: string;
      buddyEnabled: boolean;
    } | null;
  }>;
  potentialBuddies: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    organizationId: string | null;
    organization: {
      id: string;
      name: string;
      buddyEnabled: boolean;
    } | null;
    _count: {
      buddyFor: number;
    };
  }>;
}

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Ej autentiserad" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Ej behörig" }, { status: 403 });
    }

    // Hämta alla buddy-relationer
    const buddyRelations = await prisma.user.findMany({
      where: {
        buddyId: {
          not: null
        }
      },
      include: {
        buddy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        organization: {
          select: {
            id: true,
            name: true,
            buddyEnabled: true
          }
        }
      },
      orderBy: [
        { organizationId: 'asc' },
        { name: 'asc' }
      ]
    });

    // Hämta alla potentiella buddies (ADMIN och EMPLOYEE som kan vara buddies)
    const potentialBuddies = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'EMPLOYEE']
        }
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            buddyEnabled: true
          }
        },
        _count: {
          select: {
            buddyFor: true  // Antal användare som denna person är buddy för
          }
        }
      },
      orderBy: [
        { organizationId: 'asc' },
        { name: 'asc' }
      ]
    });

    // Organisera data per organisation
    const organizationBuddyData: Record<string, OrganizationBuddyData> = {};

    // Gruppera buddy-relationer per organisation
    buddyRelations.forEach(user => {
      const orgId = user.organizationId;
      if (orgId && !organizationBuddyData[orgId]) {
        organizationBuddyData[orgId] = {
          organization: user.organization,
          buddyRelations: [],
          potentialBuddies: []
        };
      }
      if (orgId) {
        organizationBuddyData[orgId].buddyRelations.push(user);
      }
    });

    // Gruppera potentiella buddies per organisation
    potentialBuddies.forEach(user => {
      const orgId = user.organizationId;
      if (orgId && !organizationBuddyData[orgId]) {
        organizationBuddyData[orgId] = {
          organization: user.organization,
          buddyRelations: [],
          potentialBuddies: []
        };
      }
      if (orgId) {
        organizationBuddyData[orgId].potentialBuddies.push(user);
      }
    });

    // Konvertera till array och beräkna statistik
    const buddyDataArray = Object.values(organizationBuddyData).map((orgData: OrganizationBuddyData) => ({
      ...orgData,
      stats: {
        totalBuddyRelations: orgData.buddyRelations.length,
        totalPotentialBuddies: orgData.potentialBuddies.length,
        buddyEnabled: orgData.organization?.buddyEnabled || false
      }
    }));

    return NextResponse.json({
      success: true,
      data: buddyDataArray
    });

  } catch (error) {
    console.error("Fel vid hämtning av buddy-data:", error);
    return NextResponse.json(
      { error: "Internt serverfel" },
      { status: 500 }
    );
  }
}