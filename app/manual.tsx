import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Brand } from '../components/Brand';
import { emptyPatient, type Medicine, type Patient } from '../services/types';
import { extractPatientDetails, extractMedicineCandidates, readPrescriptionImage, validateImageBytes } from '../services/ocr';
import { readHandwrittenPrescriptionImage } from '../services/handwritingOcr';

const input=(label:string,value:string,onChange:(v:string)=>void,placeholder='')=><View style={{gap:5}}><Text style={s.label}>{label}</Text><TextInput value={value} onChangeText={onChange} placeholder={placeholder} style={s.input}/></View>;
function localMedicines(text:string,prefix='ocr'):Medicine[]{
  return extractMedicineCandidates(text).map((m,i)=>({
    id:prefix+'-'+i,name:m.name||'',strength:m.strength||'',dose:m.dose||'',
    unit:'unknown' as const,frequency:m.frequency||'',duration:m.duration||'',instructions:m.instructions||'',needsReview:true
  }));
}
export default function Manual(){
  const router=useRouter();
  const params=useLocalSearchParams<{ocrText?:string}>();
  const initialText=typeof params.ocrText==='string'?params.ocrText:'';
  const [ocrText,setOcrText]=useState(initialText);
  const [patient,setPatient]=useState<Patient>(()=>({...emptyPatient,...extractPatientDetails(initialText)}));
  const [meds,setMeds]=useState<Medicine[]>(()=>localMedicines(initialText));
  const [draft,setDraft]=useState({name:'',strength:'',dose:'',unit:'unknown' as Medicine['unit'],frequency:'',duration:'',instructions:''});
  const [busy,setBusy]=useState(false);
  const [currentMedsText,setCurrentMedsText]=useState('');

  useEffect(()=>{
    if(typeof params.ocrText!=='string'||!params.ocrText.trim())return;
    const text=params.ocrText;
    setOcrText(text);
    const extractedPatient=extractPatientDetails(text);
    setPatient(old=>({...old,...Object.fromEntries(Object.entries(extractedPatient).filter(([,value])=>Boolean(value)))}));
    const candidates=localMedicines(text);
    if(candidates.length)setMeds(candidates);
  },[params.ocrText]);



  const p=(key:'name'|'age'|'weightKg'|'gender'|'allergies',value:string)=>setPatient(old=>({...old,[key]:value}));
  function updateMedicine(id:string,key:'name'|'strength'|'dose'|'unit'|'frequency'|'duration'|'instructions',value:string){
    setMeds(old=>old.map(m=>m.id===id?({...m,[key]:value} as Medicine):m));
  }
  async function attachPrescription(){
    const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],quality:0.9});
    if(result.canceled||!result.assets.length)return;
    const asset=result.assets[0];
    if(asset.fileSize!=null&&!validateImageBytes(asset.fileSize)){
      Alert.alert('Image too large','Choose an image under 12 MB, then try again.');
      return;
    }
    setBusy(true);
    try{
      let printedText='';
      let handwritingText='';
      const failures:string[]=[];
      try{
        const read=await readPrescriptionImage(asset.uri);
        printedText=read.text;
      }catch(error){
        failures.push(error instanceof Error?error.message:'Printed-text OCR was unavailable.');
      }
      // Keep the printed and experimental handwriting passes independent:
      // one engine failing must not discard useful text from the other.
      try{
        const handwritten=await readHandwrittenPrescriptionImage(asset.uri);
        handwritingText=handwritten.text;
      }catch(error){
        failures.push(error instanceof Error?error.message:'Experimental handwriting OCR was unavailable.');
      }
      const text=[...new Set(
        [...printedText.split(/\r?\n/),...handwritingText.split(/\r?\n/)]
          .map(line=>line.trim()).filter(Boolean)
      )].join('\n');
      if(!text)throw new Error(failures.join('\n\n')||'No readable text was detected. Try a clearer image or enter details manually.');
      setOcrText(text);
      const extractedPatient=extractPatientDetails(text);
      setPatient(old=>({...old,...Object.fromEntries(Object.entries(extractedPatient).filter(([,value])=>Boolean(value)))}));
      const candidates=localMedicines(text,'attached');
      if(candidates.length)setMeds(candidates);
      Alert.alert(
        'Prescription text read',
        failures.length
          ? 'One OCR pass was unavailable. Available text was kept; check every field against the original and enter missing details manually.\n\n'+failures.join('\n\n')
          : 'Printed-text and experimental handwriting OCR results were combined on this device. All extracted fields are unverified; check them against the original.'
      );
    }catch(error){
      Alert.alert('Could not read prescription',error instanceof Error?error.message:'Please try a clearer image or enter details manually.');
    }finally{
      setBusy(false);
    }
  }

  function add(){
    if(!draft.name.trim()){Alert.alert('Medicine name required','Enter the exact name printed on the prescription.');return;}
    setMeds(old=>[...old,{...draft,id:String(Date.now()),needsReview:true}]);
    setDraft({name:'',strength:'',dose:'',unit:'unknown',frequency:'',duration:'',instructions:''});
  }
  function next(){
    const prescribed=meds.map(m=>m.name.trim()).filter(Boolean);
    const taking=currentMedsText.split(/[\r\n,;]+/).map(x=>x.trim()).filter(Boolean);
    const all=[...new Set([...prescribed,...taking])];
    if(!all.length){Alert.alert('Add medicines','Enter prescribed medicines and any other medicines currently being taken.');return;}
    router.push({pathname:'/workspace',params:{meds:JSON.stringify(all),prescribed:JSON.stringify(prescribed),taking:JSON.stringify(taking)}});
  }
  const patientCount=[patient.name,patient.age,patient.gender,patient.weightKg,patient.allergies].filter(Boolean).length;
  return <ScrollView contentContainerStyle={s.page}>
    <Link href="/" style={s.back}>‹ Home</Link>
    <Brand size={38}/>
    <Text style={s.title}>Review patient & medicine details</Text>
    <Text style={s.caption}>Prescription fields are filled from the scanned image where identifiable. Verify every value against the original before continuing.</Text>
    <Pressable style={s.outline} onPress={attachPrescription} disabled={busy}><Text style={s.outlineText}>{busy?'Reading…':'＋ Read another prescription image'}</Text></Pressable>
    {ocrText?<View style={s.ocrCard}>
      <Text style={s.section}>PRESCRIPTION TEXT READ LOCALLY</Text>
      <Text style={s.caption}>Text was read locally from the selected image. The image itself is not retained on this review screen or uploaded for OCR. Detected fields are unverified; enter missing values manually.</Text>
      <View style={s.detectedRow}><Text style={s.detectedLabel}>AGE</Text><Text style={s.detectedValue}>{patient.age||'Not detected'}</Text></View>
      <View style={s.detectedRow}><Text style={s.detectedLabel}>WEIGHT</Text><Text style={s.detectedValue}>{patient.weightKg?patient.weightKg+' kg':'Not detected'}</Text></View>
      <View style={s.detectedRow}><Text style={s.detectedLabel}>GENDER</Text><Text style={s.detectedValue}>{patient.gender||'Not detected'}</Text></View>
      <Text style={s.caption}>{patientCount} patient fields and {meds.length} medicine entries currently filled.</Text>
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
    {input('Frequency',draft.frequency,v=>setDraft(o=>({...o,frequency:v})))}
    {input('Duration',draft.duration,v=>setDraft(o=>({...o,duration:v})))}
    {input('Route / instructions',draft.instructions,v=>setDraft(o=>({...o,instructions:v})))}
    <Pressable style={s.outline} onPress={add}><Text style={s.outlineText}>＋ Add medicine</Text></Pressable>
    {meds.map((m,i)=><View key={m.id} style={s.med}>
      <Text style={s.medTitle}>Medicine {i+1}</Text>
      {input('Medicine name',m.name,v=>updateMedicine(m.id,'name',v))}
      {input('Strength',m.strength,v=>updateMedicine(m.id,'strength',v))}
      {input('Dose',m.dose,v=>updateMedicine(m.id,'dose',v))}
      {input('Unit',m.unit,v=>updateMedicine(m.id,'unit',v))}
      {input('Frequency',m.frequency,v=>updateMedicine(m.id,'frequency',v))}
      {input('Duration',m.duration,v=>updateMedicine(m.id,'duration',v))}
      {input('Route / instructions',m.instructions,v=>updateMedicine(m.id,'instructions',v))}
      <Text style={s.flag}>OCR extracted — verify with original prescription{typeof m.confidence==='number'?' · confidence '+Math.round(m.confidence*100)+'%':''}</Text>
    </View>)}
    <Text style={s.section}>OTHER MEDICINES CURRENTLY TAKEN</Text>
    <Text style={s.caption}>Include regular medicines, OTC painkillers, vitamins and supplements. Separate names with commas or new lines.</Text>
    <TextInput multiline value={currentMedsText} onChangeText={setCurrentMedsText} placeholder="e.g. metformin 500 mg, aspirin 75 mg" textAlignVertical="top" style={[s.input,{minHeight:90}]}/>
    <Pressable style={s.button} onPress={next}><Text style={s.buttonText}>Continue to medicine-label lookup →</Text></Pressable>
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
