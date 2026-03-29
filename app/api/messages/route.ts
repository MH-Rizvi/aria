import { getServerSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Find the master conversation for this user, or create one
    let conversation = await prisma.conversation.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { userId },
      });
      return NextResponse.json({
        conversationId: conversation.id,
        messages: [],
      });
    }

    // Get the last 50 messages
    const messages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Reverse to chronological order (oldest first as UI expects)
    const chronologicalMessages = messages.reverse().map((msg: { id: string, role: string, content: string, createdAt: Date }) => ({
      id: msg.id,
      role: msg.role as "user" | "assistant",
      content: msg.content,
      createdAt: msg.createdAt,
    }));

    return NextResponse.json({
      conversationId: conversation.id,
      messages: chronologicalMessages,
    });
  } catch (error) {
    console.error("Failed to load messages:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
