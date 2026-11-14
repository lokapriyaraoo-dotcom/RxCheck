import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Brand } from '../components/Brand';
import { emptyPatient, type Medicine, type Patient } from '../services/types';
import { extractPatientDetails, extractMedicineCandidates, readPrescriptionImage } from '../services/ocr';

const input=(label:string,value:string,onChange:(v:string)=>void,placeholder='')=><View style={{gap:5}}><Text style={s.label}>{label}</Text><TextInput value={value} onChangeText={onChange} placeholder={placeholder} style={s.input}/></View>;
export default function Manual(){
 const router=useRouter();const params=useLocalSearchParams<{ocrText?:string}>();
 const [ocrText,setOcrText]=useState(typeof params.ocrText==='string'?params.ocrText:'');
 const extracted=useMemo(()=>extractPatientDetails(ocrText),[ocrText]);
 const [patient,setPatient]=useState<Patient>(()=>({...emptyPatient,...extractPatientDetails(typeof params.ocrText==='string'?params.ocrText:'')}));
 const [meds,setMeds]=useState<Medicine[]>(()=>extractMedicineCandidates(typeof params.ocrText==='string'?params.ocrText:'').map((m,i)=>({id:'ocr-'+i,name:m.name||'',strength:m.strength||'',dose:'',unit:'unknown' as const,frequency:m.frequency||'',duration:'',instructions:'',needsReview:true})));
 const [draft,setDraft]=useState({name:'',strength:'',dose:'',unit:'unknown' as Medicine['unit'],frequency:'',duration:'',instructions:''});
 const [busy,setBusy]=useState(false);
 const p=(key:'name'|'age'|'weightKg'|'gender'|'allergies',value:string)=>setPatient(old=>({...old,[key]:value}));
 async function attachPrescription(){
  const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],quality:0.9});
  if(result.canceled||!result.assets.length)return;
  setBusy(true);try{const read=await readPrescriptionImage(result.assets[0].uri);setOcrText(old=>[old,read.text].filter(Boolean).join('\n'));setPatient(old=>({...old,...extractPatientDetails(read.text)}));const candidates=extractMedicineCandidates(read.text);if(candidates.length)setMeds(old=>[...old,...candidates.map((m,i)=>({id:'attached-'+Date.now()+'-'+i,name:m.name||'',strength:m.strength||'',dose:'',unit:'unknown' as const,frequency:m.frequency||'',duration:'',instructions:'',needsReview:true}))]);Alert.alert('Prescription attached','Text extracted. Check every patient and medicine field against the original image.');}catch(e){Alert.alert('Could not read prescription',e instanceof Error?e.message:'Please enter details manually.');}finally{setBusy(false);}
 }
 function add(){if(!draft.name.trim()){Alert.alert('Medicine name required','Enter the exact name printed on the prescription.');return;}setMeds(old=>[...old,{...draft,id:String(Date.now()),needsReview:true}]);setDraft({name:'',strength:'',dose:'',unit:'unknown',frequency:'',duration:'',instructions:''});}
 function next(){if(!meds.length){Alert.alert('Add medicines','Add at least one medicine before checking interactions.');return;}router.push({pathname:'/interactions',params:{meds:JSON.stringify(meds.map(m=>m.name))}});}
 return <ScrollView contentContainerStyle={s.page}><Link href="/" style={s.back}>‹ Home</Link><Brand size={38}/><Text style={s.title}>Patient & medicine details</Text><Text style={s.caption}>Detected details are prefilled only when the prescription clearly labels them. Confirm every value.</Text>
 <Pressable style={s.outline} onPress={attachPrescription} disabled={busy}><Text style={s.outlineText}>{busy?'Reading…':'＋ Attach prescription image & autofill'}</Text></Pressable>
 {ocrText?<View style={s.ocrCard}><Text style={s.section}>PRESCRIPTION OCR TEXT</Text><TextInput multiline value={ocrText} onChangeText={setOcrText} style={s.ocrText}/></View>:null}
 <Text style={s.section}>PATIENT DETAILS</Text>
 {input('Patient name',patient.name,v=>p('name',v))}{input('Age',patient.age,v=>p('age',v),'Years')}{input('Weight',patient.weightKg,v=>p('weightKg',v),'kg')}{input('Gender',patient.gender,v=>p('gender',v))}{input('Allergies',patient.allergies,v=>p('allergies',v),'Known allergies or unknown')}
 <Text style={s.section}>PRESCRIBED MEDICINES</Text>
 {input('Medicine prescribed or currently taking',draft.name,v=>setDraft(o=>({...o,name:v})))}{input('Strength',draft.strength,v=>setDraft(o=>({...o,strength:v})))}{input('Dose',draft.dose,v=>setDraft(o=>({...o,dose:v})))}{input('Unit (mg, mcg, g, mL)',draft.unit,v=>setDraft(o=>({...o,unit:(['mg','mcg','g','mL'].includes(v)?v:'unknown') as Medicine['unit']})))}{input('Frequency',draft.frequency,v=>setDraft(o=>({...o,frequency:v})))}{input('Duration',draft.duration,v=>setDraft(o=>({...o,duration:v})))}{input('Instructions',draft.instructions,v=>setDraft(o=>({...o,instructions:v})))}
 <Pressable style={s.outline} onPress={add}><Text style={s.outlineText}>＋ Add medicine</Text></Pressable>
 {meds.map(m=><View key={m.id} style={s.med}><Text style={s.medTitle}>{m.name}</Text><Text style={s.caption}>{m.strength||'Strength not detected'} · {m.frequency||'Frequency not detected'}</Text><Text style={s.flag}>OCR candidate — verify before continuing</Text></View>)}
 <Pressable style={s.button} onPress={next}><Text style={s.buttonText}>Continue to interaction report →</Text></Pressable>
 <Text style={s.foot}>OCR candidates are not confirmed prescriptions. This page does not validate dose, strength or whether a medicine is appropriate.</Text>
 </ScrollView>;
}
const s=StyleSheet.create({page:{padding:22,paddingTop:48,gap:13},back:{color:'#0E6E63',fontWeight:'700'},title:{fontSize:29,fontWeight:'800',color:'#172B28'},caption:{fontSize:13,color:'#6C7973',lineHeight:19},section:{fontSize:11,fontWeight:'800',letterSpacing:1.4,color:'#0E6E63',marginTop:10},label:{fontSize:13,fontWeight:'700',color:'#344640'},input:{backgroundColor:'#FFF',borderWidth:1,borderColor:'#E0E7E1',borderRadius:9,padding:13,fontSize:15},outline:{borderWidth:1,borderColor:'#0E6E63',padding:14,borderRadius:9,alignItems:'center'},outlineText:{color:'#0E6E63',fontWeight:'800'},ocrCard:{backgroundColor:'#FFF',padding:13,borderRadius:9,gap:8},ocrText:{minHeight:120,color:'#344640',lineHeight:20},med:{padding:14,backgroundColor:'#FFF',borderRadius:9,gap:4},medTitle:{fontWeight:'800',fontSize:16,color:'#1D332F'},flag:{fontSize:12,color:'#9A5E12',fontWeight:'700'},button:{backgroundColor:'#0E6E63',padding:16,borderRadius:9,alignItems:'center',marginTop:8},buttonText:{color:'#FFF',fontWeight:'800'},foot:{fontSize:12,color:'#829089',lineHeight:18}});
