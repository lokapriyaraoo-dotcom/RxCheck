import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

type LabelEvidence = { medicine: string; status: string; interactions: string[]; warnings: string[]; sourceUrl: string };
type FinalReportData = {
  medicines: string[];
  interactionFindings: { severity: string; title: string; detail: string; source?: string }[];
  labelEvidence: LabelEvidence[];
  foodStatus: string;
  patientContext: string;
};
const esc = (value: string) => value.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
const para = (value: string) => value.trim() ? esc(value).replace(/\r?\n/g, '<br>') : 'Not recorded';

export async function exportFinalReport(data: FinalReportData) {
  const medicineRows = data.medicines.map((medicine, i) => `<tr><td>${i + 1}</td><td>${esc(medicine)}</td></tr>`).join('');
  const interactionRows = data.interactionFindings.map(item => `<tr><td>${esc(item.severity.toUpperCase())}</td><td>${esc(item.title)}</td><td>${esc(item.detail)}</td><td>${esc(item.source || 'RxCheck local interaction database')}</td></tr>`).join('');
  const labelSections = data.labelEvidence.map(item => {
    const details = [...item.interactions.map(x => 'Drug interaction label information: ' + x), ...item.warnings.map(x => 'Label warning / contraindication: ' + x)];
    return `<h3>${esc(item.medicine)} — ${esc(item.status.toUpperCase())}</h3><ul>${(details.length ? details : ['No verified individual label finding available.']).map(x => `<li>${esc(x)}</li>`).join('')}</ul><p>Source: ${esc(item.sourceUrl)}</p>`;
  }).join('');
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    body{font:12px Arial,sans-serif;padding:28px;color:#18332e;line-height:1.5}h1,h2{color:#0e6e63}h1{font-size:24px}h2{font-size:16px;border-bottom:1px solid #dce7df;padding-bottom:5px;margin-top:22px}h3{font-size:13px;margin-bottom:4px}
    table{width:100%;border-collapse:collapse;font-size:11px}th,td{padding:7px;border:1px solid #d9e2dc;text-align:left;vertical-align:top}.notice{background:#fff4de;padding:12px;margin:16px 0}
  </style></head><body>
    <h1>RxCheck — Final Drug Safety Report</h1><p>Generated ${esc(new Date().toLocaleString())}. Drug-information summary for professional review.</p>
    <div class="notice"><b>Overall status: PHARMACIST REVIEW REQUIRED.</b> Unknown or unassessed results are not evidence of safety.</div>
    <h2>Medicines Reviewed</h2><table><tr><th>#</th><th>Medicine entered</th></tr>${medicineRows || '<tr><td colspan="2">No medicines entered</td></tr>'}</table>
    <h2>Individual FDA Drug Information</h2>${labelSections || '<p>No FDA label results were passed into this report.</p>'}
    <h2>Drug–Drug Interaction Findings</h2><p>Unknown means no verified conclusion is available; it does not mean safe.</p><table><tr><th>Severity / status</th><th>Finding</th><th>Details</th><th>Evidence source</th></tr>${interactionRows || '<tr><td colspan="4">No pair findings returned; this is not proof of safety.</td></tr>'}</table>
    <h2>Food–Drug Interaction Check</h2><p>Status: ${esc(data.foodStatus.toUpperCase())}. A verified food-interaction dataset and exposure inputs are not currently connected.</p>
    <h2>Relevant Clinical Context</h2><p>${para(data.patientContext)}</p>
    <div class="notice"><b>Safety conclusion:</b> RxCheck reports only information returned by available sources. Unknown, unmatched or unavailable results must not be interpreted as safe. Do not start, stop, change or substitute medicines based on this report. Ask a qualified pharmacist or prescriber to review the complete regimen.</div>
  </body></html>`;
  const file = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: 'Share RxCheck Final Drug Safety Report' });
  return file.uri;
}
