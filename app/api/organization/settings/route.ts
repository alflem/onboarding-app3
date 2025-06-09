import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session-utils';
import { prisma } from "@/lib/prisma";

// GET /api/organization/settings - Hämta organisationsinställningar
export async function GET() {
  try {
    const sessionOrResponse = await requireAdmin();

    if (sessionOrResponse instanceof NextResponse) {
      return sessionOrResponse;
    }

    // Hämta organisationsinställningar
    const organization = await prisma.organization.findUnique({
      where: {
        id: sessionOrResponse.user.organization.id
      },
      select: {
        id: true,
        name: true,
        buddyEnabled: true,
        updatedAt: true
      }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json(organization);
  } catch (error) {
    console.error('Error fetching organization settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/organization/settings - Uppdatera organisationsinställningar
export async function PATCH(request: Request) {
  try {
    const sessionOrResponse = await requireAdmin();

    if (sessionOrResponse instanceof NextResponse) {
      return sessionOrResponse;
    }

    const body = await request.json();
    const { buddyEnabled } = body;

    // Validera indata
    if (typeof buddyEnabled !== 'boolean') {
      return NextResponse.json({ error: 'buddyEnabled must be a boolean' }, { status: 400 });
    }

    // Uppdatera organisationsinställningar
    const updatedOrganization = await prisma.organization.update({
      where: {
        id: sessionOrResponse.user.organization.id
      },
      data: {
        buddyEnabled: buddyEnabled
      },
      select: {
        id: true,
        name: true,
        buddyEnabled: true,
        updatedAt: true
      }
    });

    return NextResponse.json(updatedOrganization);
  } catch (error) {
    console.error('Error updating organization settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}