import type { Finding, Medicine } from './types';
import { checkInteractions } from './interactions';

export type ClinicalWorkflowResult = {
  medicineCount: number;
  pairCount: number;
  interactionFindings: Finding[];
  foodInteractionStatus: 'not-assessed';
  safetyStatus: 'requires-review';
};

/**
 * Runs the currently supported local DDI workflow.
 * Pair coverage is exhaustive for the entered list; an absent/unreviewed record
 * remains UNKNOWN. Food interactions are explicitly not assessed until a
 * governed food-interaction dataset and patient food/exposure input are added.
 */
export function runClinicalWorkflow(medicines: Medicine[]): ClinicalWorkflowResult {
  const usable = medicines.filter(item => item.name.trim());
  const unique = usable.filter((item, index, all) =>
    all.findIndex(other => other.name.trim().toLocaleLowerCase() === item.name.trim().toLocaleLowerCase()) === index
  );
  const pairCount = (unique.length * (unique.length - 1)) / 2;
  return {
    medicineCount: unique.length,
    pairCount,
    interactionFindings: checkInteractions(unique),
    foodInteractionStatus: 'not-assessed',
    safetyStatus: 'requires-review',
  };
}
