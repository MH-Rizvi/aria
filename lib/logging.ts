import prisma from "@/lib/prisma";

interface LogAiCallParams {
  userId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  latency: number; // milliseconds
  success: boolean;
  error?: string;
}

/**
 * Log every AI call to the AiLog table in Supabase.
 * Called after every AI request completes (success or failure).
 * Runs in the background — does not block the response.
 */
export async function logAiCall(params: LogAiCallParams): Promise<void> {
  if (params.userId === "unknown") {
    console.warn("Skipping AI log: userId is unknown");
    return;
  }
  
  try {
    await prisma.aiLog.create({
      data: {
        userId: params.userId,
        model: params.model,
        inputTokens: params.inputTokens,
        outputTokens: params.outputTokens,
        latency: params.latency,
        success: params.success,
        error: params.error || null,
      },
    });
  } catch (err) {
    // Logging should never crash the app — fail silently
    console.error("Failed to log AI call:", err);
  }
}
