import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

interface ImportedTask {
  title: string;
  description: string | null;
  link: string | null;
  order: number;
  isBuddyTask: boolean;
}

interface ImportedCategory {
  name: string;
  order: number;
  isBuddyCategory: boolean;
  tasks: ImportedTask[];
}

interface ImportedChecklist {
  name: string;
  description: string | null;
  buddyEnabled: boolean;
  categories: ImportedCategory[];
}

interface ImportData {
  metadata?: {
    version: string;
    exportType?: string;
    exportedAt: string;
    exportedBy: string;
    originalOrganization: string;
  };
  checklist: ImportedChecklist;
}

// POST /api/templates/import - Importera checklista från JSON
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Kontrollera att användaren är admin eller super admin
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!session.user.organizationId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const body = await request.json() as ImportData;

    // Validera importdata
    if (!body.checklist || !body.checklist.categories) {
      return NextResponse.json({ error: "Invalid import data format" }, { status: 400 });
    }

    const { checklist, metadata } = body;
    const exportType = metadata?.exportType || 'all';

    // Kontrollera om organisationen redan har en checklista
    const existingChecklist = await prisma.checklist.findFirst({
      where: { organizationId: session.user.organizationId }
    });

    let checklistId: string;

    if (existingChecklist) {
      // Hantera partiell import för olika export-typer
      if (exportType === 'regular') {
        // Ta bort endast vanliga uppgifter (behåll buddy-uppgifter)
        await prisma.task.deleteMany({
          where: {
            category: {
              checklistId: existingChecklist.id
            },
            isBuddyTask: false
          }
        });

        // Ta bort kategorier som endast innehöll vanliga uppgifter
        const categoriesToCheck = await prisma.category.findMany({
          where: { checklistId: existingChecklist.id },
          include: { tasks: true }
        });

        for (const category of categoriesToCheck) {
          const hasOnlyRegularTasks = category.tasks.every(task => !task.isBuddyTask);
          if (hasOnlyRegularTasks && category.tasks.length > 0) {
            await prisma.category.delete({ where: { id: category.id } });
          }
        }
      } else if (exportType === 'buddy') {
        // Ta bort endast buddy-uppgifter (behåll vanliga uppgifter)
        await prisma.task.deleteMany({
          where: {
            category: {
              checklistId: existingChecklist.id
            },
            isBuddyTask: true
          }
        });

        // Ta bort kategorier som endast innehöll buddy-uppgifter
        const categoriesToCheck = await prisma.category.findMany({
          where: { checklistId: existingChecklist.id },
          include: { tasks: true }
        });

        for (const category of categoriesToCheck) {
          const hasOnlyBuddyTasks = category.tasks.every(task => task.isBuddyTask);
          if (hasOnlyBuddyTasks && category.tasks.length > 0) {
            await prisma.category.delete({ where: { id: category.id } });
          }
        }
      } else {
        // För 'all' - ta bort alla befintliga kategorier och uppgifter
        await prisma.task.deleteMany({
          where: {
            category: {
              checklistId: existingChecklist.id
            }
          }
        });

        await prisma.category.deleteMany({
          where: { checklistId: existingChecklist.id }
        });
      }

      checklistId = existingChecklist.id;
    } else {
      // Skapa ny checklista
      const newChecklist = await prisma.checklist.create({
        data: {
          organizationId: session.user.organizationId
        }
      });
      checklistId = newChecklist.id;
    }

    // Skapa kategorier och uppgifter
    for (const category of checklist.categories) {
      const createdCategory = await prisma.category.create({
        data: {
          name: category.name,
          order: category.order,
          isBuddyCategory: category.isBuddyCategory || false,
          checklistId
        }
      });

      // Skapa uppgifter för denna kategori
      for (const task of category.tasks) {
        await prisma.task.create({
          data: {
            title: task.title,
            description: task.description,
            link: task.link,
            order: task.order,
            isBuddyTask: task.isBuddyTask || false,
            categoryId: createdCategory.id
          }
        });
      }
    }

    // Uppdatera organisationens buddy-inställning om det finns i importdata
    if (checklist.buddyEnabled !== undefined) {
      await prisma.organization.update({
        where: { id: session.user.organizationId },
        data: { buddyEnabled: checklist.buddyEnabled }
      });
    }

    const typeNames = {
      all: 'Komplett checklista',
      regular: 'Vanlig checklista',
      buddy: 'Buddy-checklista'
    };

    const importTypeName = typeNames[exportType as keyof typeof typeNames] || 'Checklista';

    return NextResponse.json({
      success: true,
      message: existingChecklist ? `${importTypeName} uppdaterad framgångsrikt` : `${importTypeName} importerad framgångsrikt`,
      checklistId,
      categoriesCount: checklist.categories.length,
      tasksCount: checklist.categories.reduce((sum, cat) => sum + cat.tasks.length, 0),
      exportType
    });

  } catch (error) {
    console.error("Error importing checklist:", error);
    return NextResponse.json(
      { error: "Failed to import checklist", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
