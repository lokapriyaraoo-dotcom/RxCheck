import { requireNativeModule } from 'expo-modules-core';

export type HandwritingOcrResult = {
  text: string;
  lines: string[];
  confidences: number[];
  engine: string;
  warning: string;
};

type NativeHandwritingOcr = {
  recognize(uri: string): Promise<HandwritingOcrResult>;
};

export async function readHandwrittenPrescriptionImage(uri: string): Promise<HandwritingOcrResult> {
  if (!uri || !/^(file|content):\\/\\//i.test(uri)) {
    throw new Error('The selected image URI is invalid. Please choose it again.');
  }
  let native: NativeHandwritingOcr;
  try {
    native = requireNativeModule<NativeHandwritingOcr>('RxCheckPaddleOcr');
  } catch {
    throw new Error('Handwriting OCR is not included in this app build. Install the latest RxCheck Android APK.');
  }
  const result = await native.recognize(uri);
  if (!result || typeof result.text !== 'string') {
    throw new Error('The handwriting OCR engine returned an invalid result.');
  }
  if (!result.text.trim()) throw new Error('No text was detected. Retake the image or enter details manually.');
  return result;
}
