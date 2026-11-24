import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

export type ChecklistFinding = { title: string; status: string; detail: string };

export function buildPharmacistChecklist(findings: ChecklistFinding[], medicines: string[]) {
  const lines = [
    'RxCheck — Pharmacist Review Checklist',
    'For professional verification only. Not a diagnosis or safety clearance.',
    '',
    'Medicines to verify:',
    ...(medicines.length ? medicines.map((name, index) => `${index + 1}. ${name}`) : ['No medicines entered']),
    '',
    'Findings requiring review:',
    ...findings.flatMap(item => [`[ ] ${item.title} — ${item.status}`, item.detail]),
    '',
    'Please verify active ingredients, strengths, dosage forms, doses, allergies, duplicate therapy, interactions, pregnancy status, kidney/liver considerations and food/supplement effects using current professional references.',
    'Do not change or stop medicines without the prescriber or pharmacist.'
  ];
  return lines.join('\n');
}

export async function sharePharmacistChecklist(text: string) {
  const base = FileSystem.cacheDirectory;
  if (!base) throw new Error('Temporary file storage is unavailable.');
  const uri = base + 'rxcheck-pharmacist-checklist.txt';
  await FileSystem.writeAsStringAsync(uri, text, { encoding: FileSystem.EncodingType.UTF8 });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'text/plain', dialogTitle: 'Share pharmacist review checklist' });
  }
  return uri;
}
