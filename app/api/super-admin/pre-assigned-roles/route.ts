import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

// GET - Fetch all pre-assigned roles
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Ej autentiserad" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Ej behörig - SUPER_ADMIN krävs" }, { status: 403 });
    }

    const preAssignedRoles = await prisma.preAssignedRole.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: preAssignedRoles
    });

  } catch (error) {
    console.error("Error fetching pre-assigned roles:", error);
    return NextResponse.json(
      { error: "Internt serverfel" },
      { status: 500 }
    );
  }
}

// POST - Create new pre-assigned role
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Ej autentiserad" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Ej behörig - SUPER_ADMIN krävs" }, { status: 403 });
    }

    const body = await request.json();
    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json({ error: "Email och roll krävs" }, { status: 400 });
    }

    if (!["SUPER_ADMIN", "ADMIN", "EMPLOYEE"].includes(role)) {
      return NextResponse.json({ error: "Ogiltig roll" }, { status: 400 });
    }

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return NextResponse.json({
        error: "Användare med denna e-post finns redan. Uppdatera rollen direkt på användaren istället."
      }, { status: 400 });
    }

    const preAssignedRole = await prisma.preAssignedRole.upsert({
      where: { email: normalizedEmail },
      create: {
        email: normalizedEmail,
        role: role
      },
      update: {
        role: role
      }
    });

    return NextResponse.json({
      success: true,
      data: preAssignedRole,
      message: `Fördefinierad roll ${role} tilldelad för ${normalizedEmail}`
    });

  } catch (error) {
    console.error("Error creating pre-assigned role:", error);
    return NextResponse.json(
      { error: "Internt serverfel" },
      { status: 500 }
    );
  }
}

// DELETE - Remove pre-assigned role
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Ej autentiserad" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Ej behörig - SUPER_ADMIN krävs" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: "Email krävs" }, { status: 400 });
    }

    await prisma.preAssignedRole.delete({
      where: { email: email.toLowerCase() }
    });

    return NextResponse.json({
      success: true,
      message: `Fördefinierad roll borttagen för ${email}`
    });

  } catch (error) {
    console.error("Error deleting pre-assigned role:", error);
    return NextResponse.json(
      { error: "Internt serverfel" },
      { status: 500 }
    );
  }
}