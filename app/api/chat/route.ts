// Force Turbopack Cache Invalidation for Schema Rebuild (Attempt 2)
import { streamText, stepCountIs } from "ai";
import { getActiveModel, handleRateLimit, getCurrentModelIndex } from "@/lib/llm";
import { logAiCall } from "@/lib/logging";
import { getServerSession } from "@/lib/auth";
import { getGmailTools } from "@/tools/gmailTools";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const SYSTEM_PROMPT = `You are Aria, a professional, highly efficient AI work assistant. Your goal is to help users manage their emails and calendar smoothly through conversation.

You have access to the following tools:
- listEmails: Call this ONLY when the user explicitly asks to check their emails, inbox, or recent messages.
- getEmailById: Call this ONLY when the user wants to read a specific email in detail.
- createDraft: Call this ONLY when the user wants to draft or send an email.

Behavioral Rules & Guidelines:
1. DO NOT RUN TOOLS UNPROMPTED. If the user just says "hi", "hello", or makes small talk, respond with a polite greeting and ask how you can help. Do NOT list emails unless specifically asked.
2. Directness & Precision: Reply ONLY with the information requested. Do not volunteer extra unsolicited emails or details.
3. Clean Formatting:
   - Use Markdown to structure your replies clearly.
   - Use bullet points for lists (e.g., listing emails).
   - Use **bold text** for emphasis (like senders or subjects).
   - Keep paragraphs short and scannable.
4. Tool Usage:
   - When asked about emails, ALWAYS call listEmails immediately (no need to ask permission). NEVER fabricate emails.
   - NEVER say you cannot access emails - you have the listEmails tool.
   - After calling any tool, provide a clean, structured text summary of the results.
   - When asked to draft an email, confirm the details (To, Subject, Body) before calling the draft tool.`;

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    // Verify auth
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = (session as any).accessToken as string | undefined;

    const userId = (session.user as { id?: string }).id || "unknown";

    const { messages, id, trigger } = await request.json();
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Find the latest conversation or create a new one
    let conversation = await prisma.conversation.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { userId },
      });
    }

    const conversationId = conversation.id;

    // Save the new user message (the last one in the array)
    const latestMessage = messages[messages.length - 1];
    if (latestMessage && latestMessage.role === "user") {
      try {
        await prisma.message.create({
          data: {
            id: latestMessage.id, // Vercel SDK provides an ID
            conversationId,
            role: "user",
            content: latestMessage.content,
            createdAt: new Date(),
          },
        });
      } catch (err) {
        // If ID conflicts, ignore or handle. Vercel SDK IDs are unique.
        console.error("Failed to save user message:", err);
      }
    }

    // Get active model from rotation
    const activeModel = await getActiveModel();
    let modelId = activeModel.modelId;
    let model = activeModel.model;

    // Attempt streaming with retry on 429
    try {

      const result = streamText({
        model,
        system: SYSTEM_PROMPT,
        messages,
        maxOutputTokens: 1024,
        stopWhen: stepCountIs(5),
        tools: accessToken ? getGmailTools(accessToken) : undefined,
        onFinish: async (event) => {
          const latency = Date.now() - startTime;
          logAiCall({
            userId,
            model: modelId,
            inputTokens: event.usage?.inputTokens ?? 0,
            outputTokens: event.usage?.outputTokens ?? 0,
            latency,
            success: true,
          });
          // Save AI message
          try {
            await prisma.message.create({
              data: {
                conversationId,
                role: "assistant",
                content: event.text,
                createdAt: new Date(),
              },
            });
          } catch (err) {
            console.error("Failed to save AI message:", err);
          }
        },
      });

      const response = result.toUIMessageStreamResponse();
      response.headers.set("X-Model-Index", String(getCurrentModelIndex()));
      response.headers.set("X-Model-Id", modelId);
      response.headers.set("X-Model-Status", "healthy");
      return response;


    } catch (err: unknown) {
      const error = err as Record<string, unknown>;
      const status = typeof error.status === "number" ? error.status : 0;

      if (status === 429) {
        const headers = error.headers as Headers | undefined;
        const retryAfter = headers?.get?.("retry-after") ?? null;
        const fallback = await handleRateLimit(retryAfter);

        if (!fallback) {
          const latency = Date.now() - startTime;
          logAiCall({
            userId,
            model: modelId,
            inputTokens: 0,
            outputTokens: 0,
            latency,
            success: false,
            error: "All models rate limited",
          });

          return NextResponse.json(
            {
              error:
                "Aria is taking a breather — all models are currently rate limited. Please try again shortly.",
            },
            { status: 429 }
          );
        }

        modelId = fallback.modelId;
        model = fallback.model;

        const retryResult = streamText({
          model,
          system: SYSTEM_PROMPT,
          messages,
          maxOutputTokens: 1024,
          stopWhen: stepCountIs(5),
          tools: accessToken ? getGmailTools(accessToken) : undefined,
          onFinish: async (event) => {
            const latency = Date.now() - startTime;
            logAiCall({
              userId,
              model: modelId,
              inputTokens: event.usage?.inputTokens ?? 0,
              outputTokens: event.usage?.outputTokens ?? 0,
              latency,
              success: true,
            });
            // Save AI message
            try {
              await prisma.message.create({
                data: {
                  conversationId,
                  role: "assistant",
                  content: event.text,
                  createdAt: new Date(),
                },
              });
            } catch (err) {
              console.error("Failed to save AI fallback message:", err);
            }
          },
        });

        const response = retryResult.toUIMessageStreamResponse();
        response.headers.set("X-Model-Index", String(getCurrentModelIndex()));
        response.headers.set("X-Model-Id", modelId);
        response.headers.set("X-Model-Status", "rate-limited");
        return response;
      }

      throw err;
    }
  } catch (err: unknown) {
    const latency = Date.now() - startTime;
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
    logAiCall({
      userId: "unknown",
      model: "unknown",
      inputTokens: 0,
      outputTokens: 0,
      latency,
      success: false,
      error: errorMessage,
    });

    console.error("[Chat API Error]:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
