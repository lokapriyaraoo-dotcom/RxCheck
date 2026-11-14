import type { Finding, Medicine } from './types';

/** No embedded interaction database. Unknown coverage must never be represented as safe. */
export function checkInteractions(medicines: Medicine[]): Finding[] {
  if (medicines.length < 2) return [{ severity:'unknown', title:'Interaction check incomplete', detail:'Add all medicines, including over-the-counter products and supplements, then have a pharmacist or clinician review them.' }];
  return [{ severity:'unknown', title:'No validated interaction source connected', detail:'This starter does not contain a clinical interaction database. It cannot confirm that this combination is safe or identify all interactions. Ask a pharmacist or prescribing clinician to review the complete list.' }];
}

export function doseReview(medicine: Medicine): Finding[] {
  const findings: Finding[] = [];
  if (!medicine.name.trim()) findings.push({severity:'unknown',title:'Medicine name missing',detail:'Enter the exact medicine name as printed on the prescription.'});
  if (!medicine.strength.trim() || !medicine.dose.trim() || medicine.unit === 'unknown') findings.push({severity:'unknown',title:'Dose details need verification',detail:'Confirm strength, dose and unit against the original prescription. Do not guess.'});
  if (medicine.needsReview) findings.push({severity:'unknown',title:'Manual verification required',detail:'This entry has not been confirmed against the original prescription.'});
  return findings;
}
