import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";
import { DEFAULT_BUDDY_CHECKLIST_CATEGORIES } from "@/lib/auth/organization-seeder";

interface RouteParams {
  id: string;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  const { id } = await context.params;

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Ej autentiserad" }, { status: 401 });
    }

    // Kontrollera att användaren är admin eller super admin
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Ej behörig" }, { status: 403 });
    }

    // Hämta checklistan för att verifiera att den finns
    const existingChecklist = await prisma.checklist.findUnique({
      where: { id },
      include: {
        organization: true,
        categories: {
          include: {
            tasks: true
          }
        }
      }
    });

    if (!existingChecklist) {
      return NextResponse.json({ error: "Checklista hittades inte" }, { status: 404 });
    }

    // Kontrollera att användaren tillhör samma organisation (för vanliga admins)
    if (session.user.role === "ADMIN" && existingChecklist.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: "Ej behörig för denna organisation" }, { status: 403 });
    }

    // Ta bort endast buddy-uppgifter
    await prisma.task.deleteMany({
      where: {
        category: {
          checklistId: id
        },
        isBuddyTask: true
      }
    });

    // Ta bort kategorier som bara innehöll buddy-uppgifter
    const categories = await prisma.category.findMany({
      where: {
        checklistId: id
      },
      include: {
        tasks: true
      }
    });

    // Identifiera kategorier som är tomma efter att buddy-uppgifter tagits bort
    const emptyCategories = categories.filter(category =>
      category.tasks.length === 0 || category.tasks.every(task => task.isBuddyTask)
    );

    // Ta bort tomma kategorier
    await prisma.category.deleteMany({
      where: {
        id: {
          in: emptyCategories.map(cat => cat.id)
        }
      }
    });

    // Hämta befintliga kategorier för att bestämma ordning
    const remainingCategories = await prisma.category.findMany({
      where: {
        checklistId: id
      },
      orderBy: {
        order: 'asc'
      }
    });

    const maxOrder = remainingCategories.length > 0
      ? Math.max(...remainingCategories.map(cat => cat.order))
      : 0;

    // Skapa buddy-kategorier och uppgifter från standardmallen
    for (const categoryData of DEFAULT_BUDDY_CHECKLIST_CATEGORIES) {
      const { name, order, tasks } = categoryData;

      // Kontrollera om kategorin redan finns
      let category = remainingCategories.find(cat => cat.name === name);

      if (!category) {
        // Skapa ny kategori om den inte finns
        category = await prisma.category.create({
          data: {
            name,
            order: maxOrder + order,
            checklistId: id,
          },
        });
      }

      // Skapa buddy-uppgifter för denna kategori
      for (const taskData of tasks) {
        await prisma.task.create({
          data: {
            title: taskData.title,
            description: taskData.description,
            order: taskData.order,
            isBuddyTask: true, // Explicit sätt till true för buddy-uppgifter
            categoryId: category.id,
            link: taskData.link || null
          },
        });
      }
    }

    // Hämta den uppdaterade checklistan
    const updatedChecklist = await prisma.checklist.findUnique({
      where: { id },
      include: {
        organization: true,
        categories: {
          include: {
            tasks: {
              orderBy: {
                order: 'asc'
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Buddy-checklista återställd till standardmall",
      data: updatedChecklist
    });

  } catch (error) {
    console.error("Fel vid återställning av buddy-checklista:", error);
    return NextResponse.json(
      { error: "Internt serverfel" },
      { status: 500 }
    );
  }
}