import { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import { Brand } from '../components/Brand';

function parse(value?:string):string[]{try{const v=JSON.parse(value||'[]');return Array.isArray(v)?v.filter((x):x is string=>typeof x==='string'):[]}catch{return[]}}
function unique(values:string[]){return [...new Set(values.map(x=>x.trim()).filter(Boolean))]}
export default function SafetyReport(){
 const p=useLocalSearchParams<{meds?:string;prescribed?:string}>();
 const meds=useMemo(()=>unique(parse(p.meds)),[p.meds]);
 const prescribed=useMemo(()=>unique(parse(p.prescribed)),[p.prescribed]);
 const [allergies,setAllergies]=useState('');
 const [pregnancy,setPregnancy]=useState('Unknown / not provided');
 const [kidney,setKidney]=useState('Unknown / not provided');
 const [liver,setLiver]=useState('Unknown / not provided');
 const [food,setFood]=useState('');
 const [age,setAge]=useState('');
 const duplicates=useMemo(()=>{const seen=new Map<string,string[]>();meds.forEach(m=>{const k=m.toLowerCase().replace(/\b\d+(?:\.\d+)?\s*(mg|mcg|g|ml|%)\b/g,'').replace(/[^a-z]/g,'').trim();if(k){seen.set(k,[...(seen.get(k)||[]),m])}});return [...seen.values()].filter(x=>x.length>1)},[meds]);
 const missing=prescribed.filter(m=>!m.trim());
 const Row=({title,status,detail}:{title:string;status:string;detail:string})=><View style={s.row}><Text style={s.rowTitle}>{title}</Text><Text style={s.status}>{status}</Text><Text style={s.detail}>{detail}</Text></View>;
 return <ScrollView contentContainerStyle={s.page}>
  <Link href="/interactions" style={s.back}>‹ Back to label findings</Link><Brand size={36}/>
  <Text style={s.title}>Smart Safety Report</Text>
  <Text style={s.intro}>A structured checklist for pharmacist review. This screen does not diagnose, calculate safe doses or verify medicine combinations.</Text>
  <View style={s.card}><Text style={s.heading}>MEDICINES REVIEWED ({meds.length})</Text>{meds.length?meds.map((m,i)=><Text key={i} style={s.med}>• {m}</Text>):<Text style={s.detail}>No medicines entered.</Text>}</View>
  <View style={s.card}><Text style={s.heading}>PATIENT SAFETY DETAILS</Text>
   <Text style={s.label}>Age (years)</Text><TextInput value={age} onChangeText={setAge} keyboardType="numeric" placeholder="Not provided" style={s.input}/>
   <Text style={s.label}>Known allergies</Text><TextInput value={allergies} onChangeText={setAllergies} placeholder="Enter allergies, or write none known" style={s.input}/>
   <Text style={s.label}>Pregnancy / breastfeeding</Text><TextInput value={pregnancy} onChangeText={setPregnancy} placeholder="Yes / No / Not applicable / Unknown" style={s.input}/>
   <Text style={s.label}>Kidney condition</Text><TextInput value={kidney} onChangeText={setKidney} placeholder="Yes / No / Unknown" style={s.input}/>
   <Text style={s.label}>Liver condition</Text><TextInput value={liver} onChangeText={setLiver} placeholder="Yes / No / Unknown" style={s.input}/>
   <Text style={s.label}>Foods, drinks, vitamins or supplements used</Text><TextInput value={food} onChangeText={setFood} placeholder="e.g. alcohol, grapefruit, herbal products" style={s.input}/>
  </View>
  <Text style={s.heading}>SAFETY CHECKS</Text>
  <Row title="Duplicate medicine names" status={duplicates.length?'REVIEW':'NOT CONFIRMED'} detail={duplicates.length?duplicates.map(x=>x.join(' / ')).join('; ')+' — same-name entries detected. Verify active ingredients and strengths.':'No exact duplicate names detected. Different brand names may still contain the same ingredient.'}/>
  <Row title="Dose & dosage safety" status="NOT ASSESSED" detail="Dose, frequency, duration, age, weight and kidney/liver function need pharmacist verification. No dose calculator is connected."/>
  <Row title="Food & medicine interactions" status="NOT ASSESSED" detail={food?'Food/drink information recorded for clinician review; no interaction database is connected.':'Food, drink and supplement details not provided. Add them above for clinician review.'}/>
  <Row title="Allergy conflicts" status={allergies?'REVIEW REQUIRED':'UNKNOWN'} detail={allergies?'Allergy information recorded. Ingredient-level matching has not been performed.':'No allergy information provided; absence of data does not mean no allergy.'}/>
  <Row title="Pregnancy & breastfeeding" status="REVIEW REQUIRED" detail={pregnancy+' — medicine-specific risk assessment is not connected.'}/>
  <Row title="Kidney safety" status="REVIEW REQUIRED" detail={kidney+' — renal dose adjustment and contraindications are not assessed.'}/>
  <Row title="Liver safety" status="REVIEW REQUIRED" detail={liver+' — hepatic precautions and dose adjustment are not assessed.'}/>
  <Row title="Medicine timing" status="NOT GENERATED" detail="Follow the prescription label. No personalised timing schedule is generated because dose instructions may be incomplete."/>
  <Row title="Prescription vs label" status="NOT VERIFIED" detail="FDA label lookup is not a product-pack scan or prescription validation. Confirm active ingredient, strength and dosage form with a pharmacist."/>
  <View style={s.warning}><Text style={s.warningTitle}>Overall: PHARMACIST REVIEW REQUIRED</Text><Text style={s.detail}>Unknown and not-assessed checks must never be interpreted as safe. Do not stop, change or substitute medicines based on this report. Seek urgent medical help for severe or rapidly worsening symptoms.</Text></View>
  <Text style={s.foot}>Patient details entered here are only held in this screen's current session and are not saved. This report is an organisational aid, not clinical decision support.</Text>
 </ScrollView>
}
const s=StyleSheet.create({page:{padding:22,paddingTop:46,gap:13,backgroundColor:'#F4F7F3'},back:{color:'#0E6E63',fontWeight:'700'},title:{fontSize:28,fontWeight:'900',color:'#172B28'},intro:{fontSize:13,lineHeight:20,color:'#62716B'},card:{backgroundColor:'#FFF',borderRadius:12,padding:15,gap:9,borderWidth:1,borderColor:'#E0E7E1'},heading:{fontSize:12,fontWeight:'900',letterSpacing:1,color:'#0E6E63'},med:{fontSize:14,color:'#263C36',fontWeight:'700'},label:{fontSize:12,fontWeight:'700',color:'#344640'},input:{backgroundColor:'#F8FAF8',borderWidth:1,borderColor:'#DDE5DF',borderRadius:8,padding:11,fontSize:14},row:{backgroundColor:'#FFF',padding:14,borderRadius:10,borderWidth:1,borderColor:'#E1E8E2',gap:5},rowTitle:{fontSize:15,fontWeight:'800',color:'#1D332F'},status:{fontSize:11,fontWeight:'900',color:'#966016',letterSpacing:.7},detail:{fontSize:13,lineHeight:19,color:'#62716B'},warning:{backgroundColor:'#FFF2DC',padding:15,borderRadius:10,gap:7},warningTitle:{fontSize:15,fontWeight:'900',color:'#754B12'},foot:{fontSize:11,lineHeight:17,color:'#77837D',marginBottom:25}});
