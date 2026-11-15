import type { Finding, Medicine, Patient } from './types';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const esc = (value: string) => value.replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]!));

export async function exportSafetyReport(patient: Patient, medicines: Medicine[], findings: Finding[]) {
  const rows = medicines.map(m => `<tr><td>${esc(m.name)}</td><td>${esc(m.strength)}</td><td>${esc(m.dose)} ${esc(m.unit)}</td><td>${esc(m.frequency)}</td><td>${esc(m.duration)}</td><td>${esc(m.instructions || 'Not provided')}</td><td>Unverified</td></tr>`).join('');
  const alerts = findings.map(f => `<li><strong>${esc(f.severity.toUpperCase())}: ${esc(f.title)}</strong><p>${esc(f.detail)}</p></li>`).join('');
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    body{font:14px Arial,sans-serif;padding:28px;color:#18332e}h1{color:#0e6e63}
    table{width:100%;border-collapse:collapse;font-size:12px}th,td{padding:7px;border:1px solid #ddd;text-align:left;vertical-align:top}
    .warning{background:#fff4de;padding:14px;margin:18px 0;line-height:1.5}
  </style></head><body>
    <h1>Rx/Check — Prescription Review Report</h1>
    <p>Generated for human review. This is not a prescription, diagnosis, or clinical clearance.</p>
    <h2>Patient details</h2>
    <p>Name: ${esc(patient.name || 'Not provided')} | Age: ${esc(patient.age || 'Not provided')} | Gender: ${esc(patient.gender || 'Not provided')} | Weight: ${esc(patient.weightKg || 'Not provided')}</p>
    <p>Allergies: ${esc(patient.allergies || 'Not provided')} | Pregnant: ${patient.pregnant ? 'Yes' : 'Not recorded'} | Kidney disease: ${patient.kidneyDisease ? 'Yes' : 'Not recorded'} | Liver disease: ${patient.liverDisease ? 'Yes' : 'Not recorded'}</p>
    <h2>Medicines (user-entered; not independently verified)</h2>
    <table><tr><th>Name</th><th>Strength</th><th>Dose</th><th>Frequency</th><th>Duration</th><th>Instructions</th><th>Status</th></tr>${rows}</table>
    <h2>Review findings</h2><ul>${alerts}</ul>
    <div class="warning"><strong>Important:</strong> Google ML Kit only recognises text; it does not validate medicine names or doses. This app does not have a validated clinical interaction database or dosing engine. Missing findings do not mean that a prescription or combination is safe. Do not start, stop, replace, or change any medicine based on this report. Consult a qualified clinician or pharmacist.</div>
  </body></html>`;
  const file = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: 'Share Rx/Check report' });
  }
  return file.uri;
}
