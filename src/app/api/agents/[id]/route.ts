import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { eventBus } from "@/lib/events/event-bus";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const agent = await prisma.agent.findUnique({
    where: { id },
    include: {
      logs: { orderBy: { createdAt: "desc" }, take: 20 },
      tasks: { orderBy: { createdAt: "desc" }, take: 10 },
      _count: { select: { tasks: true, logs: true } },
    },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  return NextResponse.json(agent);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const agent = await prisma.agent.findUnique({ where: { id } });
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const updated = await prisma.agent.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.currentTask !== undefined && { currentTask: body.currentTask }),
      ...(body.personality !== undefined && { personality: body.personality }),
      ...(body.config !== undefined && { config: body.config }),
    },
  });

  // Log status changes
  if (body.status && body.status !== agent.status) {
    await prisma.agentLog.create({
      data: {
        agentId: id,
        action: "status_change",
        details: { from: agent.status, to: body.status },
      },
    });

    eventBus.emit({
      type: "agent_status_change",
      agentId: id,
      agentName: updated.name,
      message: `${updated.name} changed status: ${agent.status} → ${body.status}`,
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.agent.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }
}
