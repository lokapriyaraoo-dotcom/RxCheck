export interface Env {
  GOOGLE_CLOUD_VISION_API_KEY: string;
}
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}
type Extracted = {
  patient: { name: string; age: string; gender: string; weightKg: string; allergies: string };
  medicines: Array<{ name: string; strength: string; dose: string; unit: string; frequency: string; duration: string; route: string; instructions: string; confidence: number }>;
};
function extractFields(text: string): Extracted {
  const lines = text.replace(/\u00a0/g, ' ').replace(/[：]/g, ':').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  const all = lines.join('\n');
  const first = (re: RegExp) => all.match(re)?.[1]?.trim() || '';
  const ageSex = first(/(?:age\s*\/\s*sex|age\s+and\s+sex)\s*:\s*([^\n]+)/i);
  const patient = {
    name: first(/(?:patient\s*)?name\s*:\s*([A-Za-z][A-Za-z .'-]{1,70})/i) || first(/patient\s*:\s*([A-Za-z][A-Za-z .'-]{1,70})/i),
    age: first(/(?:patient\s*)?age\s*:\s*(\d{1,3})\s*(?:years?|yrs?|y)?\b/i) || ageSex.match(/\b(\d{1,3})\s*(?:years?|yrs?|y)\b/i)?.[1] || '',
    gender: first(/(?:sex|gender)\s*:\s*(male|female|other)\b/i) || ageSex.match(/\b(male|female|other)\b/i)?.[1] || '',
    weightKg: first(/(?:body\s*)?weight\s*:?\s*(\d{1,3}(?:\.\d+)?)\s*(?:kg|kgs)\b/i),
    allergies: first(/(?:known\s*)?allergies?\s*:\s*([^\n]+)/i)
  };
  const medicines: Extracted['medicines'] = [];
  const stop = /^(patient|name|age|sex|gender|date|diagnosis|doctor|hospital|address|phone|allerg|weight|follow.?up|investigation|complaint)/i;
  const seen = new Set<string>();
  for (const raw of lines) {
    const line = raw.replace(/^\s*(?:\d+[.)]|[-•*])\s*/, '').trim();
    if (!line || stop.test(line) || line.length < 4) continue;
    const m = line.match(/^([A-Za-z][A-Za-z0-9+()./-]*(?:\s+[A-Za-z][A-Za-z0-9+()./-]*){0,4})\s+(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|mL|iu|%))\b(.*)$/i);
    if (!m) continue;
    const key = m[1].toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    medicines.push({ name: m[1].trim(), strength: m[2].trim(), dose: '', unit: 'unknown', frequency: m[3].trim(), duration: '', route: '', instructions: '', confidence: 0.5 });
  }
  return { patient, medicines };
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    const path = new URL(request.url).pathname;
    if (request.method !== 'POST' || !['/extract', '/extract-image'].includes(path)) return json({ error: 'Not found' }, 404);
    if (!env.GOOGLE_CLOUD_VISION_API_KEY) return json({ error: 'Google Cloud Vision is not configured. Add GOOGLE_CLOUD_VISION_API_KEY as a Worker Secret.' }, 503);
    try {
      let text = '';
      if (path === '/extract') {
        let input: { prescriptionText?: string };
        try { input = await request.json(); } catch { return json({ error: 'Invalid JSON request.' }, 400); }
        text = String(input.prescriptionText || '').slice(0, 12000);
        if (!text.trim()) return json({ error: 'Prescription text is required.' }, 400);
      } else {
        let input: { imageBase64?: string; mimeType?: string };
        try { input = await request.json(); } catch { return json({ error: 'Invalid image request.' }, 400); }
        const imageBase64 = String(input.imageBase64 || '');
        const mimeType = String(input.mimeType || 'image/jpeg');
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) return json({ error: 'Only JPEG, PNG or WebP images are supported.' }, 415);
        if (!imageBase64 || imageBase64.length > 16_000_000) return json({ error: 'Image is missing or exceeds the 12 MB limit.' }, 413);
        const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(env.GOOGLE_CLOUD_VISION_API_KEY)}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requests: [{ image: { content: imageBase64 }, features: [{ type: 'DOCUMENT_TEXT_DETECTION' }] }] })
        });
        const result = await response.json() as { responses?: Array<{ fullTextAnnotation?: { text?: string }; error?: { message?: string } }> };
        if (!response.ok || result.responses?.[0]?.error) throw new Error(result.responses?.[0]?.error?.message || `Google Vision API error (${response.status}). Check API enablement, key restrictions and billing.`);
        text = result.responses?.[0]?.fullTextAnnotation?.text || '';
        if (!text.trim()) return json({ error: 'Google Vision could not detect readable text. Try a sharper, brighter image.' }, 422);
      }
      return json({ extracted: extractFields(text), text, source: path === '/extract-image' ? 'google-cloud-vision' : 'provided-text' });
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : 'Prescription extraction failed.' }, 502);
    }
  }
};
