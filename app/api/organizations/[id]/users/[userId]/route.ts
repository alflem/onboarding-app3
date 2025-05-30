// /app/api/organizations/[id]/users/[userId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
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

    const { id: organizationId, userId } = await params;
    const { role } = await request.json();

    // Validera role
    if (!role || !Object.values(Role).includes(role as Role)) {
      return NextResponse.json(
        { error: "Ogiltig roll" },
        { status: 400 }
      );
    }

    // Kontrollera att användaren finns och tillhör organisationen
    const userExists = await prisma.user.findFirst({
      where: {
        id: userId,
        organizationId: organizationId,
      },
    });

    if (!userExists) {
      return NextResponse.json(
        { error: "Användaren hittades inte i organisationen" },
        { status: 404 }
      );
    }

    // Uppdatera användarens roll
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        role: role as Role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Fel vid uppdatering av användarroll:", error);

    return NextResponse.json(
      { error: "Ett fel uppstod vid uppdatering av användarrollen" },
      { status: 500 }
    );
  }
}