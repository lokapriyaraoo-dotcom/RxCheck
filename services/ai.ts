export type ClaudeReviewInput = {
  prescriptionText: string;
  patient: Record<string, unknown>;
  medicines: Array<Record<string, unknown>>;
  otherMedicines: string;
};

/** Calls the RxCheck server proxy. OmniRoute and Anthropic credentials stay server-side. */
export async function askClaudeToReview(input: ClaudeReviewInput): Promise<string> {
  const endpoint = process.env.EXPO_PUBLIC_RXCHECK_AI_URL?.trim();
  if (!endpoint) throw new Error('Claude AI is not connected yet. RxCheck needs its secure AI gateway URL configured by the project owner.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(`${endpoint.replace(/\\/$/, '')}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal: controller.signal,
    });
    const data = await response.json() as { analysis?: string; error?: string };
    if (!response.ok) throw new Error(data.error || `AI service returned HTTP ${response.status}.`);
    if (typeof data.analysis !== 'string' || !data.analysis.trim()) throw new Error('The AI service returned an empty response.');
    return data.analysis.trim();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error('Claude review timed out. Please try again.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
