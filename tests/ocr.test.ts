import { describe, it, expect } from 'vitest';
import { mapGatewayErrorMessage, validateImageBytes, OCR_REVIEW_WARNING } from '../services/ocr';

describe('OCR safety boundary', () => {
  it('accepts positive image sizes up to the cap', () => {
    expect(validateImageBytes(12 * 1024 * 1024 - 1)).toBe(true);
    expect(validateImageBytes(12 * 1024 * 1024)).toBe(true);
  });
  it('rejects images above the cap', () => expect(validateImageBytes(12 * 1024 * 1024 + 1)).toBe(false));
  it('rejects invalid sizes', () => {
    for (const size of [0, -1, NaN, 1.5, Infinity]) expect(validateImageBytes(size)).toBe(false);
  });
  it('does not expose internal gateway codes', () => {
    for (const code of ['NETWORK', 'TIMEOUT', 'INVALID_IMAGE', 'TOO_LARGE', 'UNAUTHORIZED', 'RATE_LIMIT']) {
      const message = mapGatewayErrorMessage(code);
      expect(message).not.toContain(code);
      expect(message.length).toBeGreaterThan(10);
    }
  });
  it('uses a generic safe fallback for unknown errors', () => {
    expect(mapGatewayErrorMessage('private stack trace')).toContain('manually');
  });
  it('always warns users to verify OCR output', () => {
    expect(OCR_REVIEW_WARNING).toMatch(/verify every character/i);
    expect(OCR_REVIEW_WARNING).toMatch(/decimal points/i);
  });
});
