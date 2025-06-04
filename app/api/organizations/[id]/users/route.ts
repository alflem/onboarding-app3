// /app/api/organizations/[id]/users/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Hämta inloggad användare och kontrollera behörighet
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Du måste vara inloggad" },
        { status: 401 }
      );
    }

    // Kontrollera om användaren är super admin
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Du har inte behörighet att utföra denna åtgärd" },
        { status: 403 }
      );
    }

    const { id: organizationId } = await params;

    // Kontrollera att organisationen finns
    const organizationExists = await prisma.organization.findUnique({
      where: {
        id: organizationId,
      },
    });

    if (!organizationExists) {
      return NextResponse.json(
        { error: "Organisationen hittades inte" },
        { status: 404 }
      );
    }

    // Hämta alla användare i organisationen
    const users = await prisma.user.findMany({
      where: {
        organizationId: organizationId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Formatera datum för frontend-presentation
    const formattedUsers = users.map((user: typeof users[0]) => ({
      ...user,
      createdAt: user.createdAt.toISOString().split('T')[0], // Format: YYYY-MM-DD
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error("Fel vid hämtning av användare:", error);

    return NextResponse.json(
      { error: "Ett fel uppstod vid hämtning av användare" },
      { status: 500 }
    );
  }
}