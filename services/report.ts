import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

type ChecklistItem = { label: string; checked: boolean };
type FinalReportData = {
  patientName: string; age: string; diagnosis: string; allergies: string;
  medicines: string[]; prescribed: string[]; interactionNotes: string;
  pkNotes: string; substitutionNotes: string; recommendations: string;
  checklist: ChecklistItem[]; professional: string; signatureDate: string;
};
const esc = (value: string) => value.replace(/[&<>"']/g, char => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;',
}[char]!));
const para = (value: string) => value.trim() ? esc(value).replace(/\r?\n/g, '<br>') : 'Not recorded';

export async function exportFinalReport(data: FinalReportData) {
  const medicineRows = data.medicines.map((medicine, i) =>
    `<tr><td>${i + 1}</td><td>${esc(medicine)}</td><td>Unverified</td></tr>`).join('');
  const pharmacyRows = data.prescribed.map(medicine => {
    const q = encodeURIComponent(medicine);
    return `<tr><td>${esc(medicine)}</td><td><a href="https://www.1mg.com/search/all?name=${q}">Tata 1mg search</a></td><td><a href="https://pharmeasy.in/search/all?name=${q}">PharmEasy search</a></td><td>Search link only — product not verified</td></tr>`;
  }).join('');
  const checks = data.checklist.map(item =>
    `<li>${item.checked ? '&#9745;' : '&#9744;'} ${esc(item.label)}</li>`).join('');
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    body{font:12px Arial,sans-serif;padding:28px;color:#18332e;line-height:1.5}h1,h2{color:#0e6e63}h1{font-size:24px}
    h2{font-size:16px;border-bottom:1px solid #dce7df;padding-bottom:5px;margin-top:22px}
    table{width:100%;border-collapse:collapse;font-size:11px}th,td{padding:7px;border:1px solid #d9e2dc;text-align:left;vertical-align:top}
    .notice{background:#fff4de;padding:12px;margin:16px 0}.section{white-space:pre-wrap}.muted{color:#66756e}
    a{color:#087e72;word-break:break-all}li{margin:5px 0}
  </style></head><body>
    <h1>RxCheck — Final Report</h1>
    <p class="muted">Generated ${new Date().toLocaleString()}. Prepared for human professional review; not a diagnosis, prescription or clinical clearance.</p>
    <h2>1. Prescription Summary</h2>
    <p><b>Patient:</b> ${para(data.patientName)} &nbsp; <b>Age:</b> ${para(data.age)}</p>
    <p><b>Indication / diagnosis:</b> ${para(data.diagnosis)}</p><p><b>Allergies / context:</b> ${para(data.allergies)}</p>
    <table><tr><th>#</th><th>Medicine (as entered)</th><th>Verification</th></tr>${medicineRows || '<tr><td colspan="3">No medicines entered</td></tr>'}</table>
    <h2>2. Interaction & Safety Analysis</h2>
    <p><b>Pairwise interaction coverage:</b> NOT CHECKED by a validated RxCheck interaction engine. Do not interpret missing findings as safe.</p>
    <p><b>Interaction findings / clinical significance:</b><div class="section">${para(data.interactionNotes)}</div></p>
    <p><b>Pharmacokinetic ADME exploration:</b><div class="section">${para(data.pkNotes)}</div></p>
    <p><b>Individual safety highlights:</b> Verify warnings, contraindications, high-risk groups, dose and monitoring against current official product information and patient factors.</p>
    <h2>3. Professional Review Checklist</h2><ul>${checks}</ul>
    <h2>4. Verified Product & Pharmacy / Substitution Review</h2>
    <table><tr><th>Medicine</th><th>Pharmacy search</th><th>Pharmacy search</th><th>Verification status</th></tr>${pharmacyRows || '<tr><td colspan="4">No prescribed medicines supplied</td></tr>'}</table>
    <p><b>Generic substitution investigation:</b><div class="section">${para(data.substitutionNotes)}</div></p>
    <p class="muted">Search links are not verified product pages. Confirm active ingredient, strength, dosage form, route, release type, manufacturer, regulatory status, bioequivalence and availability before any substitution. Special caution may be needed for narrow-therapeutic-index medicines.</p>
    <p><b>Drugs.com interaction reference:</b> <a href="https://www.drugs.com/drug_interactions.html">Open Drugs.com interaction checker</a>. RxCheck has not queried or imported its results.</p>
    <h2>5. Final Recommendations & Sign-off</h2>
    <p><b>Priority actions / monitoring / counselling:</b><div class="section">${para(data.recommendations)}</div></p>
    <p><b>Professional reviewer:</b> ${para(data.professional)}</p><p><b>Date / signature / stamp:</b> ${para(data.signatureDate)}</p>
    <div class="notice"><b>Clinical safety notice:</b> RxCheck is a prescription-organisation prototype, not a validated clinical decision-support system. OCR and user-entered fields may be wrong or incomplete. No validated pairwise interaction engine is connected. This report cannot establish that a medicine combination is safe or approve a generic substitution. A qualified prescriber or pharmacist must independently verify the full regimen and make all clinical decisions. Do not start, stop, change or replace medicines based on this report.</div>
  </body></html>`;
  const file = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: 'Share RxCheck Final Report' });
  }
  return file.uri;
}
