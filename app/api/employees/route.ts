import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/employees - Hämta alla medarbetare för användarens organisation
export async function GET() {
  try {
    // Hämta användarsession
    const session = await getServerSession(authOptions);

    // Kontrollera om användaren är inloggad
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Kontrollera att användaren har behörighet (admin eller super_admin)
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Hämta organisationsid från användarsessionen
    const organizationId = session.user.organization;

    // Hämta alla medarbetare för användarens organisation
    const employees = await prisma.user.findMany({
      where: {
        organization: organizationId,
        role: 'EMPLOYEE'
      },
      include: {
        buddy: true,
        progress: {
          include: {
            task: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Beräkna progress för varje medarbetare
    const employeesWithProgress = employees.map(employee => {
      // Räkna ut progress-procent
      const completedTasks = employee.progress.filter(p => p.completed).length;
      const totalTasks = employee.progress.length;
      const progressPercentage = totalTasks > 0
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0;

      return {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        organizationId: employee.organizationId,
        progress: progressPercentage,
        hasBuddy: employee.buddyId !== null
      };
    });

    return NextResponse.json(employeesWithProgress);

  } catch (error) {
    console.error('Fel vid hämtning av medarbetare:', error);
    return NextResponse.json(
      { error: 'Kunde inte hämta medarbetare' },
      { status: 500 }
    );
  }
}

// POST /api/employees - Skapa en ny medarbetare
export async function POST(request: NextRequest) {
  try {
    // Hämta användarsession
    const session = await getServerSession(authOptions);

    // Kontrollera om användaren är inloggad
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Kontrollera att användaren har behörighet (admin eller super_admin)
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Hämta och validera begäransdata
    const body = await request.json();

    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return NextResponse.json(
        { error: 'Namn krävs' },
        { status: 400 }
      );
    }

    if (!body.email || typeof body.email !== 'string' || body.email.trim() === '') {
      return NextResponse.json(
        { error: 'E-post krävs' },
        { status: 400 }
      );
    }

    // Kontrollera om e-postadressen redan finns
    const existingUser = await prisma.user.findUnique({
      where: {
        email: body.email.trim().toLowerCase()
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'En användare med denna e-postadress finns redan' },
        { status: 400 }
      );
    }

    // Hämta organisationsid från användarsessionen
    const organizationId = session.user.organization.id;

    // Generera ett temporärt lösenord - i produktion kanske du vill skicka ett e-postmeddelande med en inbjudan
    const tempPassword = Math.random().toString(36).slice(-8);

    // Skapa ny användare i databasen
    const newEmployee = await prisma.user.create({
      data: {
        name: body.name.trim(),
        email: body.email.trim().toLowerCase(),
        password: tempPassword, // I en verklig app skulle detta hashas
        role: 'EMPLOYEE',
        organization: {
          connect: {
            id: organizationId
          }
        }
      }
    });

    // Hämta en mall för organisationen (du kan välja en default-mall om du har en sådan flagga)
    const template = await prisma.template.findFirst({
      where: {
        organizationId: organizationId
      },
      include: {
        categories: {
          include: {
            tasks: true
          }
        }
      }
    });

    // Om det finns en mall, skapa progress-poster för alla uppgifter
    if (template) {
      // Skapa en array av progress-data för alla uppgifter
      const progressData = [];

      for (const category of template.categories) {
        for (const task of category.tasks) {
          progressData.push({
            userId: newEmployee.id,
            taskId: task.id,
            completed: false
          });
        }
      }

      // Skapa alla progress-poster i en batch
      if (progressData.length > 0) {
        await prisma.taskProgress.createMany({
          data: progressData
        });
      }
    }

    // Returnera den skapade medarbetaren med progress satt till 0 och hasBuddy satt till false
    return NextResponse.json({
      id: newEmployee.id,
      name: newEmployee.name,
      email: newEmployee.email,
      organizationId: newEmployee.organizationId,
      progress: 0,
      hasBuddy: false
    });

  } catch (error) {
    console.error('Fel vid skapande av medarbetare:', error);
    return NextResponse.json(
      { error: 'Kunde inte skapa medarbetare' },
      { status: 500 }
    );
  }
}