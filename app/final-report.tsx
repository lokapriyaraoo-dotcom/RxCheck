import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import { Brand } from '../components/Brand';
import { exportFinalReport } from '../services/report';

const checklistItems = [
  'Medicines, strengths and dosage forms checked against the original prescription',
  'Patient factors, allergies and current medicines reviewed',
  'Pairwise interactions reviewed using an appropriate clinical reference',
  'Pharmacokinetic pathways (absorption, distribution, metabolism and excretion) considered',
  'Monitoring and dose-adjustment plan documented by the professional',
  'Generic substitution checked for ingredient, strength, formulation and bioequivalence',
  'Counselling points prepared and sources verified',
  'Final clinical decision recorded by the responsible professional',
];

function parse(value?: string): string[] {
  try { const data = JSON.parse(value || '[]'); return Array.isArray(data) ? data.filter((x): x is string => typeof x === 'string') : []; }
  catch { return []; }
}

export default function FinalReport() {
  const params = useLocalSearchParams<{ meds?: string; prescribed?: string }>();
  const medicines = useMemo(() => [...new Set(parse(params.meds))], [params.meds]);
  const prescribed = useMemo(() => [...new Set(parse(params.prescribed))], [params.prescribed]);
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [allergies, setAllergies] = useState('');
  const [pkNotes, setPkNotes] = useState('');
  const [substitutionNotes, setSubstitutionNotes] = useState('');
  const [interactionNotes, setInteractionNotes] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [professional, setProfessional] = useState('');
  const [signatureDate, setSignatureDate] = useState('');
  const [checked, setChecked] = useState<boolean[]>(checklistItems.map(() => false));
  const [busy, setBusy] = useState(false);

  const toggle = (index: number) => setChecked(old => old.map((value, i) => i === index ? !value : value));
  async function makePdf() {
    setBusy(true);
    try {
      await exportFinalReport({
        patientName, age, diagnosis, allergies, medicines, prescribed,
        interactionNotes, pkNotes, substitutionNotes, recommendations,
        checklist: checklistItems.map((label, i) => ({ label, checked: checked[i] })),
        professional, signatureDate,
      });
    } catch {
      Alert.alert('PDF export unavailable', 'RxCheck could not create the PDF. Please try again.');
    } finally { setBusy(false); }
  }

  return <ScrollView contentContainerStyle={s.page}>
    <Link href="/interactions" style={s.back}>‹ Back to interaction review</Link>
    <Brand size={38} />
    <Text style={s.title}>Final Report</Text>
    <Text style={s.copy}>One consolidated, printable review document. Fields are user-entered and require professional verification. RxCheck does not independently determine clinical safety.</Text>

    <View style={s.card}>
      <Text style={s.section}>1 · PRESCRIPTION SUMMARY</Text>
      <Text style={s.label}>Patient name (optional)</Text><TextInput value={patientName} onChangeText={setPatientName} style={s.input} placeholder="Not provided" />
      <Text style={s.label}>Age</Text><TextInput value={age} onChangeText={setAge} style={s.input} placeholder="Not provided" keyboardType="numeric" />
      <Text style={s.label}>Indication / diagnosis</Text><TextInput value={diagnosis} onChangeText={setDiagnosis} style={s.input} placeholder="As written on prescription" />
      <Text style={s.label}>Allergies / relevant patient context</Text><TextInput value={allergies} onChangeText={setAllergies} style={s.input} placeholder="Unknown unless verified" multiline />
      <Text style={s.subheading}>Medicines entered ({medicines.length})</Text>
      {medicines.length ? medicines.map((medicine, i) => <Text key={i} style={s.item}>• {medicine}</Text>) : <Text style={s.copy}>No medicines were passed into this report.</Text>}
      <Text style={s.copy}>Medicine names and details are unverified until compared with the original prescription. Dose, frequency and dosage form may be incomplete.</Text>
    </View>

    <View style={s.card}>
      <Text style={s.section}>2 · INTERACTION & SAFETY ANALYSIS</Text>
      <Text style={s.notice}>PAIRWISE INTERACTIONS: NOT CHECKED BY A VALIDATED RXCHECK ENGINE. A missing finding is not evidence of safety.</Text>
      <Text style={s.label}>Interaction findings / severity / mechanism / clinical significance</Text>
      <TextInput value={interactionNotes} onChangeText={setInteractionNotes} style={[s.input,s.multiline]} multiline placeholder="Record findings only after checking a validated professional reference. Include severity, mechanism, clinical consequence and management." />
      <Text style={s.label}>Pharmacokinetic exploration (ADME)</Text>
      <Text style={s.copy}>Review absorption (pH, chelation, food and gut transporters), distribution (protein binding and tissue transport), metabolism (CYP enzymes and phase-II pathways), and excretion (renal transporters and clearance). Record expected exposure changes and evidence.</Text>
      <TextInput value={pkNotes} onChangeText={setPkNotes} style={[s.input,s.multiline]} multiline placeholder="Record the medicine pair, pathway (e.g. CYP3A4/P-gp), direction of effect, evidence, clinical relevance and monitoring/TDM. Leave blank if not assessed." />
      <Text style={s.label}>Individual medicine safety / contraindications / high-risk groups</Text>
      <Text style={s.copy}>Add only verified label or professional-reference findings. Unknown or unavailable results must remain marked unknown.</Text>
    </View>

    <View style={s.card}>
      <Text style={s.section}>3 · PROFESSIONAL REVIEW CHECKLIST</Text>
      {checklistItems.map((label, i) => <Pressable key={label} style={s.checkRow} onPress={() => toggle(i)}>
        <View style={[s.checkbox, checked[i] && s.checkboxOn]}>{checked[i] ? <Text style={s.checkMark}>✓</Text> : null}</View>
        <Text style={s.checkText}>{label}</Text>
      </Pressable>)}
      <Text style={s.copy}>Tick only after the relevant review has actually been completed. This checklist is not an automated clearance.</Text>
    </View>

    <View style={s.card}>
      <Text style={s.section}>4 · VERIFIED PRODUCT, PHARMACY & SUBSTITUTION</Text>
      <Text style={s.copy}>Search links are provided for professional checking. A search result is not confirmation of product identity, stock, manufacturer, approval or suitability.</Text>
      {prescribed.map((medicine, i) => <View key={i} style={s.productRow}>
        <Text style={s.item}>{medicine}</Text>
        <Text style={s.copy}>Tata 1mg: https://www.1mg.com/search/all?name={encodeURIComponent(medicine)}</Text>
        <Text style={s.copy}>PharmEasy: https://pharmeasy.in/search/all?name={encodeURIComponent(medicine)}</Text>
      </View>)}
      <Text style={s.label}>Generic substitution investigation</Text>
      <Text style={s.copy}>Check same active ingredient, strength, dosage form, route, release characteristics, manufacturer and applicable bioequivalence / regulatory evidence. Extra caution is required for narrow-therapeutic-index medicines, modified-release products, devices and complex formulations. RxCheck does not approve substitutions.</Text>
      <TextInput value={substitutionNotes} onChangeText={setSubstitutionNotes} style={[s.input,s.multiline]} multiline placeholder="Record candidate generic/brand, ingredient, strength, form, manufacturer, regulatory/bioequivalence evidence, cautions and professional decision." />
      <Text style={s.copy}>Drugs.com interaction reference: https://www.drugs.com/drug_interactions.html — opens as an external reference; RxCheck has not queried or imported its results.</Text>
    </View>

    <View style={s.card}>
      <Text style={s.section}>5 · FINAL RECOMMENDATIONS & SIGN-OFF</Text>
      <Text style={s.label}>Priority actions, monitoring and counselling</Text>
      <TextInput value={recommendations} onChangeText={setRecommendations} style={[s.input,s.multiline]} multiline placeholder="Document actions, monitoring parameters, counselling and follow-up after professional review." />
      <Text style={s.label}>Doctor / pharmacist name and designation</Text><TextInput value={professional} onChangeText={setProfessional} style={s.input} placeholder="Professional reviewer" />
      <Text style={s.label}>Date / signature / stamp reference</Text><TextInput value={signatureDate} onChangeText={setSignatureDate} style={s.input} placeholder="Date and sign-off details" />
    </View>

    <View style={s.warning}><Text style={s.warningTitle}>Clinical safety notice</Text><Text style={s.copy}>This report is an organisational aid, not a validated clinical decision-support system. RxCheck does not confirm that a regimen is safe, does not calculate doses and does not recommend stopping or switching medicines. A qualified prescriber or pharmacist must independently verify all findings and decisions.</Text></View>
    <Pressable disabled={busy} onPress={makePdf} style={s.button}><Text style={s.buttonText}>{busy ? 'Creating PDF…' : 'Export complete Final Report as PDF'}</Text></Pressable>
  </ScrollView>;
}

