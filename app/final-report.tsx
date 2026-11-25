import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import { Brand } from '../components/Brand';
import { exportFinalReport } from '../services/report';
import type { Finding } from '../services/types';

type LabelEvidence = { medicine: string; status: 'matched'|'not-found'|'unavailable'; interactions: string[]; warnings: string[]; sourceUrl: string };
function parse<T>(value?: string, fallback: T[] = []): T[] { try { const data=JSON.parse(value||'[]'); return Array.isArray(data)?data as T[]:fallback; } catch { return fallback; } }
function parseFindings(value?: string): Finding[] { return parse< Finding >(value).filter((x): x is Finding => !!x && typeof x.title==='string' && typeof x.detail==='string'); }
function parseLabels(value?: string): LabelEvidence[] { return parse<LabelEvidence>(value).filter(x=>!!x&&typeof x.medicine==='string'&&['matched','not-found','unavailable'].includes(x.status)); }

export default function FinalReport() {
 const params=useLocalSearchParams<{meds?:string;findings?:string;labelEvidence?:string;foodStatus?:string}>();
 const medicines=useMemo(()=>[...new Set(parse<string>(params.meds).filter(x=>typeof x==='string'))],[params.meds]);
 const findings=useMemo(()=>parseFindings(params.findings),[params.findings]);
 const labels=useMemo(()=>parseLabels(params.labelEvidence),[params.labelEvidence]);
 const [patientContext,setPatientContext]=useState('');
 const [busy,setBusy]=useState(false);
 const unknown=findings.filter(x=>x.severity==='unknown').length;
 const high=findings.filter(x=>x.severity==='high').length;
 const moderate=findings.filter(x=>x.severity==='moderate').length;
 const status=unknown>0?'UNKNOWN — PHARMACIST REVIEW REQUIRED':high>0?'HIGH-SEVERITY FINDING':moderate>0?'REVIEW REQUIRED':'NO VERIFIED PAIR FINDING';
 async function makePdf(){setBusy(true);try{await exportFinalReport({medicines,interactionFindings:findings,labelEvidence:labels,foodStatus:String(params.foodStatus||'not-assessed'),patientContext});}catch{Alert.alert('PDF export unavailable','RxCheck could not create the PDF. Please try again.');}finally{setBusy(false);}}
 return <View style={s.root}>
  <ScrollView contentContainerStyle={s.page}>
   <Link href="/interactions" style={s.back}>‹ Back to medicine findings</Link><Brand size={38}/>
   <Text style={s.title}>Final Drug Safety Report</Text>
   <View style={s.overall}><Text style={s.overallLabel}>OVERALL RESULT</Text><Text style={s.overallTitle}>{status}</Text><Text style={s.copy}>A missing record, unavailable lookup or unassessed category is not evidence of safety.</Text></View>
   <View style={s.card}><Text style={s.section}>MEDICINES REVIEWED ({medicines.length})</Text>
    {medicines.length?medicines.map((m,i)=><Text key={i} style={s.item}>• {m}</Text>):<Text style={s.copy}>No medicines were supplied.</Text>}
    <Text style={s.copy}>Medicine names and strengths must be checked against the original prescription or pack.</Text>
    <Text style={s.label}>Relevant clinical context (optional)</Text><TextInput value={patientContext} onChangeText={setPatientContext} style={[s.input,s.multiline]} placeholder="Record only verified allergies, diagnosis or relevant context." multiline/>
   </View>
   <View style={s.card}><Text style={s.section}>INDIVIDUAL FDA DRUG INFORMATION</Text>
    {!labels.length?<Text style={s.copy}>No FDA label results were passed into this report. Open the FDA medicine-label lookup to retrieve available records.</Text>:labels.map((item,i)=><View key={i} style={s.row}>
      <Text style={s.item}>{item.medicine}</Text>
      <Text style={s.label}>{item.status==='matched'?'FDA LABEL MATCHED':item.status==='not-found'?'NO MATCH — UNKNOWN':'LOOKUP UNAVAILABLE — UNKNOWN'}</Text>
      {item.status==='matched'?<>
       {item.interactions.length?item.interactions.map((v,j)=><Text key={'i'+j} style={s.copy}>Drug-interaction label information: {v}</Text>):<Text style={s.copy}>No Drug Interactions excerpt was returned in this label record; this does not rule out an interaction.</Text>}
       {item.warnings.map((v,j)=><Text key={'w'+j} style={s.copy}>Important label warning / contraindication: {v}</Text>)}
      </>:<Text style={s.copy}>No verified individual label conclusion is available for this medicine.</Text>}
      <Text style={s.source}>Source: {item.sourceUrl}</Text>
    </View>)}
    <Text style={s.copy}>FDA label excerpts describe individual medicines. They do not independently establish a drug-pair interaction or its severity.</Text>
   </View>
   <View style={s.card}><Text style={s.section}>DRUG–DRUG INTERACTION FINDINGS</Text>
    <Text style={s.copy}>{findings.length} finding(s) returned by the local interaction engine. Severity is displayed only when supported by a reviewed interaction record.</Text>
    {findings.length?findings.map((f,i)=><View key={i} style={s.row}><Text style={s.item}>{f.title}</Text><Text style={f.severity==='high'?s.critical:f.severity==='moderate'?s.review:s.label}>{f.severity==='high'?'MAJOR / HIGH':f.severity==='moderate'?'MODERATE':f.severity==='low'?'MINOR / INFORMATIONAL':'UNKNOWN — NOT CLEARED'}</Text><Text style={s.copy}>{f.detail}</Text><Text style={s.source}>Evidence: {f.source||'RxCheck local interaction database'}</Text></View>):<Text style={s.copy}>No pair findings were returned. This is not proof that the medicines are safe together.</Text>}
   </View>
   <View style={s.card}><Text style={s.section}>FOOD–DRUG INTERACTIONS</Text><Text style={s.copy}>Status: {String(params.foodStatus||'not-assessed').toUpperCase()}. A verified food-interaction dataset and relevant exposure information are not currently connected. Food interactions remain NOT ASSESSED.</Text></View>
   <View style={s.warning}><Text style={s.warningTitle}>SAFETY CONCLUSION</Text><Text style={s.copy}>RxCheck reports only information returned by its available sources. Unknown, unmatched or unavailable results must not be interpreted as safe. Do not start, stop, change or substitute medicines based on this report. A qualified pharmacist or prescriber should review the complete regimen.</Text></View>
  </ScrollView>
  <View style={s.sticky}><Pressable disabled={busy} onPress={makePdf} style={s.button}><Text style={s.buttonText}>{busy?'Creating PDF…':'Share / Export Final Report PDF'}</Text></Pressable></View>
 </View>;
}
const s=StyleSheet.create({root:{flex:1,backgroundColor:'#F4F7F3'},page:{padding:22,paddingTop:18,paddingBottom:110,gap:14},back:{color:'#0E6E63',fontWeight:'800'},title:{fontSize:27,fontWeight:'900',color:'#172B28'},copy:{fontSize:13,color:'#62716B',lineHeight:20},overall:{backgroundColor:'#FFF2DC',borderRadius:12,padding:14,gap:5},overallLabel:{fontSize:10,fontWeight:'900',letterSpacing:1,color:'#8A5A13'},overallTitle:{fontSize:17,fontWeight:'900',color:'#754B12'},card:{backgroundColor:'#FFF',borderRadius:12,padding:15,gap:9,borderWidth:1,borderColor:'#E0E7E1'},section:{fontSize:12,fontWeight:'900',letterSpacing:1,color:'#0E6E63'},item:{fontSize:14,fontWeight:'800',color:'#263C36',lineHeight:20},label:{fontSize:11,fontWeight:'900',color:'#344640'},source:{fontSize:11,color:'#77837D'},row:{borderTopWidth:1,borderTopColor:'#E6ECE7',paddingTop:9,gap:5},input:{backgroundColor:'#F8FAF8',borderWidth:1,borderColor:'#DDE5DF',borderRadius:8,padding:11,fontSize:14,color:'#203A34'},multiline:{minHeight:65,textAlignVertical:'top'},critical:{fontSize:12,fontWeight:'900',color:'#B42318'},review:{fontSize:12,fontWeight:'900',color:'#8A5A13'},warning:{backgroundColor:'#FFF2DC',padding:15,borderRadius:10,gap:6},warningTitle:{fontWeight:'900',color:'#754B12'},sticky:{position:'absolute',bottom:0,left:0,right:0,paddingHorizontal:22,paddingTop:10,paddingBottom:12,backgroundColor:'#F4F7F3',borderTopWidth:1,borderTopColor:'#DCE5DF'},button:{backgroundColor:'#0E6E63',padding:16,borderRadius:10,alignItems:'center'},buttonText:{color:'#FFF',fontWeight:'900'}});
