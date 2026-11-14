import type { Patient, Medicine } from './types';

export type OcrResult = { text: string; lines: string[]; engine: 'Google ML Kit Text Recognition v2'; warning: string };
export const OCR_REVIEW_WARNING = 'OCR can misread handwriting, medicine names, decimal points and units. Verify every character against the original prescription.';

export function extractPatientDetails(text: string): Partial<Patient> {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const find = (patterns: RegExp[]): string => {
    for (const line of lines) for (const pattern of patterns) {
      const value = line.match(pattern)?.[1]?.trim().replace(/[|]+$/g, '').trim();
      if (value && value.length < 100) return value;
    }
    return '';
  };
  const name = find([/^(?:patient\s*)?name\s*[:：-]\s*(.+)$/i, /^patient\s*[:：-]\s*(.+)$/i]);
  const ageSex = find([/^(?:age\s*\/\s*sex|age\s+and\s+sex)\s*[:：-]\s*(.+)$/i]);
  const age = find([/^(?:patient\s*)?age\s*[:：-]\s*(\d{1,3})(?:\s*(?:years?|yrs?|y))?\b/i]) || ageSex.match(/\b(\d{1,3})\s*(?:years?|yrs?|y)\b/i)?.[1] || '';
  const gender = find([/^(?:sex|gender)\s*[:：-]\s*(male|female|other)\b/i]) || ageSex.match(/\b(male|female|other)\b/i)?.[1] || '';
  let weightKg = find([/^(?:body\s*)?weight\s*[:：-]\s*(\d{1,3}(?:\.\d+)?)\s*(?:kg|kgs)?\b/i, /^:\s*(\d{1,3}(?:\.\d+)?)\s*(?:kg|kgs)\b/i]);
  if (!weightKg) {
    const wi = lines.findIndex(x => /^(?:body\s*)?weight\s*:?$/i.test(x));
    if (wi >= 0 && lines[wi + 1]) weightKg = lines[wi + 1].match(/(\d{1,3}(?:\.\d+)?)\s*(?:kg|kgs)\b/i)?.[1] || '';
  }
  return { ...(name ? {name} : {}), ...(age ? {age} : {}), ...(weightKg ? {weightKg} : {}), ...(gender ? {gender: gender[0].toUpperCase()+gender.slice(1).toLowerCase()} : {}) };
}

/** Reconstructs OCR table columns only when a clear Drug Name heading is present. */
export function extractMedicineCandidates(text: string): Partial<Medicine>[] {
  const lines = text.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  const headers: Record<string, RegExp> = {
    name: /^(?:drug\s*name|medicine\s*name|medication)\s*:?$/i,
    strength: /^strength\s*:?$/i,
    dose: /^(?:prescribed\s*)?dose\s*:?$/i,
    frequency: /^frequency\s*:?$/i,
    route: /^route\s*:?$/i,
    duration: /^duration\s*:?$/i,
    instructions: /^(?:additional\s*)?instructions?\s*:?$/i,
  };
  const columns: Record<string,string[]> = {name:[],strength:[],dose:[],frequency:[],route:[],duration:[],instructions:[]};
  let active = '';
  for (const raw of lines) {
    const line = raw.replace(/^\s*(?:\d+[.)]\s+|[-•*]\s*)/, '').trim();
    if (!line || /^(?:s\.?\s*no\.?|serial\s*no\.?)$/i.test(line)) continue;
    const header = Object.entries(headers).find(([,pattern])=>pattern.test(line));
    if (header) { active = header[0]; continue; }
    if (/^(?:additional\s+)?instructions?\s+advised:?$/i.test(line) || /^(?:investigations?\s+advised|presenting complaints|provisional diagnosis|hospital|consultant|reg\.?\s*no\.?|date)\b/i.test(line)) { active=''; continue; }
    if (active && !/^(?:oral|topical|im|iv|sc|s\.c\.)$/i.test(line) && active==='name' && /^(?:prescription|r\s*prescription)$/i.test(line)) continue;
    if (active) columns[active].push(line);
  }
  const tableNames = columns.name.filter(x => !/^(?:drug\s*name|name)$/i.test(x));
  const out: Partial<Medicine>[] = [];
  if (tableNames.length) {
    for (let i=0;i<tableNames.length;i++) {
      const name=tableNames[i].replace(/^\d+\s+/,'').trim();
      if (!name || /^(?:abc|general|hospital|care today|healthier tomorrow)/i.test(name)) continue;
      out.push({
        name,
        strength: columns.strength[i] || '',
        dose: columns.dose[i] || '',
        unit: 'unknown',
        frequency: columns.frequency[i] || '',
        duration: columns.duration[i] || '',
        instructions: [columns.route[i] ? 'Route: '+columns.route[i] : '', columns.instructions[i] || ''].filter(Boolean).join(' · '),
        needsReview: true
      });
    }
  }
  // Fallback for OCR engines that return each medicine and strength on one line.
  if (!out.length) {
    const seen = new Set<string>();
    for (const raw of lines) {
      const line = raw.trim().replace(/^\s*(?:\d+[.)]|[-•*])\s*/, '');
      const match = line.match(/^([A-Za-z][A-Za-z0-9+()./-]*(?:\s+[A-Za-z][A-Za-z0-9+()./-]*){0,3})\s+(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|mL|iu|%))\b(.*)$/i);
      if (!match) continue;
      const key=match[1].toLowerCase(); if(seen.has(key))continue; seen.add(key);
      out.push({name:match[1],strength:match[2].trim(),dose:'',unit:'unknown',frequency:match[3].trim(),duration:'',instructions:'',needsReview:true});
    }
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
