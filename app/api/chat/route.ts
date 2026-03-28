import { streamText } from "ai";
import { getActiveModel, handleRateLimit, getCurrentModelIndex } from "@/lib/llm";
import { logAiCall } from "@/lib/logging";
import { getServerSession } from "@/app/api/auth/[...nextauth]/route";
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
        maxTokens: 1024,
        onFinish: async ({ usage }) => {
          const latency = Date.now() - startTime;
          // Log successful call — runs in background
          logAiCall({
            userId: session.user.id || "unknown",
            model: modelId,
            inputTokens: usage?.promptTokens || 0,
            outputTokens: usage?.completionTokens || 0,
            latency,
            success: true,
          });
        },
      });

      // Return the stream with model info in headers
      const response = result.toDataStreamResponse();

      // Add custom header with current model index for frontend sync
      response.headers.set("X-Model-Index", String(getCurrentModelIndex()));
      response.headers.set("X-Model-Id", modelId);

      return response;
    } catch (err: unknown) {
      // Check if it's a rate limit error (429)
      const error = err as { status?: number; headers?: Headers; message?: string };

      if (error.status === 429) {
        const retryAfter = error.headers?.get("retry-after") || null;
        const fallback = await handleRateLimit(retryAfter);

        if (!fallback) {
          // All models exhausted
          const latency = Date.now() - startTime;
          logAiCall({
            userId: session.user.id || "unknown",
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

        // Retry with fallback model
        modelId = fallback.modelId;
        model = fallback.model;

        const retryResult = streamText({
          model,
          system: SYSTEM_PROMPT,
          messages,
          maxTokens: 1024,
          onFinish: async ({ usage }) => {
            const latency = Date.now() - startTime;
            logAiCall({
              userId: session.user.id || "unknown",
              model: modelId,
              inputTokens: usage?.promptTokens || 0,
              outputTokens: usage?.completionTokens || 0,
              latency,
              success: true,
            });
          },
        });

        const retryResponse = retryResult.toDataStreamResponse();
        retryResponse.headers.set(
          "X-Model-Index",
          String(getCurrentModelIndex())
        );
        retryResponse.headers.set("X-Model-Id", modelId);
        return retryResponse;
      }

      // Non-429 error
      throw err;
    }
  } catch (err: unknown) {
    const latency = Date.now() - startTime;
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";

    // Log failure
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
