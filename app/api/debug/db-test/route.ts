import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(_request: NextRequest) {
  try {
    console.log("Testing database connection...");

    // Test basic database connection
    const userCount = await prisma.user.count();
    console.log(`Database connected. Users count: ${userCount}`);

    // Test organization table
    const orgCount = await prisma.organization.count();
    console.log(`Organizations count: ${orgCount}`);

    // Check if Demo Company exists
    const demoOrg = await prisma.organization.findFirst({
      where: { name: "Demo Company" }
    });
    console.log("Demo Company exists:", !!demoOrg);

    // Try to create Demo Company if it doesn't exist
    let demoOrgResult = demoOrg;
    if (!demoOrg) {
      console.log("Attempting to create Demo Company...");
      try {
        demoOrgResult = await prisma.organization.create({
          data: {
            name: "Demo Company",
            buddyEnabled: true,
          }
        });
        console.log("Demo Company created successfully:", demoOrgResult.id);
      } catch (createError) {
        console.error("Error creating Demo Company:", createError);
        return NextResponse.json({
          error: "Failed to create Demo Company",
          details: createError instanceof Error ? createError.message : String(createError),
          userCount,
          orgCount,
          demoCompanyExists: false
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      userCount,
      orgCount,
      demoCompanyExists: true,
      demoCompanyId: demoOrgResult?.id,
      environment: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? "Set" : "Not Set",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Database test failed:", error);
    return NextResponse.json({
      error: "Database connection failed",
      details: error instanceof Error ? error.message : String(error),
      environment: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? "Set" : "Not Set",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}