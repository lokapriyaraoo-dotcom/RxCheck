import { describe, it, expect } from 'vitest';
import { runClinicalWorkflow } from '../services/clinicalWorkflow';
import type { Medicine } from '../services/types';

const medicine = (id: string, name: string): Medicine => ({
  id, name, strength: '500 mg', dose: '1', unit: 'mg',
  frequency: 'daily', duration: '', instructions: '', needsReview: false,
});

describe('RxCheck clinical workflow', () => {
  it('compares every unique pair exactly once', () => {
    const result = runClinicalWorkflow([
      medicine('1', 'Metformin'), medicine('2', 'Azithromycin'),
      medicine('3', 'Diclofenac'), medicine('4', 'metformin'),
    ]);
    expect(result.medicineCount).toBe(3);
    expect(result.pairCount).toBe(3);
    expect(result.interactionFindings).toHaveLength(3);
  });

  it('does not report missing food interaction coverage as safe', () => {
    const result = runClinicalWorkflow([medicine('1', 'Metformin')]);
    expect(result.foodInteractionStatus).toBe('not-assessed');
    expect(result.safetyStatus).toBe('requires-review');
  });

  it('returns no pairs for a single medicine', () => {
    const result = runClinicalWorkflow([medicine('1', 'Metformin')]);
    expect(result.pairCount).toBe(0);
  });
});
