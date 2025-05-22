import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/user/is-buddy - Kontrollera om inloggad användare är buddy för någon
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Kontrollera om användaren är buddy för någon
    const employeesWithThisBuddy = await prisma.user.findMany({
      where: {
        buddyId: session.user.id
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    return NextResponse.json({
      isBuddy: employeesWithThisBuddy.length > 0,
      buddyFor: employeesWithThisBuddy
    });
  } catch (error) {
    console.error('Error checking buddy status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}