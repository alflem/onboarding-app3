import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";


interface TaskOrder {
    id: string;
    order: number;
  }

// PATCH /api/tasks/reorder - Ändra ordningen på flera uppgifter
export async function PATCH(request: NextRequest) {
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

        if (!body.tasks || !Array.isArray(body.tasks) || body.tasks.length === 0) {
            return NextResponse.json(
                { error: 'Uppgifter krävs' },
                { status: 400 }
            );
        }

        // Kontrollera om alla uppgifter har id och order
        const isValid = body.tasks.every((task: TaskOrder) =>
            task.id && (task.order !== undefined && task.order !== null)
        );

        if (!isValid) {
            return NextResponse.json(
                { error: 'Alla uppgifter måste ha id och order' },
                { status: 400 }
            );
        }

        // Hämta alla uppgifter som ska uppdateras för att verifiera ägarskap
        const taskIds = body.tasks.map((task: TaskOrder) => task.id);

        const existingTasks = await prisma.task.findMany({
            where: {
                id: {
                    in: taskIds
                }
            },
            include: {
                category: {
                    include: {
                        checklist: {
                            select: {
                                organizationId: true
                            }
                        }
                    }
                }
            }
        });

        // Kontrollera om alla uppgifter finns
        if (existingTasks.length !== taskIds.length) {
            return NextResponse.json(
                { error: 'En eller flera uppgifter hittades inte' },
                { status: 404 }
            );
        }

        // Kontrollera om användaren har tillgång till alla uppgifter
        const hasAccess =
        session.user.role === 'SUPER_ADMIN' ||
        existingTasks.every(
            (task: typeof existingTasks[0]) => task.category.checklist.organizationId === session.user.organizationId
        );

        if (!hasAccess) {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            );
        }

        // Uppdatera uppgifternas ordning i databasen
        const updatePromises = body.tasks.map((task: TaskOrder) =>
            prisma.task.update({
                where: {
                    id: task.id
                },
                data: {
                    order: task.order
                }
            })
        );

        const updatedTasks = await Promise.all(updatePromises);

        return NextResponse.json({
            success: true,
            tasks: updatedTasks
        });

    } catch (error) {
        console.error('Fel vid omsortering av uppgifter:', error);
        return NextResponse.json(
            { error: 'Kunde inte uppdatera ordningen på uppgifter' },
            { status: 500 }
        );
    }
}