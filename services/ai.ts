export type AIExtractedPrescription = {
  patient?: { name?: string; age?: string | number; gender?: string; weightKg?: string | number; allergies?: string };
  medicines?: Array<{ name?: string; strength?: string; dose?: string; unit?: string; frequency?: string; duration?: string; route?: string; instructions?: string; confidence?: number }>;
};
export function isAIConfigured(): boolean {
  return Boolean(process.env.EXPO_PUBLIC_RXCHECK_AI_URL?.trim());
}

function endpointUrl(path: string) {
  const endpoint = process.env.EXPO_PUBLIC_RXCHECK_AI_URL?.trim();
  if (!endpoint) throw new Error('AI gateway is not configured. Local OCR extraction will be used; configure the secure RxCheck AI gateway to enable AI autofill.');
  return `${endpoint.replace(/\/$/, '')}${path}`;
}
async function postAI<T>(path: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(endpointUrl(path), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal });
    const data = await response.json() as T & { error?: string };
    if (!response.ok) throw new Error(data.error || `AI service returned HTTP ${response.status}.`);
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error('AI extraction timed out. Please try again.');
    throw error;
  } finally { clearTimeout(timeout); }
}
/** AI organizes OCR text into form fields. It must never invent missing prescription values. */
export async function extractPrescriptionWithAI(prescriptionText: string): Promise<AIExtractedPrescription> {
  const data = await postAI<{ extracted: AIExtractedPrescription }>('/extract', { prescriptionText });
  if (!data.extracted || !Array.isArray(data.extracted.medicines)) throw new Error('AI returned an invalid prescription format.');
  return data.extracted;
}
