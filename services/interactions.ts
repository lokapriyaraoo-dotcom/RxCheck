import type { Finding, Medicine } from './types';
import {
  interactionRecords, medicineIngredientAliases, normalizeMedicineKey,
  INTERACTION_DATABASE_VERSION,
} from './interactionDatabase';

function ingredientFor(name: string): string | undefined {
  return medicineIngredientAliases[normalizeMedicineKey(name)];
}
function severityFor(value: 'critical'|'major'|'moderate'|'minor'): Finding['severity'] {
  if (value === 'critical' || value === 'major') return 'high';
  if (value === 'moderate') return 'moderate';
  return 'low';
}

/** Only pharmacist-reviewed records can classify a pair. Missing coverage is UNKNOWN. */
export function checkInteractions(medicines: Medicine[]): Finding[] {
  const usable = medicines.filter(m => m.name.trim());
  if (usable.length < 2) return [{
    severity: 'unknown', title: 'Interaction check incomplete',
    detail: 'Add all prescribed medicines, over-the-counter products and supplements. A pharmacist must review the complete list.',
    source: `RxCheck local interaction database v${INTERACTION_DATABASE_VERSION}`,
  }];

  const findings: Finding[] = [];
  for (let i = 0; i < usable.length; i++) for (let j = i + 1; j < usable.length; j++) {
    const first = usable[i], second = usable[j];
    const ingredientA = ingredientFor(first.name), ingredientB = ingredientFor(second.name);
    const pairTitle = `${first.name} + ${second.name}`;
    if (!ingredientA || !ingredientB) {
      findings.push({ severity:'unknown', title:`${pairTitle}: interaction status unknown`,
        detail:'One or both medicines could not be mapped to a verified ingredient. No safety conclusion can be made. Confirm both ingredients and ask a pharmacist to check this pair.',
        source:`RxCheck local interaction database v${INTERACTION_DATABASE_VERSION}` });
      continue;
    }
    const record = interactionRecords.find(item =>
      (normalizeMedicineKey(item.ingredientA)===normalizeMedicineKey(ingredientA) && normalizeMedicineKey(item.ingredientB)===normalizeMedicineKey(ingredientB)) ||
      (normalizeMedicineKey(item.ingredientA)===normalizeMedicineKey(ingredientB) && normalizeMedicineKey(item.ingredientB)===normalizeMedicineKey(ingredientA)));
    if (!record || !record.reviewedByPharmacist) {
      findings.push({ severity:'unknown', title:`${pairTitle}: interaction status unknown`,
        detail:record ? 'A candidate interaction record exists but has not been pharmacist-verified. Treat this pair as unknown and request pharmacist review.' : 'No pharmacist-reviewed interaction record exists for this pair. This is not evidence that the combination is safe.',
        source:`RxCheck local interaction database v${INTERACTION_DATABASE_VERSION}` });
      continue;
    }
    findings.push({ severity:severityFor(record.severity), title:`${pairTitle}: ${record.severity.toUpperCase()} interaction`,
      detail:`${record.clinicalEffect} Recommended action: ${record.recommendation} Source: ${record.sourceName} (${record.evidenceDate}). Pharmacist review: ${record.pharmacistReviewDate || 'date not recorded'}.`,
      source:record.sourceUrl });
  }
  return findings;
}

export function doseReview(medicine: Medicine): Finding[] {
  const findings: Finding[] = [];
  if (!medicine.name.trim()) findings.push({severity:'unknown',title:'Medicine name missing',detail:'Enter the exact medicine name as printed on the prescription.'});
  if (!medicine.strength.trim() || !medicine.dose.trim() || medicine.unit === 'unknown') findings.push({severity:'unknown',title:'Dose details need verification',detail:'Confirm strength, dose and unit against the original prescription. Do not guess.'});
  if (medicine.needsReview) findings.push({severity:'unknown',title:'Manual verification required',detail:'This entry has not been confirmed against the original prescription.'});
  return findings;
}
