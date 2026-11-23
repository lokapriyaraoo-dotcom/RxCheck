import type { Patient, Medicine } from './types';

export type OcrResult = { text: string; lines: string[]; engine: 'Google ML Kit Text Recognition v2'; warning: string };
export const OCR_REVIEW_WARNING = 'OCR can misread handwriting, medicine names, decimal points and units. Verify every character against the original prescription.';

export function extractPatientDetails(text: string): Partial<Patient> {
  const normalized = text.replace(/\u00a0/g, ' ').replace(/[：]/g, ':');
  const lines = normalized.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const whole = lines.join('\n');
  const first = (patterns: RegExp[]): string => {
    for (const pattern of patterns) {
      const match = whole.match(pattern);
      const value = match?.[1]?.replace(/\s+/g, ' ').trim();
      if (value && value.length < 100) return value;
    }
    return '';
  };
  const name = first([
    /(?:patient\s*)?name\s*:\s*([A-Za-z][A-Za-z .'-]{1,70})/i,
    /patient\s*:\s*([A-Za-z][A-Za-z .'-]{1,70})/i
  ]);
  const ageSex = first([/age\s*\/\s*sex\s*:\s*([^\n]+)/i, /age\s+and\s+sex\s*:\s*([^\n]+)/i]);
  const compactAgeSex = ageSex.match(/^\s*(\d{1,3})\s*(?:(?:years?|yrs?|y)\s*)?(?:\/|,|-|\s)\s*(male|female|other|m|f)\b/i);
  const age = first([/(?:patient\s*)?age\s*:\s*(\d{1,3})\s*(?:years?|yrs?|y)?\b/i]) || ageSex.match(/\b(\d{1,3})\s*(?:years?|yrs?|y)\b/i)?.[1] || compactAgeSex?.[1] || '';
  const gender = first([/(?:sex|gender)\s*:\s*(male|female|other|m|f)\b/i]) || ageSex.match(/\b(male|female|other|m|f)\b/i)?.[1] || compactAgeSex?.[2] || '';
  let weightKg = first([/(?:body\s*)?weight\s*:?\s*(?:\n\s*)?:?\s*(\d{1,3}(?:\.\d+)?)\s*(?:kg|kgs)\b/i]);
  if (!weightKg) {
    const wi = lines.findIndex(x => /^(?:body\s*)?weight\s*:?\s*$/i.test(x));
    // OCR may read the Weight label before patient name and age, and its value several lines later.
    if (wi >= 0) {
      for (const candidate of lines.slice(wi + 1, wi + 7)) {
        const match = candidate.match(/^:?\s*(\d{1,3}(?:\.\d+)?)\s*(?:kg|kgs)\b/i);
        if (match) { weightKg = match[1]; break; }
        if (/^(?:presenting complaints|diagnosis|drug name|medicine name)\b/i.test(candidate)) break;
      }
    }
  }
  const allergies = first([/(?:known\s*)?allergies?\s*:\s*([^\n]+)/i]);
  const normalizedGender = ({m:'Male', male:'Male', f:'Female', female:'Female', other:'Other'} as Record<string,string>)[gender.toLowerCase()] || gender;
  return {
    ...(name ? {name} : {}), ...(age ? {age} : {}),
    ...(weightKg ? {weightKg} : {}),
    ...(gender ? {gender: normalizedGender} : {}),
    ...(allergies ? {allergies} : {})
  };
}

/** Extracts medicines from both row-wise and column-wise OCR layouts. */
export function extractMedicineCandidates(text: string): Partial<Medicine>[] {
  const lines = text.replace(/\u00a0/g, ' ').replace(/\\n/g, '\n').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
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
    if (active === 'name' && /^(?:prescription|r\s*prescription)$/i.test(line)) continue;
    if (active) columns[active].push(line);
  }
  const out: Partial<Medicine>[] = [];
  const tableNames = columns.name
    .map(x => x.replace(/^\d+\s+/, '').trim())
    .filter(x => x && !/^(?:drug\s*name|name|abc|general|hospital|care today|healthier tomorrow)$/i.test(x));
  if (tableNames.length) {
    for (let i=0;i<tableNames.length;i++) {
      const name=tableNames[i];
      if (/^(?:additional|investigations|presenting|provisional)/i.test(name)) continue;
      out.push({
        name, strength: columns.strength[i] || '', dose: columns.dose[i] || '',
        unit: 'unknown', frequency: columns.frequency[i] || '',
        duration: columns.duration[i] || '',
        instructions: [columns.route[i] ? 'Route: '+columns.route[i] : '', columns.instructions[i] || ''].filter(Boolean).join(' · '),
        needsReview: true
      });
    }
  }
  // Handwritten/free-form prescriptions often put the medicine on one line and
  // the dose schedule on the next. Only parse rows anchored by an explicit
  // dosage-form prefix; never guess a drug name from arbitrary handwriting.
  if (!out.length) {
    const formLine = /^(?:\d+[.)]\s*)?(?:tab(?:let)?s?|t\.?|cap(?:sule)?s?|cap\.?|syp(?:rup)?|syp\.?|susp(?:ension)?|inj(?:ection)?|inj\.?|drops?|oint(?:ment)?|cream|gel|powder)\.?\s+(.+)$/i;
    const schedulePattern = /\b(?:\d+\s*[-–]\s*\d+\s*[-–]\s*\d+(?:\s*[-–]\s*\d+)?|OD|BD|BID|TDS|TID|QID|QDS|HS|SOS|PRN|STAT|once\s+daily|twice\s+daily|thrice\s+daily|\d+\s*(?:morning|afternoon|evening|eve|night|AR|AC|PC)(?:\s*[,/]\s*\d+\s*(?:morning|afternoon|evening|eve|night|AR|AC|PC))*)\b/i;
    const durationPattern = /(?:\bx\s*|\bfor\s+)?(\d+\s*(?:days?|d|weeks?|wks?|months?))\b/i;
    const instructionsPattern = /\b(?:after|before)\s+(?:food|meals?)\b/i;
    for (let i = 0; i < lines.length; i++) {
      const source = lines[i].replace(/^\s*\d+[.)]?\s+/, '').trim();
      const start = source.match(formLine);
      if (!start) continue;
      let combined = start[1].trim();
      const next = lines[i + 1]?.trim() || '';
      if (next && schedulePattern.test(next) && !formLine.test(next)) {
        combined += ' ' + next;
        i++;
      }
      const following = lines[i + 1]?.trim() || '';
      if (following && (durationPattern.test(following) || instructionsPattern.test(following)) && !formLine.test(following)) {
        combined += ' ' + following;
        i++;
      }
      const schedule = combined.match(schedulePattern);
      const duration = combined.match(durationPattern)?.[1]?.replace(/\s+/g, ' ').trim() || '';
      const nameAndStrength = (schedule ? combined.slice(0, schedule.index) : combined)
        .replace(durationPattern, '').replace(instructionsPattern, '').trim();
      const strengthMatch = nameAndStrength.match(/\b\d+(?:\.\d+)?\s*(?:mg|mcg|µg|g|ml|iu|units?|%)\b/i);
      const strength = strengthMatch?.[0]?.replace(/\s+/g, ' ').trim() || '';
      const name = nameAndStrength
        .replace(/\b(?:\d+(?:\.\d+)?\s*(?:mg|mcg|µg|g|ml|iu|units?|%))\b/ig, '')
        .replace(/[,:;–-]+$/g, '').replace(/\s+/g, ' ').trim();
      if (!name || name.length < 2) continue;
      out.push({
        name, strength, dose: '', unit: 'unknown',
        frequency: schedule?.[0]?.trim() || '',
        duration, instructions: combined.match(instructionsPattern)?.[0] || '', needsReview: true
      });
    }
  }

  // Row-wise table fallback: serial number, medicine, strength, dose, frequency and route.
  if (!out.length) {
    const seen = new Set<string>();
    for (const raw of lines) {
      const line=raw.replace(/^\s*\d+[.)]?\s+/, '').trim();
      const match=line.match(/^([A-Za-z][A-Za-z0-9+()./-]*(?:[\s-]+[A-Za-z][A-Za-z0-9+()./-]*){0,3})\s+(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|mL|iu|%))\s+(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|mL|iu|%))\s+(.+?)(?:\s+(oral|topical|im|iv|sc))?$/i);
      if (!match) continue;
      const key=match[1].toLowerCase(); if(seen.has(key))continue; seen.add(key);
      out.push({name:match[1],strength:match[2].trim(),dose:match[3].trim(),unit:'unknown',frequency:match[4].trim(),duration:'',instructions:match[5]?'Route: '+match[5]:'',needsReview:true});
    }
  }
  // Last fallback for lines containing a medicine name followed by a strength.
  if (!out.length) {
    const seen = new Set<string>();
    for (const raw of lines) {
      const line = raw.replace(/^\s*\d+[.)]?\s+/, '').trim();
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
    const structuredLines = (result.blocks || []).flatMap(block => block.lines || [])
      .map(line => ({text: String(line.text || '').trim(), y: Number(line.boundingBox?.y ?? 0), x: Number(line.boundingBox?.x ?? 0)}))
      .filter(line => line.text)
      .sort((a,b) => a.y-b.y || a.x-b.x)
      .map(line => line.text);
    const text = (structuredLines.length ? structuredLines.join('\n') : result.text || '').trim();
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
