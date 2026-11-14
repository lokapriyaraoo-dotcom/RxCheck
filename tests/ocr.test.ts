import { describe, it, expect } from 'vitest';
import { mapGatewayErrorMessage, validateImageBytes, readPrescriptionImage } from '../services/ocr';

describe('OCR safety boundary',()=>{
 it('accepts a positive image size below the cap',()=>expect(validateImageBytes(12*1024*1024-1)).toBe(true));
 it('accepts the exact byte cap',()=>expect(validateImageBytes(12*1024*1024)).toBe(true));
 it('rejects images above the cap',()=>expect(validateImageBytes(12*1024*1024+1)).toBe(false));
 it('rejects invalid sizes',()=>{expect(validateImageBytes(0)).toBe(false);expect(validateImageBytes(-1)).toBe(false);expect(validateImageBytes(NaN)).toBe(false);expect(validateImageBytes(1.5)).toBe(false);});
 it('does not leak raw gateway errors for known patterns',()=>{for(const key of ['NETWORK','TIMEOUT','INVALID_IMAGE','TOO_LARGE','UNAUTHORIZED','RATE_LIMIT']){const msg=mapGatewayErrorMessage(key);expect(msg).not.toContain(key);expect(msg.length).toBeGreaterThan(10);}});
 it('maps unknown failures to a generic safe message',()=>expect(mapGatewayErrorMessage('private stack trace')).toContain('manually'));
 it('does not claim to run OCR when no engine is configured',async()=>await expect(readPrescriptionImage('file://fake.jpg')).rejects.toThrow(/not configured/i));
});
