// app/api/organizations/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/auth-options"; 
import { prisma } from "@/lib/prisma"; // Använder din befintliga prisma-export

export async function GET() {
  try {
    // Hämta användarens session
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Kontrollera att användaren är super admin
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.log("Fetching organizations...");

    // Hämta alla organisationer
    const organizations = await prisma.organization.findMany({
      include: {
        users: {
          select: {
            id: true,
            role: true,
          },
        },
      },
    });

    console.log(`Found ${organizations.length} organizations`);

    // Formatera data för frontend
    const formattedOrganizations = organizations.map(org => {
      const adminCount = org.users.filter(user =>
        user.role === 'ADMIN'
      ).length;

      return {
        id: org.id,
        name: org.name,
        adminCount,
        userCount: org.users.length,
        createdAt: org.createdAt.toISOString().split('T')[0],
      };
    });

    return NextResponse.json(formattedOrganizations);
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Hämta användarens session
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Kontrollera att användaren är super admin
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.log("Creating new organization...");

    // Hämta data från request body
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: "Organization name is required" }, { status: 400 });
    }

    // Skapa ny organisation
    const newOrganization = await prisma.organization.create({
      data: {
        name: name.trim(),
      },
    });

    console.log(`Created organization: ${newOrganization.id}`);

    return NextResponse.json({
      id: newOrganization.id,
      name: newOrganization.name,
      adminCount: 0,
      userCount: 0,
      createdAt: newOrganization.createdAt.toISOString().split('T')[0],
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating organization:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}