import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/templates/[id]/export?type=all|regular|buddy - Exportera checklista som JSON
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Kontrollera att användaren är admin eller super admin
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;

    // Hämta export-typ från query parameter
    const url = new URL(request.url);
    const exportType = url.searchParams.get('type') || 'all'; // all, regular, buddy

    // Validera export-typ
    if (!['all', 'regular', 'buddy'].includes(exportType)) {
      return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
    }

    // Hämta checklistan med alla kategorier och uppgifter
    const checklist = await prisma.checklist.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            name: true,
            buddyEnabled: true
          }
        },
        categories: {
          include: {
            tasks: {
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!checklist) {
      return NextResponse.json({ error: "Checklist not found" }, { status: 404 });
    }

    // Kontrollera behörighet - användaren måste tillhöra samma organisation (för vanliga admins)
    if (session.user.role === "ADMIN" && checklist.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Filtrera kategorier och uppgifter baserat på export-typ
    let filteredCategories = checklist.categories;

    if (exportType === 'regular') {
      // Endast vanliga uppgifter (inte buddy-uppgifter)
      filteredCategories = checklist.categories
        .map(category => ({
          ...category,
          tasks: category.tasks.filter(task => !task.isBuddyTask)
        }))
        .filter(category => category.tasks.length > 0); // Ta bort tomma kategorier
    } else if (exportType === 'buddy') {
      // Endast buddy-uppgifter
      filteredCategories = checklist.categories
        .map(category => ({
          ...category,
          tasks: category.tasks.filter(task => task.isBuddyTask)
        }))
        .filter(category => category.tasks.length > 0); // Ta bort tomma kategorier
    }
    // För 'all' behålls alla kategorier och uppgifter som de är

    // Skapa exportformat
    const exportTypeNames = {
      all: 'Komplett',
      regular: 'Vanlig',
      buddy: 'Buddy'
    };

    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: session.user.email,
        version: "1.0",
        exportType: exportType,
        originalOrganization: checklist.organization?.name
      },
      checklist: {
        name: `${checklist.organization?.name} ${exportTypeNames[exportType as keyof typeof exportTypeNames]} Checklista`,
        description: `Exporterad ${exportTypeNames[exportType as keyof typeof exportTypeNames].toLowerCase()} checklista från ${checklist.organization?.name}`,
        buddyEnabled: checklist.organization?.buddyEnabled || false,
        categories: filteredCategories.map(category => ({
          name: category.name,
          order: category.order,
          isBuddyCategory: category.isBuddyCategory,
          tasks: category.tasks.map(task => ({
            title: task.title,
            description: task.description,
            link: task.link,
            order: task.order,
            isBuddyTask: task.isBuddyTask
          }))
        }))
      }
    };

    // Skapa filnamn baserat på organisationens namn, export-typ och datum
    const orgName = checklist.organization?.name || 'checklist';
    const typePrefix = exportType === 'all' ? 'komplett' : exportType === 'regular' ? 'vanlig' : 'buddy';
    const filename = `checklist-${typePrefix}-${orgName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;

    // Returnera som JSON-fil för nedladdning
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error("Error exporting checklist:", error);
    return NextResponse.json(
      { error: "Failed to export checklist" },
      { status: 500 }
    );
  }
}
