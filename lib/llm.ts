import { createGroq } from "@ai-sdk/groq";
import prisma from "@/lib/prisma";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export const MODELS = [
  "llama-3.3-70b-versatile",
  "meta-llama/llama-4-maverick-17b-128e-instruct",
  "moonshotai/kimi-k2-instruct",
  "qwen/qwen3-32b",
  "llama-3.1-8b-instant",
] as const;

export type ModelId = (typeof MODELS)[number];

// In-memory current model index (persists across requests in same process)
let currentModelIndex = 0;

/**
 * Check if any earlier model has recovered from rate limiting.
 * If so, move back to the earliest available model.
 */
async function checkForRecoveredModels(): Promise<void> {
  const now = new Date();

  const rateLimits = await prisma.modelRateLimit.findMany({
    orderBy: { updatedAt: "asc" },
  });

  // Build set of currently rate-limited model IDs
  const rateLimitedSet = new Set<string>();
  for (const rl of rateLimits) {
    if (rl.resetAt > now) {
      rateLimitedSet.add(rl.modelId);
    }
  }

  // Find earliest model that is NOT rate limited
  for (let i = 0; i < MODELS.length; i++) {
    if (!rateLimitedSet.has(MODELS[i])) {
      if (i < currentModelIndex) {
        currentModelIndex = i;
      }
      return;
    }
  }
}

/**
 * Record a rate limit event for the current model.
 * Stores the reset timestamp from retry-after header.
 */
async function recordRateLimit(
  modelId: string,
  retryAfterSeconds: number
): Promise<void> {
  const resetAt = new Date(Date.now() + retryAfterSeconds * 1000);

  await prisma.modelRateLimit.upsert({
    where: { modelId },
    update: { resetAt },
    create: { modelId, resetAt },
  });
}

/**
 * Get the current active model provider for Vercel AI SDK.
 * Checks for recovered models first, then returns the current model.
 */
export async function getActiveModel() {
  await checkForRecoveredModels();
  const modelId = MODELS[currentModelIndex];
  return {
    model: groq(modelId),
    modelId,
    modelIndex: currentModelIndex,
  };
}

/**
 * Handle a 429 rate limit error from Groq.
 * Records the rate limit, advances to the next model.
 * Returns the new model or null if all models are exhausted.
 */
export async function handleRateLimit(
  retryAfterHeader: string | null
): Promise<{ model: ReturnType<typeof groq>; modelId: string; modelIndex: number } | null> {
  const retryAfterSeconds = retryAfterHeader
    ? parseInt(retryAfterHeader, 10)
    : 60; // Default to 60s if no header

  const rateLimitedModelId = MODELS[currentModelIndex];
  await recordRateLimit(rateLimitedModelId, retryAfterSeconds);

  // Try to find the next available model
  for (let attempt = 1; attempt < MODELS.length; attempt++) {
    const nextIndex = (currentModelIndex + attempt) % MODELS.length;
    const nextModelId = MODELS[nextIndex];

    // Check if this model is also rate limited
    const rateLimit = await prisma.modelRateLimit.findUnique({
      where: { modelId: nextModelId },
    });

    if (!rateLimit || rateLimit.resetAt <= new Date()) {
      currentModelIndex = nextIndex;
      return {
        model: groq(nextModelId),
        modelId: nextModelId,
        modelIndex: nextIndex,
      };
    }
  }

  // All models exhausted
  return null;
}

/**
 * Get current model index (for Zustand sync on frontend).
 */
export function getCurrentModelIndex(): number {
  return currentModelIndex;
}
