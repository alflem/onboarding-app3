import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from '@/lib/auth/session-utils';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(_request: NextRequest) {
  try {
    const sessionOrResponse = await requireAdmin();

    if (sessionOrResponse instanceof NextResponse) {
      return sessionOrResponse;
    }

    // Hämta användarens organisation
    const organization = await prisma.organization.findUnique({
      where: {
        id: sessionOrResponse.user.organizationId
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
    const sessionOrResponse = await requireAdmin();

    if (sessionOrResponse instanceof NextResponse) {
      return sessionOrResponse;
    }

    const body = await request.json();
    const { name, buddyEnabled } = body;

    const organization = await prisma.organization.update({
      where: {
        id: sessionOrResponse.user.organizationId
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