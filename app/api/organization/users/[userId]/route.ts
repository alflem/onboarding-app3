import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/auth-options";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Ej autentiserad" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Ej behörig" }, { status: 403 });
    }

    const { userId } = params;
    const body = await request.json();
    const { role } = body;

    // Kontrollera att användaren tillhör samma organisation
    const userToUpdate = await prisma.user.findFirst({
      where: {
        id: userId,
        organizationId: session.user.organizationId!
      }
    });

    if (!userToUpdate) {
      return NextResponse.json({ error: "Användare hittades ej eller tillhör inte din organisation" }, { status: 404 });
    }

    // Uppdatera användarens roll
    const updatedUser = await prisma.user.update({
      where: {
        id: userId
      },
      data: {
        role: role
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Fel vid uppdatering av användarroll:", error);
    return NextResponse.json(
      { error: "Internt serverfel" },
      { status: 500 }
    );
  }
}