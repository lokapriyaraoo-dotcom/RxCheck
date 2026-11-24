import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Brand } from '../components/Brand';
import { checkInteractions } from '../services/interactions';
import type { Medicine } from '../services/types';

type LabelEvidence = {
  medicine:string;
  status:'matched'|'not-found'|'unavailable';
  interactions:string[];
  warnings:string[];
  sourceUrl:string;
};
function cleanName(value:string){return value.trim().replace(/[^a-zA-Z0-9 -]/g,'').slice(0,70);}
async function lookupFdaLabel(medicine:string):Promise<LabelEvidence>{
  const name=cleanName(medicine);
  const sourceUrl='https://open.fda.gov/apis/drug/label/';
  if(!name)return {medicine,status:'unavailable',interactions:[],warnings:[],sourceUrl};
  const search='openfda.generic_name:"'+name+'" OR openfda.brand_name:"'+name+'"';
  const url='https://api.fda.gov/drug/label.json?search='+encodeURIComponent(search)+'&limit=1';
  try{
    const response=await fetch(url);
    if(!response.ok)return {
      medicine,status:response.status===404?'not-found':'unavailable',
      interactions:[],warnings:[],sourceUrl
    };
    const data=await response.json() as {results?:Array<Record<string,unknown>>};
    const item=data.results?.[0];
    if(!item)return {medicine,status:'not-found',interactions:[],warnings:[],sourceUrl};
    const arr=(v:unknown)=>Array.isArray(v)?v.filter(x=>typeof x==='string').slice(0,2) as string[]:[];
    return {medicine,status:'matched',interactions:arr(item.drug_interactions),warnings:arr(item.boxed_warning).concat(arr(item.contraindications)),sourceUrl};
  }catch{
    return {medicine,status:'unavailable',interactions:[],warnings:[],sourceUrl};
  }
}
function parseNames(value:string|undefined):string[]{
  try{
    const parsed=JSON.parse(value||'[]');
    return Array.isArray(parsed)?parsed.filter((x):x is string=>typeof x==='string'&&x.trim().length>0):[];
  }catch{return [];}
}
function uniqueNames(values:string[]):string[]{
  const seen=new Set<string>();
  return values.filter(value=>{
    const key=value.trim().toLowerCase();
    if(!key||seen.has(key))return false;
    seen.add(key);
    return true;
  });
}
export default function Interactions(){
 const params=useLocalSearchParams<{meds?:string;prescribed?:string;taking?:string}>();
 const medicines=useMemo(()=>parseNames(params.meds),[params.meds]);
 const prescribed=useMemo(()=>uniqueNames(parseNames(params.prescribed)),[params.prescribed]);
 const list=uniqueNames(medicines);
 const [loading,setLoading]=useState(false);
 const [evidence,setEvidence]=useState<LabelEvidence[]>([]);
 const [expandedLabels,setExpandedLabels]=useState<Record<string,boolean>>({});
 const router=useRouter();
 useEffect(()=>{
   let live=true;
   async function run(){
     if(!list.length){setEvidence([]);setLoading(false);return;}
     setLoading(true);
     const results=await Promise.all(list.slice(0,8).map(lookupFdaLabel));
     if(live){setEvidence(results);setLoading(false);}
   }
   run();
   return()=>{live=false;};
 },[params.meds]);
 const matched=evidence.filter(x=>x.status==='matched');
 const notFoundCount=evidence.filter(x=>x.status==='not-found').length;
 const unavailableCount=evidence.filter(x=>x.status==='unavailable').length;
 const hasInteractionText=matched.some(x=>x.interactions.length>0);
 const interactionFindings=useMemo(()=>{
   const entries:Medicine[]=list.map((name,index)=>({
     id:String(index),name,strength:'',dose:'',unit:'unknown',frequency:'',duration:'',
     instructions:'',needsReview:true,
   }));
   return checkInteractions(entries);
 },[params.meds]);
  return <ScrollView contentContainerStyle={s.page}>
  <Link href="/" style={s.back}>‹ Home</Link><Brand size={38}/>
  <Text style={s.title}>FDA medicine-label lookup</Text>
  <Text style={s.copy}>This screen runs RxCheck's local interaction engine and retrieves individual FDA product-label information. The starter database maps three exact generic names but contains no pharmacist-reviewed interaction rules, so combinations remain UNKNOWN until reviewed records are added. FDA label text alone cannot establish whether two medicines interact. Medicine names are sent to the public openFDA API; prescription images and patient details are not sent.</Text>
  <View style={s.card}><Text style={s.section}>MEDICINES ENTERED</Text>{list.length?list.map((m,i)=><Text key={i} style={s.med}>• {m}</Text>):<Text style={s.copy}>No medicine names were supplied. Return to patient details and add all prescribed and currently used medicines.</Text>}</View>
  <View style={s.report}>
   <Text style={s.reportTitle}>Local interaction database assessment</Text>
   <Text style={s.copy}>RxCheck checks each medicine pair against its bundled interaction records. The database currently has no pharmacist-reviewed pair records, so results remain UNKNOWN—not safe, major, moderate or minor. FDA label excerpts below are individual product information, not a pairwise interaction verdict.</Text>
   {interactionFindings.map((finding,i)=><View key={i} style={s.finding}>
    <Text style={s.findingTitle}>{finding.title}</Text>
    <Text style={finding.severity==='high'?s.critical: finding.severity==='moderate'?s.pairUnknown:s.copy}>
      {finding.severity==='high'?'PHARMACIST REVIEW REQUIRED':finding.severity==='moderate'?'REVIEW REQUIRED':finding.severity==='low'?'INFORMATION':'UNKNOWN — NOT CLEARED'}
    </Text>
    <Text style={s.copy}>{finding.detail}</Text>
    <Text style={s.copy}>Source: {finding.source || 'RxCheck local interaction database'}.</Text>
   </View>)}
  </View>
  <View style={s.report}>
   <Text style={s.reportTitle}>Individual label findings</Text>
   {loading?<View style={s.row}><ActivityIndicator color="#0E6E63"/><Text style={s.copy}>Looking up official FDA product-label records…</Text></View>:null}
   {!loading&&!list.length?<Text style={s.copy}>No lookup was made because no medicine names were entered.</Text>:null}
   {!loading&&list.length>0?<Text style={s.copy}>Consolidated findings: {matched.length} matching individual label record(s); {notFoundCount} name(s) with no matching FDA label record (unknown result); {unavailableCount} unavailable lookup(s); {Math.max(0,list.length-8)} name(s) not queried because of the 8-name limit. These counts do not establish that a medicine combination is safe.</Text>:null}
   {!loading&&notFoundCount>0?<Text style={s.copy}>{notFoundCount} medicine name(s) had no matching FDA label record. This is an unknown result, not evidence that the medicine or combination is safe.</Text>:null}
   {!loading&&list.length>0?<View style={s.quickSummary}>
    <Text style={s.findingTitle}>Quick medicine report</Text>
    <Text style={s.copy}>{matched.length} FDA label match(es) · {notFoundCount} unknown name(s) · {unavailableCount} unavailable lookup(s) · {Math.max(0,list.length-8)} not queried.</Text>
    <Text style={s.copy}>A missing FDA label is an unknown result, not evidence of safety. Individual labels do not establish whether medicines interact.</Text>
    <Pressable style={s.next} onPress={()=>Linking.openURL('https://www.drugs.com/drug_interactions.html')}><Text style={s.nextText}>Check interactions ↗</Text></Pressable>
    <Text style={s.copy}>Opens the external Drugs.com interaction checker. Enter the complete medicine list there and review its result with a pharmacist or prescriber; RxCheck does not import or verify that result.</Text>
   </View>:null}
   {!loading&&unavailableCount>0?<Text style={s.copy}>FDA lookup could not be completed for {unavailableCount} medicine name(s), for example because the service was unavailable or rate-limited. Those names were not checked; retry later.</Text>:null}
   {!loading&&matched.map((item,i)=><View key={i} style={s.finding}>
    <Text style={s.findingTitle}>{item.medicine} — FDA label matched</Text>
    <Pressable onPress={()=>setExpandedLabels(old=>({...old,[item.medicine]:!old[item.medicine]}))}><Text style={s.detailsToggle}>{expandedLabels[item.medicine]?'Hide details':'View details'}</Text></Pressable>
    {expandedLabels[item.medicine]?<View style={s.detailsBox}>
      {item.interactions.length?item.interactions.map((t,j)=><Text key={j} numberOfLines={3} style={s.copy}>{t}</Text>):<Text style={s.copy}>No Drug Interactions section was returned in this matching label record. This does not rule out an interaction.</Text>}
      {item.warnings.map((t,j)=><Text key={'w'+j} numberOfLines={3} style={s.copy}>Label warning: {t}</Text>)}
    </View>:null}
   </View>)}
   {!loading&&hasInteractionText?<Text style={s.copy}>These are excerpts from individual product labels. They are not a validated pairwise interaction verdict.</Text>:null}
  </View>
  <View style={s.coverage}>
   <Text style={s.section}>SOURCE COVERAGE</Text>
   {list.length>8?<Text style={s.copy}>Only the first 8 of {list.length} entered medicine names were queried. The remaining {list.length-8} names were not looked up.</Text>:null}
   <Text style={s.copy}>• openFDA Drug Label API: queried live for up to 8 medicine names. Its data must not be relied on for medical-care decisions and are not a validated pairwise interaction check.</Text>
   <Text style={s.copy}>• FDA FDALabel: full-text labeling reference; no automated integration configured.</Text>
   <Text style={s.copy}>• Drugs.com and Medscape: no licensed checker API credentials/integration configured.</Text>
   <Text style={s.copy}>• Cyntegrity: no integration configured. Its visualizer is based on patterns in FDA adverse-event reports; those reports do not establish causation and are not a validated causal interaction checker.</Text>
  </View>
  <View style={s.warning}><Text style={s.warningTitle}>Clinical safety limitation</Text><Text style={s.copy}>This report does not claim that a medicine combination is safe. A no-match result is unknown, not evidence that the medicines are safe together. openFDA says its data must not be relied on for medical-care decisions. Drugs.com, Medscape, Cyntegrity and FDA FDALabel cannot be represented as checked because no supported, authorised connection is configured. Ask a pharmacist or prescriber to verify the complete regimen. Do not stop, change or substitute medicines based on this report.</Text></View>
  <Pressable style={s.next} onPress={()=>router.push({pathname:'/final-report',params:{meds:JSON.stringify(list),prescribed:JSON.stringify(prescribed),findings:JSON.stringify(interactionFindings)}})}><Text style={s.nextText}>Continue to Final Report →</Text></Pressable>
  {prescribed.length>0
    ?<Pressable style={s.next} onPress={()=>router.push({pathname:'/buy',params:{meds:JSON.stringify(prescribed)}})}><Text style={s.nextText}>Search prescribed medicines →</Text></Pressable>
    :<Text style={s.copy}>Medicine-store searches are available only for medicines entered under “Prescribed medicines.” Currently taken medicines are not sent to store search.</Text>}
  <Text style={s.foot}>Source: openFDA Drug Label API. Source lookup is limited as described above. Unavailable sources are not treated as checked.</Text>
 </ScrollView>;
}
const s=StyleSheet.create({page:{padding:22,paddingTop:48,gap:13},back:{color:'#0E6E63',fontWeight:'700'},title:{fontSize:27,fontWeight:'800',color:'#172B28'},copy:{fontSize:13,color:'#63716B',lineHeight:20},med:{fontSize:15,fontWeight:'700',color:'#1D332F'},section:{fontSize:11,fontWeight:'800',letterSpacing:1.3,color:'#0E6E63',marginBottom:8},card:{backgroundColor:'#FFF',borderWidth:1,borderColor:'#E0E7E1',borderRadius:10,padding:15,gap:7},report:{backgroundColor:'#FFF',borderRadius:10,padding:15,gap:12,borderWidth:1,borderColor:'#D9E5DF'},reportTitle:{fontSize:18,fontWeight:'800',color:'#1D332F'},row:{flexDirection:'row',gap:10,alignItems:'center'},finding:{borderTopWidth:1,borderTopColor:'#E7ECE8',paddingTop:10,gap:6},quickSummary:{backgroundColor:'#F2F7F3',padding:12,borderRadius:9,gap:7},findingTitle:{fontSize:14,fontWeight:'800',color:'#0E6E63'},detailsToggle:{fontSize:13,fontWeight:'900',color:'#0E6E63',paddingVertical:5},detailsBox:{backgroundColor:'#F6F9F6',padding:10,borderRadius:8,gap:6},pairUnknown:{fontSize:13,fontWeight:'800',color:'#8A5A13'},critical:{fontSize:13,fontWeight:'900',color:'#B42318'},altTitle:{fontSize:14,fontWeight:'800',color:'#1D332F',marginTop:4},coverage:{backgroundColor:'#F0F5F1',padding:15,borderRadius:10,gap:7},warning:{backgroundColor:'#FFF4DE',padding:15,borderRadius:10,gap:6},warningTitle:{fontWeight:'800',color:'#754B12'},next:{backgroundColor:'#0E6E63',padding:16,borderRadius:10,alignItems:'center',marginTop:10},nextText:{color:'#FFF',fontWeight:'800'},foot:{fontSize:12,color:'#7B8781',lineHeight:18,marginTop:8}});
