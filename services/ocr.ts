import type { Patient, Medicine } from './types';

export type OcrResult = { text: string; lines: string[]; engine: 'Google ML Kit Text Recognition v2'; warning: string };
export const OCR_REVIEW_WARNING = 'OCR can misread handwriting, medicine names, decimal points and units. Verify every character against the original prescription.';

export function extractPatientDetails(text: string): Partial<Patient> {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const valueFor = (patterns: RegExp[]): string => {
    for (const line of lines) for (const pattern of patterns) {
      const value = line.match(pattern)?.[1]?.trim().replace(/[|]+$/g, '').trim();
      if (value && value.length < 80) return value;
    }
    return '';
  };
  const name = valueFor([/^(?:patient\s*)?name\s*[:：-]\s*(.+)$/i, /^patient\s*[:：-]\s*(.+)$/i]);
  const age = valueFor([/^(?:patient\s*)?age\s*[:：-]\s*(\d{1,3})(?:\s*(?:years?|yrs?|y))?\b/i]);
  const weightKg = valueFor([/^(?:body\s*)?weight\s*[:：-]\s*(\d{1,3}(?:\.\d+)?)\s*(?:kg|kgs)?\b/i]);
  const gender = valueFor([/^(?:sex|gender)\s*[:：-]\s*(male|female|other)\b/i]);
  return { ...(name ? {name} : {}), ...(age ? {age} : {}), ...(weightKg ? {weightKg} : {}), ...(gender ? {gender: gender[0].toUpperCase()+gender.slice(1).toLowerCase()} : {}) };
}

/** Conservative candidates only: every extracted medicine remains unverified until the user confirms it. */
export function extractMedicineCandidates(text: string): Partial<Medicine>[] {
  const seen = new Set<string>();
  const out: Partial<Medicine>[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim().replace(/^\s*(?:\d+[.)]|[-•*])\s*/, '');
    if (!line || /^(patient|name|age|sex|gender|date|doctor|hospital|address|diagnosis|rx|prescription)\b/i.test(line)) continue;
    const match = line.match(/^([A-Za-z][A-Za-z0-9+()./-]*(?:\s+[A-Za-z][A-Za-z0-9+()./-]*){0,3})\s+(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|mL|iu|%))\b(.*)$/i);
    if (!match) continue;
    const key = match[1].toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({name: match[1], strength: match[2].trim(), dose: '', unit: 'unknown', frequency: match[3].trim(), duration: '', instructions: '', needsReview: true});
  }
  return out;
}

export async function readPrescriptionImage(uri: string): Promise<OcrResult> {
  if (!uri || !/^(file|content):\/\//i.test(uri)) throw new Error('The selected image URI is invalid. Please choose it again.');
  try {
    const mlkit = await import('expo-mlkit-ocr');
    if (!mlkit.isSupported()) throw new Error('Google ML Kit OCR is not supported on this device.');
    const result = await mlkit.recognizeText(uri);
    const text = result.text?.trim() ?? '';
    if (!text) throw new Error('No readable text was detected. Try a sharper, brighter, straight-on image.');
    return {text, lines:text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean), engine:'Google ML Kit Text Recognition v2', warning:OCR_REVIEW_WARNING};
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (/not supported|not installed|native module|ExpoMlkitOcr/i.test(message)) throw new Error('Google ML Kit is unavailable in this app build. Use the RxCheck preview APK, not Expo Go.');
    if (/no readable text/i.test(message)) throw error;
    throw new Error('Could not read this image. Retake it in good light, keep the page flat, or enter details manually.');
  }
}
export function validateImageBytes(bytes:number,maxBytes=12*1024*1024){return Number.isSafeInteger(bytes)&&bytes>0&&bytes<=maxBytes;}

export function mapGatewayErrorMessage(code: string): string {
  const messages: Record<string,string> = {
    NETWORK:'OCR is processed on-device; check that the image is available and try again.',
    TIMEOUT:'Text recognition took too long. Try a clearer or smaller image.',
    INVALID_IMAGE:'This image format could not be read. Choose a JPG or PNG image.',
    TOO_LARGE:'The image is too large. Choose an image under 12 MB.',
    UNAUTHORIZED:'The OCR native module is not available in this app build.',
    RATE_LIMIT:'Too many attempts. Please try again later.',
  };
  return messages[code] ?? 'Text extraction is unavailable. Please enter details manually.';
}
