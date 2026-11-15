import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Brand } from '../components/Brand';
import { emptyPatient, type Medicine, type Patient } from '../services/types';
import { extractPatientDetails, extractMedicineCandidates, readPrescriptionImage } from '../services/ocr';
import { extractPrescriptionWithAI, extractPrescriptionImageWithAI, isAIConfigured } from '../services/ai';

const input=(label:string,value:string,onChange:(v:string)=>void,placeholder='')=><View style={{gap:5}}><Text style={s.label}>{label}</Text><TextInput value={value} onChangeText={onChange} placeholder={placeholder} style={s.input}/></View>;
function localMedicines(text:string,prefix='ocr'):Medicine[]{
  return extractMedicineCandidates(text).map((m,i)=>({
    id:prefix+'-'+i,name:m.name||'',strength:m.strength||'',dose:m.dose||'',
    unit:'unknown' as const,frequency:'',duration:'',instructions:m.instructions||'',needsReview:true
  }));
}
export default function Manual(){
  const router=useRouter();
  const params=useLocalSearchParams<{ocrText?:string;aiConsent?:string;imageUris?:string}>();
  const initialText=typeof params.ocrText==='string'?params.ocrText:'';
  const initialImages=(()=>{try{return params.imageUris?JSON.parse(params.imageUris) as string[]:[];}catch{return [];}})();
  const [imageUris,setImageUris]=useState<string[]>(initialImages);
  const [ocrText,setOcrText]=useState(initialText);
  const [patient,setPatient]=useState<Patient>(()=>({...emptyPatient,...extractPatientDetails(initialText)}));
  const [meds,setMeds]=useState<Medicine[]>(()=>localMedicines(initialText));
  const [draft,setDraft]=useState({name:'',strength:'',dose:'',unit:'unknown' as Medicine['unit'],instructions:''});
  const [busy,setBusy]=useState(false);
  const [currentMedsText,setCurrentMedsText]=useState('');
  const [aiBusy,setAiBusy]=useState(false);
  const [aiReview,setAiReview]=useState('');
  const [aiConsent,setAiConsent]=useState(params.aiConsent==='true');

  useEffect(()=>{
    if(typeof params.ocrText!=='string'||!params.ocrText.trim())return;
    const text=params.ocrText;
    setOcrText(text);
    const extractedPatient=extractPatientDetails(text);
    setPatient(old=>({...old,...Object.fromEntries(Object.entries(extractedPatient).filter(([,value])=>Boolean(value)))}));
    const candidates=localMedicines(text);
    if(candidates.length)setMeds(candidates);
  },[params.ocrText]);

  useEffect(()=>{
    if((!ocrText.trim()&&!imageUris.length)||!aiConsent)return;
    if(!isAIConfigured()){
      setAiReview('The secure AI gateway is not configured in this app build. Patient and medicine fields detected by on-device OCR remain filled; configure the gateway URL and rebuild to enable AI autofill.');
      return;
    }
    let active=true;
    setAiBusy(true);
    (imageUris.length?Promise.all(imageUris.map(uri=>extractPrescriptionImageWithAI(uri))).then(results=>({patient:results.find(x=>x.patient)?.patient,medicines:results.flatMap(x=>x.medicines||[])})):extractPrescriptionWithAI(ocrText)).then(data=>{
      if(!active)return;
      const p=data.patient||{};
      const patientFound=[p.name,p.age,p.gender,p.weightKg,p.allergies].some(value=>value!==undefined&&String(value).trim()!=='');
      if(patientFound)setPatient(old=>({
        ...old,
        name:String(p.name||old.name||''),
        age:p.age!==undefined&&String(p.age).trim()!==''?String(p.age):old.age,
        gender:String(p.gender||old.gender||''),
        weightKg:p.weightKg!==undefined&&String(p.weightKg).trim()!==''?String(p.weightKg):old.weightKg,
        allergies:String(p.allergies||old.allergies||'')
      }));
      const parsed=(data.medicines||[]).filter(m=>m.name?.trim()).map((m,i)=>({
        id:'ai-'+i,name:m.name||'',strength:m.strength||'',dose:m.dose||'',
        unit:(['mg','mcg','g','mL'].includes(m.unit||'')?m.unit:'unknown') as Medicine['unit'],
        frequency:'',duration:'',
        instructions:[m.route?'Route: '+m.route:'',m.instructions||''].filter(Boolean).join(' · '),
        confidence:m.confidence,needsReview:true
      }));
      if(parsed.length)setMeds(old=>parsed.map(m=>{
        const local=old.find(candidate=>candidate.name.trim().toLowerCase()===m.name.trim().toLowerCase());
        return {...m,strength:m.strength||local?.strength||'',dose:m.dose||local?.dose||'',instructions:m.instructions||local?.instructions||''};
      }));
      setAiReview(patientFound||parsed.length
        ?'AI extraction complete. The detected fields are filled below. Check every value against the original prescription.'
        :'AI could not identify patient or medicine fields reliably. The on-device OCR results remain available for correction.');
    }).catch(error=>{
      if(!active)return;
      setAiReview((error instanceof Error?error.message:'AI extraction unavailable')+' On-device OCR fields remain filled where detected; please verify or enter unclear values manually.');
    }).finally(()=>{if(active)setAiBusy(false);});
    return()=>{active=false;};
  },[ocrText,aiConsent,imageUris]);

  const p=(key:'name'|'age'|'weightKg'|'gender'|'allergies',value:string)=>setPatient(old=>({...old,[key]:value}));
  function updateMedicine(id:string,key:'name'|'strength'|'dose'|'unit'|'instructions',value:string){
    setMeds(old=>old.map(m=>m.id===id?({...m,[key]:value} as Medicine):m));
  }
  function requestAIConsent(){
    if(!isAIConfigured()){
      Alert.alert('AI gateway not configured','Your prescription has been read on this device. The fields detected by local OCR are already filled. AI autofill can be enabled after the secure RxCheck gateway URL is configured and the app is rebuilt.');
      return;
    }
    Alert.alert(
      'Prescription attached',
      'Allow AI prescription reading? The prescription image will be sent to the RxCheck secure gateway, processed by PaddleOCR-VL for layout and text, then structured by the configured AI provider. Continue only if you consent.',
      [
        {text:'NOT NOW',style:'cancel'},
        {text:'ALLOW AI AUTOFILL',onPress:()=>setAiConsent(true)}
      ]
    );
  }

  async function attachPrescription(){
    const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],quality:0.9});
    if(result.canceled||!result.assets.length)return;
    setBusy(true);
    try{
      const read=await readPrescriptionImage(result.assets[0].uri);
      setAiConsent(false);
      setImageUris([result.assets[0].uri]);
      setOcrText(read.text);
      const extractedPatient=extractPatientDetails(read.text);
      setPatient(old=>({...old,...Object.fromEntries(Object.entries(extractedPatient).filter(([,value])=>Boolean(value)))}));
      const candidates=localMedicines(read.text,'attached');
      if(candidates.length)setMeds(candidates);
      setAiReview('Image text was read on this device. Patient and medicine fields detected locally are prefilled below. Choose AI autofill only after reviewing the consent prompt.');
      Alert.alert('Prescription attached','Image text was read. Patient and medicine fields detected on this device have been filled where identifiable.');
    }catch(error){
      Alert.alert('Could not read prescription',error instanceof Error?error.message:'Please try a clearer image.');
    }finally{
      setBusy(false);
    }
  }

  function add(){
    if(!draft.name.trim()){Alert.alert('Medicine name required','Enter the exact name printed on the prescription.');return;}
    setMeds(old=>[...old,{...draft,id:String(Date.now()),frequency:'',duration:'',needsReview:true}]);
    setDraft({name:'',strength:'',dose:'',unit:'unknown',instructions:''});
  }
  function next(){
    const prescribed=meds.map(m=>m.name.trim()).filter(Boolean);
    const taking=currentMedsText.split(/[\r\n,;]+/).map(x=>x.trim()).filter(Boolean);
    const all=[...new Set([...prescribed,...taking])];
    if(!all.length){Alert.alert('Add medicines','Enter prescribed medicines and any other medicines currently being taken.');return;}
    router.push({pathname:'/interactions',params:{meds:JSON.stringify(all),prescribed:JSON.stringify(prescribed),taking:JSON.stringify(taking)}});
  }
  const patientCount=[patient.name,patient.age,patient.gender,patient.weightKg,patient.allergies].filter(Boolean).length;
  return <ScrollView contentContainerStyle={s.page}>
    <Link href="/" style={s.back}>‹ Home</Link>
    <Brand size={38}/>
    <Text style={s.title}>Review patient & medicine details</Text>
    <Text style={s.caption}>Prescription fields are filled from the scanned image where identifiable. Verify every value against the original before continuing.</Text>
    <Pressable style={s.outline} onPress={attachPrescription} disabled={busy}><Text style={s.outlineText}>{busy?'Reading…':'＋ Attach another prescription image'}</Text></Pressable>
    {ocrText?<View style={s.ocrCard}>
      <Text style={s.section}>PRESCRIPTION ATTACHED</Text>
      <Text style={s.caption}>Image text was read. Detected fields are shown below; missing values must be entered manually.</Text>
      <View style={s.detectedRow}><Text style={s.detectedLabel}>AGE</Text><Text style={s.detectedValue}>{patient.age||'Not detected'}</Text></View>
      <View style={s.detectedRow}><Text style={s.detectedLabel}>WEIGHT</Text><Text style={s.detectedValue}>{patient.weightKg?patient.weightKg+' kg':'Not detected'}</Text></View>
      <View style={s.detectedRow}><Text style={s.detectedLabel}>GENDER</Text><Text style={s.detectedValue}>{patient.gender||'Not detected'}</Text></View>
      <Text style={s.caption}>{patientCount} patient fields and {meds.length} medicine entries currently filled.</Text>
      {!aiConsent&&isAIConfigured()?<Pressable style={s.outline} onPress={requestAIConsent}><Text style={s.outlineText}>ALLOW AI AUTOFILL</Text></Pressable>:null}
      {aiBusy?<Text style={s.caption}>Sending the consented prescription image to PaddleOCR-VL and organizing the extracted fields…</Text>:null}
      {aiReview?<Text style={s.caption}>{aiReview}</Text>:null}
    </View>:null}
    <Text style={s.section}>PATIENT DETAILS</Text>
    {input('Patient name',patient.name,v=>p('name',v))}
    {input('Age',patient.age,v=>p('age',v),'Years')}
    {input('Weight',patient.weightKg,v=>p('weightKg',v),'kg')}
    {input('Gender',patient.gender,v=>p('gender',v))}
    {input('Allergies',patient.allergies,v=>p('allergies',v),'Known allergies or unknown')}
    <Text style={s.section}>PRESCRIBED MEDICINES</Text>
    {input('Medicine prescribed or currently taking',draft.name,v=>setDraft(o=>({...o,name:v})))}
    {input('Strength',draft.strength,v=>setDraft(o=>({...o,strength:v})))}
    {input('Dose',draft.dose,v=>setDraft(o=>({...o,dose:v})))}
    {input('Unit (mg, mcg, g, mL)',draft.unit,v=>setDraft(o=>({...o,unit:(['mg','mcg','g','mL'].includes(v)?v:'unknown') as Medicine['unit']})))}
    {input('Route / instructions',draft.instructions,v=>setDraft(o=>({...o,instructions:v})))}
    <Pressable style={s.outline} onPress={add}><Text style={s.outlineText}>＋ Add medicine</Text></Pressable>
    {meds.map((m,i)=><View key={m.id} style={s.med}>
      <Text style={s.medTitle}>Medicine {i+1}</Text>
      {input('Medicine name',m.name,v=>updateMedicine(m.id,'name',v))}
      {input('Strength',m.strength,v=>updateMedicine(m.id,'strength',v))}
      {input('Dose',m.dose,v=>updateMedicine(m.id,'dose',v))}
      {input('Unit',m.unit,v=>updateMedicine(m.id,'unit',v))}
      {input('Route / instructions',m.instructions,v=>updateMedicine(m.id,'instructions',v))}
      <Text style={s.flag}>OCR/AI extracted — verify with original prescription{typeof m.confidence==='number'?' · confidence '+Math.round(m.confidence*100)+'%':''}</Text>
    </View>)}
    <Text style={s.section}>OTHER MEDICINES CURRENTLY TAKEN</Text>
    <Text style={s.caption}>Include regular medicines, OTC painkillers, vitamins and supplements. Separate names with commas or new lines.</Text>
    <TextInput multiline value={currentMedsText} onChangeText={setCurrentMedsText} placeholder="e.g. metformin 500 mg, aspirin 75 mg" textAlignVertical="top" style={[s.input,{minHeight:90}]}/>
    <Pressable style={s.button} onPress={next}><Text style={s.buttonText}>Continue to interaction report →</Text></Pressable>
    <Text style={s.foot}>OCR candidates are not confirmed prescriptions. This page does not validate dose, strength or whether a medicine is appropriate.</Text>
  </ScrollView>;
}
const s=StyleSheet.create({
  page:{padding:22,paddingTop:48,gap:13},back:{color:'#0E6E63',fontWeight:'700'},
  title:{fontSize:29,fontWeight:'800',color:'#172B28'},caption:{fontSize:13,color:'#6C7973',lineHeight:19},
  section:{fontSize:11,fontWeight:'800',letterSpacing:1.4,color:'#0E6E63',marginTop:10},
  label:{fontSize:13,fontWeight:'700',color:'#344640'},
  input:{backgroundColor:'#FFF',borderWidth:1,borderColor:'#E0E7E1',borderRadius:9,padding:13,fontSize:15},
  outline:{borderWidth:1,borderColor:'#0E6E63',padding:14,borderRadius:9,alignItems:'center'},
  outlineText:{color:'#0E6E63',fontWeight:'800'},
  ocrCard:{backgroundColor:'#F5FAF7',padding:13,borderRadius:9,gap:8,borderWidth:1,borderColor:'#DCE9E2'},
  detectedRow:{flexDirection:'row',justifyContent:'space-between',gap:12},
  detectedLabel:{fontSize:11,fontWeight:'800',color:'#62716B'},
  detectedValue:{fontSize:13,fontWeight:'800',color:'#203A34'},
  med:{padding:14,backgroundColor:'#FFF',borderRadius:9,gap:4},
  medTitle:{fontWeight:'800',fontSize:16,color:'#1D332F'},
  flag:{fontSize:12,color:'#9A5E12',fontWeight:'700'},
  button:{backgroundColor:'#0E6E63',padding:16,borderRadius:9,alignItems:'center',marginTop:8},
  buttonText:{color:'#FFF',fontWeight:'800'},
  foot:{fontSize:12,color:'#829089',lineHeight:18}
});
