import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/auth-options";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Ej autentiserad" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Ej behörig" }, { status: 403 });
    }

    // Hämta alla checklists med detaljerad information
    const checklists = await prisma.checklist.findMany({
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            buddyEnabled: true
          }
        },
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
        },
        _count: {
          select: {
            categories: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Beräkna statistik för varje checklist
    const checklistsWithStats = checklists.map((checklist: typeof checklists[0]) => {
      const totalTasks = checklist.categories.reduce((sum: number, category: typeof checklist.categories[0]) => sum + category.tasks.length, 0);
      const buddyTasks = checklist.categories.reduce((sum: number, category: typeof checklist.categories[0]) =>
        sum + category.tasks.filter((task: typeof category.tasks[0]) => task.isBuddyTask).length, 0
      );

      return {
        ...checklist,
        stats: {
          totalCategories: checklist.categories.length,
          totalTasks,
          buddyTasks,
          regularTasks: totalTasks - buddyTasks
        }
      };
    });

    return NextResponse.json({
      success: true,
      data: checklistsWithStats
    });

  } catch (error) {
    console.error("Fel vid hämtning av checklists:", error);
    return NextResponse.json(
      { error: "Internt serverfel" },
      { status: 500 }
    );
  }
}