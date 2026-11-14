import { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import { emptyPatient, type Medicine, type Patient, type Finding } from '../services/types';
import { checkInteractions, doseReview } from '../services/interactions';
import { exportSafetyReport } from '../services/report';

const input = (label: string, value: string, onChange: (v: string) => void, placeholder = '') =>
  <View style={{ gap: 5 }}><Text style={s.label}>{label}</Text><TextInput value={value} onChangeText={onChange} placeholder={placeholder} style={s.input} /></View>;

function Choice({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return <View style={s.choiceRow}><Text style={s.label}>{label}</Text><View style={s.choiceGroup}>
    <Pressable onPress={() => onChange(true)} style={[s.choice, value && s.choiceActive]}><Text style={[s.choiceText, value && s.choiceTextActive]}>Yes</Text></Pressable>
    <Pressable onPress={() => onChange(false)} style={[s.choice, !value && s.choiceActive]}><Text style={[s.choiceText, !value && s.choiceTextActive]}>No</Text></Pressable>
  </View></View>;
}

export default function Manual() {
  const params = useLocalSearchParams<{ ocrText?: string }>();
  const ocrText = typeof params.ocrText === 'string' ? params.ocrText : '';
  const [patient, setPatient] = useState<Patient>(emptyPatient);
  const [meds, setMeds] = useState<Medicine[]>([]);
  const [draft, setDraft] = useState({ name: '', strength: '', dose: '', unit: 'mg' as Medicine['unit'], frequency: '', duration: '', instructions: '' });
  const [findings, setFindings] = useState<Finding[] | null>(null);
  const [exporting, setExporting] = useState(false);
  const p = (key: 'name' | 'age' | 'weightKg' | 'gender' | 'allergies', value: string) => setPatient(old => ({ ...old, [key]: value }));
  const toggle = (key: 'pregnant' | 'kidneyDisease' | 'liverDisease', value: boolean) => setPatient(old => ({ ...old, [key]: value }));

  function add() {
    if (!draft.name.trim()) { Alert.alert('Medicine name required', 'Enter the medicine name exactly as printed on the prescription.'); return; }
    setMeds(old => [...old, { ...draft, id: `${Date.now()}-${old.length}`, needsReview: true }]);
    setDraft({ name: '', strength: '', dose: '', unit: 'mg', frequency: '', duration: '', instructions: '' });
    setFindings(null);
  }

  function analyze() {
    const next = [...meds.flatMap(doseReview), ...checkInteractions(meds)];
    setFindings(next);
    Alert.alert('Review summary', `${meds.length} medicine(s) entered. ${next.length} review item(s) remain. No “safe” conclusion can be made by this prototype.`);
  }

  async function exportReport() {
    if (!findings) { Alert.alert('Review first', 'Tap Review entries before exporting the report.'); return; }
    setExporting(true);
    try { await exportSafetyReport(patient, meds, findings); }
    catch { Alert.alert('Export failed', 'The PDF could not be created on this device. Please try again.'); }
    finally { setExporting(false); }
  }

  const reviewLabel = useMemo(() => findings ? `${findings.length} item(s) require human review` : 'Not reviewed yet', [findings]);

  return (
    <ScrollView contentContainerStyle={s.page}>
      <Link href="/" style={s.back}>‹ Home</Link>
      <Text style={s.title}>Manual verification</Text>
      <Text style={s.caption}>Enter medicine details exactly as prescribed. OCR suggestions are not copied into medicine fields automatically.</Text>
      {ocrText ? <View style={s.ocrCard}>
        <Text style={s.section}>RAW OCR TEXT — CHECK AGAINST IMAGE</Text>
        <Text style={s.ocrText}>{ocrText}</Text>
        <Text style={s.caption}>Use this only as a reading aid. Confirm each character, especially similar medicine names, strength, decimal points and units.</Text>
      </View> : null}
      <Text style={s.section}>PATIENT DETAILS</Text>
      {input('Name', patient.name, v => p('name', v))}
      {input('Age', patient.age, v => p('age', v), 'Years')}
      {input('Weight', patient.weightKg, v => p('weightKg', v), 'kg')}
      {input('Gender', patient.gender, v => p('gender', v))}
      {input('Known allergies', patient.allergies, v => p('allergies', v), 'List allergies or write “unknown”')}
      <Choice label="Pregnant?" value={patient.pregnant} onChange={v => toggle('pregnant', v)} />
      <Choice label="Known kidney disease?" value={patient.kidneyDisease} onChange={v => toggle('kidneyDisease', v)} />
      <Choice label="Known liver disease?" value={patient.liverDisease} onChange={v => toggle('liverDisease', v)} />
      <Text style={s.section}>MEDICINES</Text>
      {input('Medicine name', draft.name, v => setDraft(old => ({ ...old, name: v })))}
      {input('Strength (as printed)', draft.strength, v => setDraft(old => ({ ...old, strength: v })), 'e.g. 500 mg per tablet')}
      {input('Prescribed dose', draft.dose, v => setDraft(old => ({ ...old, dose: v })), 'Do not guess')}
      {input('Unit (mg, mcg, g, mL)', draft.unit, v => setDraft(old => ({ ...old, unit: (['mg', 'mcg', 'g', 'mL'].includes(v) ? v : 'unknown') as Medicine['unit'] })))}
      {input('Frequency', draft.frequency, v => setDraft(old => ({ ...old, frequency: v })), 'As written on prescription')}
      {input('Duration', draft.duration, v => setDraft(old => ({ ...old, duration: v })), 'As written on prescription')}
      {input('Instructions / before or after food', draft.instructions, v => setDraft(old => ({ ...old, instructions: v })), 'Copy exact instructions')}
      <Pressable style={s.outline} onPress={add}><Text style={s.outlineText}>+ Add medicine</Text></Pressable>
      {meds.map(m => <View style={s.med} key={m.id}>
        <Text style={s.medTitle}>{m.name}</Text>
        <Text style={s.caption}>{m.strength} • {m.dose} {m.unit} • {m.frequency} • {m.duration}</Text>
        {!!m.instructions && <Text style={s.caption}>{m.instructions}</Text>}
        <Text style={s.flag}>Unverified — check original prescription</Text>
      </View>)}
      <Pressable style={s.button} onPress={analyze}><Text style={s.buttonText}>Review entries</Text></Pressable>
      <Text style={s.reviewStatus}>{reviewLabel}</Text>
      {findings?.map((finding, index) => <View style={s.finding} key={`${finding.title}-${index}`}>
        <Text style={s.findingTitle}>{finding.severity.toUpperCase()} · {finding.title}</Text>
        <Text style={s.caption}>{finding.detail}</Text>
      </View>)}
      <Pressable disabled={exporting} style={s.outline} onPress={exportReport}><Text style={s.outlineText}>{exporting ? 'Creating PDF…' : 'Export review report (PDF)'}</Text></Pressable>
      <Text style={s.foot}>No medicine swaps or dosing recommendations are generated. The interaction database is not connected; missing warnings do not mean a combination is safe. Have a pharmacist or prescriber review the complete list.</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { padding: 22, paddingTop: 48, gap: 13 },
  back: { color: '#0E6E63', fontWeight: '700' },
  title: { fontSize: 30, fontWeight: '800', color: '#172B28' },
  caption: { fontSize: 13, color: '#6C7973', lineHeight: 19 },
  section: { fontSize: 11, fontWeight: '800', letterSpacing: 1.4, color: '#0E6E63', marginTop: 12 },
  label: { fontSize: 13, fontWeight: '700', color: '#344640' },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E7E1', borderRadius: 9, padding: 13, fontSize: 15 },
  ocrCard: { backgroundColor: '#FFF', padding: 14, borderRadius: 9, gap: 8, borderWidth: 1, borderColor: '#E0E7E1' },
  ocrText: { color: '#344640', lineHeight: 21, fontSize: 13 },
  choiceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 5 },
  choiceGroup: { flexDirection: 'row', gap: 6 },
  choice: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8, borderWidth: 1, borderColor: '#DCE4DE' },
  choiceActive: { backgroundColor: '#0E6E63', borderColor: '#0E6E63' },
  choiceText: { color: '#52635C', fontWeight: '700' },
  choiceTextActive: { color: '#FFF' },
  outline: { borderWidth: 1, borderColor: '#0E6E63', padding: 14, borderRadius: 9, alignItems: 'center' },
  outlineText: { color: '#0E6E63', fontWeight: '800' },
  med: { padding: 14, backgroundColor: '#FFF', borderRadius: 9, gap: 4 },
  medTitle: { fontWeight: '800', fontSize: 16, color: '#1D332F' },
  flag: { fontSize: 12, color: '#9A5E12', fontWeight: '700' },
  button: { backgroundColor: '#0E6E63', padding: 16, borderRadius: 9, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#FFF', fontWeight: '800' },
  reviewStatus: { fontWeight: '800', color: '#344640' },
  finding: { padding: 13, backgroundColor: '#FFF4DE', borderRadius: 9, gap: 5 },
  findingTitle: { fontWeight: '800', color: '#754B12', fontSize: 12 },
  foot: { fontSize: 12, color: '#829089', lineHeight: 18 },
});
