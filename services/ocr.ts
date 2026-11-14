export type OcrResult = {
  text: string;
  lines: string[];
  engine: 'Google ML Kit Text Recognition v2';
  warning: string;
};

export const OCR_REVIEW_WARNING =
  'OCR can misread handwriting, medicine names, decimal points and units. Verify every character against the original prescription before using these details.';

/**
 * Runs Google ML Kit locally on the device. No prescription image is uploaded
 * by this function. Native support requires an EAS/custom development build;
 * Expo Go does not contain this native module.
 */
export async function readPrescriptionImage(uri: string): Promise<OcrResult> {
  if (!uri || !/^(file|content):\/\//i.test(uri)) {
    throw new Error('The selected image URI is invalid. Please choose the image again.');
  }

  try {
    const mlkit = await import('expo-mlkit-ocr');
    if (!mlkit.isSupported()) {
      throw new Error('Google ML Kit OCR is not supported on this device.');
    }
    const result = await mlkit.recognizeText(uri);
    const text = result.text?.trim() ?? '';
    if (!text) {
      throw new Error('No readable text was detected. Try a sharper, brighter, straight-on image.');
    }
    return {
      text,
      lines: text.split(/\r?\n/).map(line => line.trim()).filter(Boolean),
      engine: 'Google ML Kit Text Recognition v2',
      warning: OCR_REVIEW_WARNING,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (/not supported|not installed|native module|ExpoMlkitOcr/i.test(message)) {
      throw new Error('Google ML Kit is unavailable in this app build. Install the Rx/Check development or preview APK; Expo Go is not supported.');
    }
    if (/no readable text/i.test(message)) throw error;
    throw new Error('Could not read this image. Retake it in good light, keep the page flat, or enter the details manually.');
  }
}

export function validateImageBytes(bytes: number, maxBytes = 12 * 1024 * 1024): boolean {
  return Number.isSafeInteger(bytes) && bytes > 0 && bytes <= maxBytes;
}

export function mapGatewayErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    NETWORK: 'OCR is processed on-device; check that the image is available and try again.',
    TIMEOUT: 'Text recognition took too long. Try a clearer or smaller image.',
    INVALID_IMAGE: 'This image format could not be read. Choose a JPG or PNG image.',
    TOO_LARGE: 'The image is too large. Choose an image under 12 MB.',
    UNAUTHORIZED: 'The OCR native module is not available in this app build.',
    RATE_LIMIT: 'Too many attempts. Please try again later.',
  };
  return messages[code] ?? 'Text extraction is unavailable. Please enter details manually.';
}
