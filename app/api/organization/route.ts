import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Ej autentiserad" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Ej behörig" }, { status: 403 });
    }

    // Hämta användarens organisation
    const organization = await prisma.organization.findUnique({
      where: {
        id: session.user.organizationId!
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true
          }
        }
      }
    });

    if (!organization) {
      return NextResponse.json({ error: "Organisation hittades ej" }, { status: 404 });
    }

    return NextResponse.json(organization);
  } catch (error) {
    console.error("Fel vid hämtning av organisation:", error);
    return NextResponse.json(
      { error: "Internt serverfel" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Ej autentiserad" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Ej behörig" }, { status: 403 });
    }

    const body = await request.json();
    const { name, buddyEnabled } = body;

    const organization = await prisma.organization.update({
      where: {
        id: session.user.organizationId!
      },
      data: {
        ...(name && { name }),
        ...(typeof buddyEnabled === 'boolean' && { buddyEnabled })
      }
    });

    return NextResponse.json(organization);
  } catch (error) {
    console.error("Fel vid uppdatering av organisation:", error);
    return NextResponse.json(
      { error: "Internt serverfel" },
      { status: 500 }
    );
  }
}