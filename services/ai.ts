import * as FileSystem from 'expo-file-system/legacy';
export type AIExtractedPrescription = {
  patient?: { name?: string; age?: string | number; gender?: string; weightKg?: string | number; allergies?: string };
  medicines?: Array<{ name?: string; strength?: string; dose?: string; unit?: string; frequency?: string; duration?: string; route?: string; instructions?: string; confidence?: number }>;
};
export function isAIConfigured(): boolean {
  return Boolean(process.env.EXPO_PUBLIC_RXCHECK_AI_URL?.trim());
}
function endpointUrl(path: string) {
  const endpoint = process.env.EXPO_PUBLIC_RXCHECK_AI_URL?.trim();
  if (!endpoint) throw new Error('AI gateway is not configured. Configure the secure RxCheck gateway to enable assisted prescription extraction.');
  return `${endpoint.replace(/\/$/, '')}${path}`;
}
async function postAI<T>(path: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);
  try {
    const response = await fetch(endpointUrl(path), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal });
    const data = await response.json() as T & { error?: string };
    if (!response.ok) throw new Error(data.error || `AI service returned HTTP ${response.status}.`);
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error('Prescription extraction timed out. Please try a smaller, clearer image.');
    throw error;
  } finally { clearTimeout(timeout); }
}
/** Text-only fallback; sends OCR text only after the user has consented. */
export async function extractPrescriptionWithAI(prescriptionText: string): Promise<AIExtractedPrescription> {
  const data = await postAI<{ extracted: AIExtractedPrescription }>('/extract', { prescriptionText });
  if (!data.extracted || !Array.isArray(data.extracted.medicines)) throw new Error('AI returned an invalid prescription format.');
  return data.extracted;
}
/** Full image pipeline: image -> vision-capable OmniRoute model. */
export async function extractPrescriptionImageWithAI(uri: string): Promise<AIExtractedPrescription> {
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  if (!base64 || base64.length > 16_000_000) throw new Error('Image is empty or exceeds the 12 MB processing limit.');
  const data = await postAI<{ extracted: AIExtractedPrescription; source?: string }>('/extract-image', {
    imageBase64: base64,
    mimeType: 'image/jpeg'
  });
  if (!data.extracted || !Array.isArray(data.extracted.medicines)) throw new Error('Vision model returned an invalid prescription format.');
  return data.extracted;
}
