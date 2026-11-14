export type OcrLine = { text: string; confidence: number };
export type OcrResult = { lines: OcrLine[]; engine: string; warning: string };

/** OCR deliberately fails closed until a maintained native OCR engine is wired in. */
export async function readPrescriptionImage(_uri: string): Promise<OcrResult> {
  throw new Error('OCR is not configured yet. Please enter the medicine details manually and verify them with the original prescription.');
}

export function validateImageBytes(bytes: number, maxBytes = 12 * 1024 * 1024): boolean {
  return Number.isSafeInteger(bytes) && bytes > 0 && bytes <= maxBytes;
}

export function mapGatewayErrorMessage(code: string): string {
  const messages: Record<string,string> = {
    NETWORK: 'Could not connect. Check your connection and try again.',
    TIMEOUT: 'Text extraction timed out. Try a clearer or smaller image.',
    INVALID_IMAGE: 'This image format could not be read. Choose a JPG or PNG image.',
    TOO_LARGE: 'The image is too large. Choose an image under 12 MB.',
    UNAUTHORIZED: 'The text extraction service is not configured. Enter details manually.',
    RATE_LIMIT: 'Too many attempts. Please try again later.',
  };
  return messages[code] ?? 'Text extraction is unavailable. Please enter details manually.';
}