const s = StyleSheet.create({
  page:{padding:22,paddingTop:48,gap:14,backgroundColor:'#F4F7F3'}, back:{color:'#0E6E63',fontWeight:'800'},
  title:{fontSize:29,fontWeight:'900',color:'#172B28'}, copy:{fontSize:13,color:'#62716B',lineHeight:20},
  card:{backgroundColor:'#FFF',borderRadius:12,padding:15,gap:9,borderWidth:1,borderColor:'#E0E7E1'},
  section:{fontSize:12,fontWeight:'900',letterSpacing:1,color:'#0E6E63'}, subheading:{fontSize:14,fontWeight:'800',color:'#203A34',marginTop:4},
  label:{fontSize:12,fontWeight:'800',color:'#344640',marginTop:4}, input:{backgroundColor:'#F8FAF8',borderWidth:1,borderColor:'#DDE5DF',borderRadius:8,padding:11,fontSize:14,color:'#203A34'},
  multiline:{minHeight:92,textAlignVertical:'top'}, item:{fontSize:14,fontWeight:'700',color:'#263C36',lineHeight:20},
  notice:{backgroundColor:'#FFF4DE',padding:10,borderRadius:8,color:'#754B12',fontSize:12,fontWeight:'900'},
  checkRow:{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:6}, checkbox:{width:22,height:22,borderWidth:1.5,borderColor:'#0E6E63',borderRadius:5,alignItems:'center',justifyContent:'center'},
  checkboxOn:{backgroundColor:'#0E6E63'},checkMark:{color:'#FFF',fontWeight:'900'},checkText:{flex:1,fontSize:13,color:'#344640',lineHeight:19},
  productRow:{borderTopWidth:1,borderTopColor:'#E6ECE7',paddingTop:8,gap:4},warning:{backgroundColor:'#FFF2DC',padding:15,borderRadius:10,gap:6},
  warningTitle:{fontWeight:'900',color:'#754B12'},button:{backgroundColor:'#0E6E63',padding:16,borderRadius:10,alignItems:'center',marginBottom:30},
  buttonText:{color:'#FFF',fontWeight:'900'},
});
