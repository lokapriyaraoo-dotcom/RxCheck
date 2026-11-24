import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

type FinalReportData = {
  patientName: string; age: string; diagnosis: string; allergies: string;
  medicines: string[]; prescribed: string[]; substitutionNotes: string;
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
    return `<tr><td>${esc(medicine)}</td><td><a href="https://www.1mg.com/search/all?name=${q}">Tata 1mg</a></td><td><a href="https://pharmeasy.in/search/all?name=${q}">PharmEasy</a></td></tr>`;
  }).join('');
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    body{font:12px Arial,sans-serif;padding:28px;color:#18332e;line-height:1.5}h1,h2{color:#0e6e63}h1{font-size:24px}h2{font-size:16px;border-bottom:1px solid #dce7df;padding-bottom:5px;margin-top:22px}
    table{width:100%;border-collapse:collapse;font-size:11px}th,td{padding:7px;border:1px solid #d9e2dc;text-align:left;vertical-align:top}.notice{background:#fff4de;padding:12px;margin:16px 0}a{color:#087e72;word-break:break-all}
  </style></head><body>
    <h1>RxCheck — Short Medicine Report</h1>
    <p>Generated ${new Date().toLocaleString()}. For information and professional review only.</p>
    <h2>Prescription Summary</h2>
    <p><b>Patient:</b> ${para(data.patientName)} &nbsp; <b>Age:</b> ${para(data.age)}</p>
    <p><b>Indication:</b> ${para(data.diagnosis)}</p><p><b>Allergies / context:</b> ${para(data.allergies)}</p>
    <table><tr><th>#</th><th>Medicine entered</th><th>Verification</th></tr>${medicineRows || '<tr><td colspan="3">No medicines entered</td></tr>'}</table>
    <h2>Pharmacy & Substitution Notes</h2>
    <table><tr><th>Medicine</th><th>Search</th><th>Search</th></tr>${pharmacyRows || '<tr><td colspan="3">No prescribed medicines supplied</td></tr>'}</table>
    <p><b>Substitution notes:</b> ${para(data.substitutionNotes)}</p>
    <div class="notice"><b>Important:</b> RxCheck cannot confirm that a medicine combination is safe. Verify medicine names, strengths, doses, allergies and interactions with a qualified pharmacist or prescriber. Search links do not verify products. Do not start, stop, change or substitute medicines based on this report.</div>
  </body></html>`;
  const file = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: 'Share RxCheck Short Report' });
  return file.uri;
}
