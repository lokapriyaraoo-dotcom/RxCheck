import { useEffect, useMemo, useState } from 'react';
import { Alert, View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import { Brand } from '../components/Brand';
import { resolveMedicineIngredients, type IngredientCheck } from '../services/localDatabase';
import { buildPharmacistChecklist, sharePharmacistChecklist } from '../services/checklist';

function parse(value?:string):string[]{try{const v=JSON.parse(value||'[]');return Array.isArray(v)?v.filter((x):x is string=>typeof x==='string'):[]}catch{return[]}}
function unique(values:string[]){return [...new Set(values.map(x=>x.trim()).filter(Boolean))]}
function Row({title,status,detail}:{title:string;status:string;detail:string}){const label=/possible duplicate|possible allergy match/i.test(status)?'Found':/unknown|not provided|not confirmed|no match/i.test(status)?'Unknown':'Review';return <View style={s.row}><Text style={s.rowTitle}>{title}</Text><Text style={[s.status,label==='Found'?s.found:label==='Unknown'?s.unknown:s.review]}>{label}</Text><Text style={s.detail}>{detail}</Text></View>}
export default function SafetyReport(){
 const p=useLocalSearchParams<{meds?:string;prescribed?:string}>();
 const meds=useMemo(()=>unique(parse(p.meds)),[p.meds]);
 const [allergies,setAllergies]=useState('');
 const [pregnancy,setPregnancy]=useState('Unknown / not provided');
 const [kidney,setKidney]=useState('Unknown / not provided');
 const [liver,setLiver]=useState('Unknown / not provided');
 const [food,setFood]=useState('');
 const [age,setAge]=useState('');
 const [ingredientChecks,setIngredientChecks]=useState<IngredientCheck[]>([]);
 const [checklistBusy,setChecklistBusy]=useState(false);
 useEffect(()=>{let live=true;resolveMedicineIngredients(meds).then(rows=>{if(live)setIngredientChecks(rows)}).catch(()=>{if(live)setIngredientChecks([])});return()=>{live=false}},[p.meds]);
 const duplicates=useMemo(()=>{const seen=new Map<string,string[]>();ingredientChecks.forEach(row=>{if(row.ingredient)seen.set(row.ingredient,[...(seen.get(row.ingredient)||[]),row.medicine])});return [...seen.entries()].filter(([,names])=>names.length>1)},[ingredientChecks]);
 const allergyMatches=useMemo(()=>{const tokens=allergies.toLowerCase().split(/[,;\n]+/).map(x=>x.trim()).filter(Boolean);return ingredientChecks.filter(row=>row.ingredient&&tokens.some(token=>token===row.ingredient||row.ingredient!.includes(token)||token.includes(row.ingredient!)))},[allergies,ingredientChecks]);
 const unknownIngredients=ingredientChecks.filter(row=>!row.ingredient);
 async function shareChecklist(){
   setChecklistBusy(true);
   try{
     const findings=[
       {title:'Duplicate active ingredients',status:duplicates.length?'Possible duplicate':'Not confirmed',detail:duplicates.map(([ingredient,names])=>ingredient+': '+names.join(' / ')).join('; ')||'Review all brands and generic names.'},
       {title:'Ingredient-level allergy match',status:allergyMatches.length?'Possible match':'Unknown / limited',detail:allergyMatches.map(row=>row.medicine+' maps to '+row.ingredient).join('; ')||'Verify allergies against every active ingredient and excipient.'},
       {title:'Medicine interactions',status:'Not checked',detail:'Use an authorised, pharmacist-reviewed pairwise interaction reference.'},
       {title:'Dose, pregnancy, kidney/liver and food',status:'Professional review required',detail:'Verify using current clinical references.'}
     ];
     await sharePharmacistChecklist(buildPharmacistChecklist(findings,meds));
   }catch{Alert.alert('Share unavailable','Could not create or share the checklist.')}
   finally{setChecklistBusy(false)}
 }
 return <ScrollView contentContainerStyle={s.page}>
  <Link href="/interactions" style={s.back}>‹ Back to label findings</Link><Brand size={36}/>
  <Text style={s.title}>Smart Safety Report</Text>
  <Text style={s.intro}>A structured checklist for pharmacist review. This screen does not diagnose, calculate safe doses or verify medicine combinations.</Text>
  <View style={s.overall}><Text style={s.overallTitle}>Overall: Review</Text><Text style={s.detail}>Unknown and unassessed findings are not evidence of safety. A pharmacist must review this report.</Text></View>
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
  <Row title="Duplicate active ingredients (local catalogue)" status={duplicates.length?'POSSIBLE DUPLICATE SALT':unknownIngredients.length?'PARTIAL / UNKNOWN':'NOT CONFIRMED'} detail={duplicates.length?duplicates.map(([ingredient,names])=>ingredient+': '+names.join(' / ')).join('; ')+' — verify formulation and strength with a pharmacist.':'No duplicate ingredient was identified in the limited local catalogue. This is not proof that duplicate therapy is absent.'}/>
  <Row title="Ingredient-level allergy matching" status={allergyMatches.length?'POSSIBLE ALLERGY MATCH':allergies?'NO MATCH / LIMITED DATA':'UNKNOWN'} detail={allergyMatches.length?allergyMatches.map(row=>row.medicine+' maps to '+row.ingredient).join('; '):allergies?'No exact ingredient match in the limited local catalogue. Brand names, excipients and unmapped products are not covered.':'Allergy information not provided.'}/>
  {unknownIngredients.length?<Text style={s.detail}>Unmapped medicine names (ingredient unknown): {unknownIngredients.map(x=>x.medicine).join(', ')}. This does not mean no allergy or no duplicate ingredient.</Text>:null}
  <Row title="Dose & dosage safety" status="NOT ASSESSED" detail="Dose, frequency, duration, age, weight and kidney/liver function need pharmacist verification. No dose calculator is connected."/>
  <Row title="Food & medicine interactions" status="NOT ASSESSED" detail={food?'Food/drink information recorded for clinician review; no interaction database is connected.':'Food, drink and supplement details not provided. Add them above for clinician review.'}/>
  <Row title="Pregnancy & breastfeeding" status="REVIEW REQUIRED" detail={pregnancy+' — medicine-specific risk assessment is not connected.'}/>
  <Row title="Kidney safety" status="REVIEW REQUIRED" detail={kidney+' — renal dose adjustment and contraindications are not assessed.'}/>
  <Row title="Liver safety" status="REVIEW REQUIRED" detail={liver+' — hepatic precautions and dose adjustment are not assessed.'}/>
  <Row title="Medicine timing" status="NOT GENERATED" detail="Follow the prescription label. No personalised timing schedule is generated because dose instructions may be incomplete."/>
  <Row title="Prescription vs label" status="NOT VERIFIED" detail="FDA label lookup is not a product-pack scan or prescription validation. Confirm active ingredient, strength and dosage form with a pharmacist."/>
  <View style={s.card}><Text style={s.heading}>PHARMACIST REVIEW CHECKLIST</Text><Text style={s.detail}>Share the medicines and findings as a checklist. It records review items; it does not certify that they have been checked.</Text><Pressable disabled={checklistBusy} style={s.shareButton} onPress={shareChecklist}><Text style={s.shareButtonText}>{checklistBusy?'Preparing…':'Share findings checklist via WhatsApp or other app'}</Text></Pressable></View>
  <View style={s.warning}><Text style={s.warningTitle}>Overall: PHARMACIST REVIEW REQUIRED</Text><Text style={s.detail}>Unknown and not-assessed checks must never be interpreted as safe. Do not stop, change or substitute medicines based on this report. Seek urgent medical help for severe or rapidly worsening symptoms.</Text></View>
  <Text style={s.foot}>The starter ingredient catalogue is limited and not pharmacist-reviewed clinical decision support. Patient data is stored only in encrypted local history when a review is saved.</Text>
 </ScrollView>
}
const s=StyleSheet.create({page:{padding:22,paddingTop:46,gap:13,backgroundColor:'#F4F7F3'},back:{color:'#0E6E63',fontWeight:'700'},title:{fontSize:28,fontWeight:'900',color:'#172B28'},intro:{fontSize:13,lineHeight:20,color:'#62716B'},card:{backgroundColor:'#FFF',borderRadius:12,padding:15,gap:9,borderWidth:1,borderColor:'#E0E7E1'},heading:{fontSize:12,fontWeight:'900',letterSpacing:1,color:'#0E6E63'},med:{fontSize:14,color:'#263C36',fontWeight:'700'},label:{fontSize:12,fontWeight:'700',color:'#344640'},input:{backgroundColor:'#F8FAF8',borderWidth:1,borderColor:'#DDE5DF',borderRadius:8,padding:11,fontSize:14},row:{backgroundColor:'#FFF',padding:14,borderRadius:10,borderWidth:1,borderColor:'#E1E8E2',gap:5},rowTitle:{fontSize:15,fontWeight:'800',color:'#1D332F'},status:{fontSize:11,fontWeight:'900',letterSpacing:.7},found:{color:'#167447'},review:{color:'#94600C'},unknown:{color:'#68736D'},overall:{backgroundColor:'#FFF2DC',padding:14,borderRadius:10,gap:5},overallTitle:{fontSize:16,fontWeight:'900',color:'#754B12'},detail:{fontSize:13,lineHeight:19,color:'#62716B'},warning:{backgroundColor:'#FFF2DC',padding:15,borderRadius:10,gap:7},warningTitle:{fontSize:15,fontWeight:'900',color:'#754B12'},shareButton:{backgroundColor:'#0E6E63',padding:13,borderRadius:9,alignItems:'center'},shareButtonText:{color:'#FFF',fontWeight:'800',textAlign:'center'},foot:{fontSize:11,lineHeight:17,color:'#77837D',marginBottom:25}});
