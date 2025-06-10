import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(_request: NextRequest) {
  try {
    console.log("Starting organization fix process...");

    // 1. Ensure Demo Company exists
    let demoOrg = await prisma.organization.findFirst({
      where: { name: "Demo Company" }
    });

    if (!demoOrg) {
      console.log("Creating Demo Company...");
      demoOrg = await prisma.organization.create({
        data: {
          name: "Demo Company",
          buddyEnabled: true,
        }
      });
      console.log("Demo Company created with ID:", demoOrg.id);
    } else {
      console.log("Demo Company already exists with ID:", demoOrg.id);
    }

    // 2. Find users without organization
    const usersWithoutOrg = await prisma.user.findMany({
      where: {
        organizationId: null
      }
    });

    console.log(`Found ${usersWithoutOrg.length} users without organization`);

    // 3. Assign all users without organization to Demo Company
    if (usersWithoutOrg.length > 0) {
      const updateResult = await prisma.user.updateMany({
        where: {
          organizationId: null
        },
        data: {
          organizationId: demoOrg.id
        }
      });

      console.log(`Assigned ${updateResult.count} users to Demo Company`);
    }

    // 4. Get final stats
    const totalUsers = await prisma.user.count();
    const usersWithOrg = await prisma.user.count({
      where: {
        organizationId: {
          not: null
        }
      }
    });

    return NextResponse.json({
      success: true,
      demoCompany: {
        id: demoOrg.id,
        name: demoOrg.name,
        existed: usersWithoutOrg.length === 0
      },
      usersFixed: usersWithoutOrg.length,
      stats: {
        totalUsers,
        usersWithOrganization: usersWithOrg,
        usersWithoutOrganization: totalUsers - usersWithOrg
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Organization fix failed:", error);
    return NextResponse.json({
      error: "Failed to fix organization assignments",
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}