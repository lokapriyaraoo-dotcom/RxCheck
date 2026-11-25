import { describe, expect, it } from 'vitest';
import { cleanOcrMedicineName, editDistance, findClosestMedicineName } from '../services/medicineNameMatcher';

describe('medicine OCR name matching', () => {
  it('removes common OCR prefixes without changing the medicine spelling', () => {
    expect(cleanOcrMedicineName('I. Metfornmin')).toBe('Metfornmin');
    expect(cleanOcrMedicineName('Tab. Metformin 500 mg')).toBe('Metformin');
  });
  it('calculates edit distance', () => {
    expect(editDistance('Metfornmin', 'Metformin')).toBeLessThanOrEqual(2);
  });
  it('suggests a close local name but never silently replaces the input', () => {
    expect(findClosestMedicineName('I. Metfornmin', ['metformin', 'paracetamol'])).toBe('metformin');
    expect(findClosestMedicineName('unknown medicine', ['metformin', 'paracetamol'])).toBeNull();
  });
  it('does not choose between equally close candidates', () => {
    expect(findClosestMedicineName('cetrizine', ['cetirizine', 'cetrizina'])).toBeNull();
  });
});
