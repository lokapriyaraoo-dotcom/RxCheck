/**
 * RxCheck interaction database contract, version 1.
 *
 * Intentionally ships with no clinical rules or ingredient aliases. Clinical
 * records must be sourced from licensed/public evidence and reviewed by a
 * qualified pharmacist before they can produce a severity classification.
 */
export type InteractionSeverity = 'critical' | 'major' | 'moderate' | 'minor';
export type InteractionRecord = {
  id: string;
  ingredientA: string;
  ingredientB: string;
  severity: InteractionSeverity;
  clinicalEffect: string;
  recommendation: string;
  sourceName: string;
  sourceUrl: string;
  evidenceDate: string;
  reviewedByPharmacist: boolean;
  pharmacistReviewDate?: string;
};

export const INTERACTION_DATABASE_VERSION = '1.0.0';
export const INTERACTION_DATABASE_UPDATED = '2026-11-25';
export const INTERACTION_DATABASE_SOURCE_POLICY =
  'No clinical interaction is classified unless its source and pharmacist review are recorded.';

export const medicineIngredientAliases: Record<string, string> = {};

export const interactionRecords: InteractionRecord[] = [];

export function normalizeMedicineKey(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
