// app/api/tasks/[id]/progress/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id;
    const session = await getServerSession(authOptions);

    if (!session || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const taskProgress = await prisma.taskProgress.findUnique({
      where: {
        userId_taskId: {
          userId: user.id,
          taskId,
        },
      },
    });

    return NextResponse.json({
      completed: taskProgress?.completed || false,
    });
  } catch (error) {
    console.error("Error fetching task progress:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id;
    const session = await getServerSession(authOptions);

    if (!session || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { completed } = await req.json();

    // Validera input
    if (typeof completed !== "boolean") {
      return NextResponse.json(
        { error: "Invalid input. 'completed' must be a boolean." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verifiera att uppgiften existerar
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Uppdatera eller skapa framsteg
    const taskProgress = await prisma.taskProgress.upsert({
      where: {
        userId_taskId: {
          userId: user.id,
          taskId,
        },
      },
      update: {
        completed,
      },
      create: {
        userId: user.id,
        taskId,
        completed,
      },
    });

    return NextResponse.json(taskProgress);
  } catch (error) {
    console.error("Error updating task progress:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}