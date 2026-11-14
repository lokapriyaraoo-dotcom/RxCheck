import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Brand } from '../components/Brand';

type LabelEvidence = { medicine:string; matched:boolean; interactions:string[]; warnings:string[]; sourceUrl:string };
function cleanName(value:string){return value.trim().replace(/[^a-zA-Z0-9 -]/g,'').slice(0,70);}
async function lookupFdaLabel(medicine:string):Promise<LabelEvidence>{
  const name=cleanName(medicine);
  const search='openfda.generic_name:"'+name+'" OR openfda.brand_name:"'+name+'"';
  const url='https://api.fda.gov/drug/label.json?search='+encodeURIComponent(search)+'&limit=1';
  try{
    const response=await fetch(url);
    if(!response.ok)return {medicine,matched:false,interactions:[],warnings:[],sourceUrl:'https://open.fda.gov/apis/drug/label/'};
    const data=await response.json() as {results?:Array<Record<string,unknown>>};
    const item=data.results?.[0];
    if(!item)return {medicine,matched:false,interactions:[],warnings:[],sourceUrl:'https://open.fda.gov/apis/drug/label/'};
    const arr=(v:unknown)=>Array.isArray(v)?v.filter(x=>typeof x==='string').slice(0,2) as string[]:[];
    return {medicine,matched:true,interactions:arr(item.drug_interactions),warnings:arr(item.boxed_warning).concat(arr(item.contraindications)),sourceUrl:'https://open.fda.gov/apis/drug/label/'};
  }catch{return {medicine,matched:false,interactions:[],warnings:[],sourceUrl:'https://open.fda.gov/apis/drug/label/'};}
}
export default function Interactions(){
 const params=useLocalSearchParams<{meds?:string;prescribed?:string;taking?:string}>();
 const medicines=useMemo(()=>{try{return JSON.parse(typeof params.meds==='string'?params.meds:'[]') as string[]}catch{return []}},[params.meds]);
 const list=medicines.filter(Boolean);
 const [loading,setLoading]=useState(false);const [evidence,setEvidence]=useState<LabelEvidence[]>([]);
 const router=useRouter();
 useEffect(()=>{let live=true;async function run(){if(!list.length){setEvidence([]);return;}setLoading(true);const results=await Promise.all(list.slice(0,8).map(lookupFdaLabel));if(live)setEvidence(results);if(live)setLoading(false);}run();return()=>{live=false;};},[params.meds]);
 const matched=evidence.filter(x=>x.matched);
 const hasInteractionText=matched.some(x=>x.interactions.length>0);
 return <ScrollView contentContainerStyle={s.page}>
  <Link href="/" style={s.back}>‹ Home</Link><Brand size={38}/>
  <Text style={s.title}>Final drug interaction report</Text>
  <Text style={s.copy}>Consolidated review of the medicine list extracted from the prescription and medicines the patient says they currently take.</Text>
  <View style={s.card}><Text style={s.section}>MEDICINES REVIEWED</Text>{list.length?list.map((m,i)=><Text key={i} style={s.med}>• {m}</Text>):<Text style={s.copy}>No medicine names were supplied. Return to patient details and add all medicines.</Text>}</View>
  <View style={s.report}>
   <Text style={s.reportTitle}>Consolidated findings</Text>
   {loading?<View style={s.row}><ActivityIndicator color="#0E6E63"/><Text style={s.copy}>Checking official FDA product-label records…</Text></View>:null}
   {!loading&&!list.length?<Text style={s.copy}>Report cannot be generated until medicines are entered.</Text>:null}
   {!loading&&list.length>0&&matched.length===0?<Text style={s.copy}>No matching FDA label record was found for the entered names. This is an unknown result, not evidence that the medicines are safe together.</Text>:null}
   {!loading&&matched.map((item,i)=><View key={i} style={s.finding}>
    <Text style={s.findingTitle}>{item.medicine} — FDA label matched</Text>
    {item.interactions.length?item.interactions.map((t,j)=><Text key={j} style={s.copy}>{t}</Text>):<Text style={s.copy}>No Drug Interactions section was returned in this matching label record. This does not rule out an interaction.</Text>}
    {item.warnings.map((t,j)=><Text key={'w'+j} style={s.copy}>Label warning: {t}</Text>)}
   </View>)}
   {!loading&&hasInteractionText?<Text style={s.copy}>These are label excerpts for individual medicines. They are not a validated pairwise interaction verdict.</Text>:null}
  </View>
  <View style={s.coverage}>
   <Text style={s.section}>SOURCE COVERAGE</Text>
   <Text style={s.copy}>• OpenFDA Drug Label API: queried live for each medicine above.</Text>
   <Text style={s.copy}>• FDA FDALabel: full-text labeling reference; no automated integration configured.</Text>
   <Text style={s.copy}>• Drugs.com and Medscape: no licensed checker API credentials/integration configured.</Text>
   <Text style={s.copy}>• Cyntegrity: its visualizer is based on FDA adverse-event reporting patterns, not a validated causal interaction checker; no API integration configured.</Text>
  </View>
  <View style={s.warning}><Text style={s.warningTitle}>Clinical safety limitation</Text><Text style={s.copy}>This report does not claim that a medicine combination is safe. OpenFDA says its data must not be relied on for medical-care decisions. Drugs.com, Medscape, Cyntegrity and FDALabel results cannot be represented as checked unless a supported, authorized data connection is added. Ask a pharmacist or prescriber to verify the complete regimen. Do not stop, change or substitute medicines based on this report.</Text></View>
  <Pressable style={s.next} onPress={()=>router.push({pathname:'/buy',params:{meds:JSON.stringify(list)}})}><Text style={s.nextText}>Continue to medicine dispensary →</Text></Pressable>
  <Text style={s.foot}>Sources: openFDA drug labeling, FDA FDALabel, Drugs.com Interaction Checker, Medscape Drug Interaction Checker and Cyntegrity Drug Interaction Visualizer. Source availability is shown above; unavailable sources are not treated as checked.</Text>
 </ScrollView>;
}
const s=StyleSheet.create({page:{padding:22,paddingTop:48,gap:13},back:{color:'#0E6E63',fontWeight:'700'},title:{fontSize:27,fontWeight:'800',color:'#172B28'},copy:{fontSize:13,color:'#63716B',lineHeight:20},med:{fontSize:15,fontWeight:'700',color:'#1D332F'},section:{fontSize:11,fontWeight:'800',letterSpacing:1.3,color:'#0E6E63',marginBottom:8},card:{backgroundColor:'#FFF',borderWidth:1,borderColor:'#E0E7E1',borderRadius:10,padding:15,gap:7},report:{backgroundColor:'#FFF',borderRadius:10,padding:15,gap:12,borderWidth:1,borderColor:'#D9E5DF'},reportTitle:{fontSize:18,fontWeight:'800',color:'#1D332F'},row:{flexDirection:'row',gap:10,alignItems:'center'},finding:{borderTopWidth:1,borderTopColor:'#E7ECE8',paddingTop:10,gap:6},findingTitle:{fontSize:14,fontWeight:'800',color:'#0E6E63'},coverage:{backgroundColor:'#F0F5F1',padding:15,borderRadius:10,gap:7},warning:{backgroundColor:'#FFF4DE',padding:15,borderRadius:10,gap:6},warningTitle:{fontWeight:'800',color:'#754B12'},next:{backgroundColor:'#0E6E63',padding:16,borderRadius:10,alignItems:'center',marginTop:10},nextText:{color:'#FFF',fontWeight:'800'},foot:{fontSize:12,color:'#7B8781',lineHeight:18,marginTop:8}});
