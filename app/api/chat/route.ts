import { streamText } from "ai";
import { getActiveModel, handleRateLimit, getCurrentModelIndex } from "@/lib/llm";
import { logAiCall } from "@/lib/logging";
import { getServerSession } from "@/lib/auth";
import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are Aria, a professional AI work assistant. You help users manage their emails and calendar through conversation.

Rules:
- Be concise, professional, and helpful
- When asked to draft an email, confirm the details before creating it
- When asked to schedule something, confirm the time and details first
- Use a warm but efficient tone
- If you cannot do something, say so clearly
- Never make up information about the user's emails or calendar`;

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    // Verify auth
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id || "unknown";

    const { messages } = await request.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
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
        },
      });

      const response = result.toTextStreamResponse();
      response.headers.set("X-Model-Index", String(getCurrentModelIndex()));
      response.headers.set("X-Model-Id", modelId);
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
          },
        });

        const retryResponse = retryResult.toTextStreamResponse();
        retryResponse.headers.set("X-Model-Index", String(getCurrentModelIndex()));
        retryResponse.headers.set("X-Model-Id", modelId);
        return retryResponse;
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

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
