import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/auth-options";
import { PrismaClient } from "@prisma/client";
import { DEFAULT_CHECKLIST_CATEGORIES } from "@/lib/auth/organization-seeder";

const prisma = new PrismaClient();

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

    // Ta bort alla befintliga kategorier och uppgifter
    await prisma.task.deleteMany({
      where: {
        category: {
          checklistId: id
        }
      }
    });

    await prisma.category.deleteMany({
      where: {
        checklistId: id
      }
    });

    // Skapa nya kategorier och uppgifter från mallen
    for (const categoryData of DEFAULT_CHECKLIST_CATEGORIES) {
      const { name, order, tasks } = categoryData;

      const category = await prisma.category.create({
        data: {
          name,
          order,
          checklistId: id,
        },
      });

      // Skapa uppgifter för denna kategori
      for (const taskData of tasks) {
        await prisma.task.create({
          data: {
            title: taskData.title,
            description: taskData.description,
            order: taskData.order,
            isBuddyTask: taskData.isBuddyTask,
            categoryId: category.id,
            ...(taskData.link && { link: taskData.link })
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
      message: "Checklista återställd till standardmall",
      data: updatedChecklist
    });

  } catch (error) {
    console.error("Fel vid återställning av checklista:", error);
    return NextResponse.json(
      { error: "Internt serverfel" },
      { status: 500 }
    );
  }
}