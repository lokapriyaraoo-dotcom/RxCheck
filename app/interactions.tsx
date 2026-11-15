import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Brand } from '../components/Brand';

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
 return <ScrollView contentContainerStyle={s.page}>
  <Link href="/" style={s.back}>‹ Home</Link><Brand size={38}/>
  <Text style={s.title}>FDA medicine-label lookup</Text>
  <Text style={s.copy}>This page searches individual FDA product labels by medicine name. It is not a pairwise drug-interaction checker and does not assess dose, strength, timing or patient-specific risks. When you use this lookup, medicine names are sent to the public openFDA API; prescription images and patient details are not sent.</Text>
  <View style={s.card}><Text style={s.section}>MEDICINES ENTERED</Text>{list.length?list.map((m,i)=><Text key={i} style={s.med}>• {m}</Text>):<Text style={s.copy}>No medicine names were supplied. Return to patient details and add all prescribed and currently used medicines.</Text>}</View>
  <View style={s.report}>
   <Text style={s.reportTitle}>Individual label findings</Text>
   {loading?<View style={s.row}><ActivityIndicator color="#0E6E63"/><Text style={s.copy}>Looking up official FDA product-label records…</Text></View>:null}
   {!loading&&!list.length?<Text style={s.copy}>No lookup was made because no medicine names were entered.</Text>:null}
   {!loading&&list.length>0?<Text style={s.copy}>Consolidated findings: {matched.length} matching individual label record(s); {notFoundCount} name(s) with no matching FDA label record (unknown result); {unavailableCount} unavailable lookup(s); {Math.max(0,list.length-8)} name(s) not queried because of the 8-name limit. These counts do not establish that a medicine combination is safe.</Text>:null}
   {!loading&&notFoundCount>0?<Text style={s.copy}>{notFoundCount} medicine name(s) had no matching FDA label record. This is an unknown result, not evidence that the medicine or combination is safe.</Text>:null}
   {!loading&&unavailableCount>0?<Text style={s.copy}>FDA lookup could not be completed for {unavailableCount} medicine name(s), for example because the service was unavailable or rate-limited. Those names were not checked; retry later.</Text>:null}
   {!loading&&matched.map((item,i)=><View key={i} style={s.finding}>
    <Text style={s.findingTitle}>{item.medicine} — FDA label matched</Text>
    {item.interactions.length?item.interactions.map((t,j)=><Text key={j} style={s.copy}>{t}</Text>):<Text style={s.copy}>No Drug Interactions section was returned in this matching label record. This does not rule out an interaction.</Text>}
    {item.warnings.map((t,j)=><Text key={'w'+j} style={s.copy}>Label warning: {t}</Text>)}
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
  {prescribed.length>0
    ?<Pressable style={s.next} onPress={()=>router.push({pathname:'/buy',params:{meds:JSON.stringify(prescribed)}})}><Text style={s.nextText}>Search prescribed medicines →</Text></Pressable>
    :<Text style={s.copy}>Medicine-store searches are available only for medicines entered under “Prescribed medicines.” Currently taken medicines are not sent to store search.</Text>}
  <Text style={s.foot}>Source: openFDA Drug Label API. Source lookup is limited as described above. Unavailable sources are not treated as checked.</Text>
 </ScrollView>;
}
const s=StyleSheet.create({page:{padding:22,paddingTop:48,gap:13},back:{color:'#0E6E63',fontWeight:'700'},title:{fontSize:27,fontWeight:'800',color:'#172B28'},copy:{fontSize:13,color:'#63716B',lineHeight:20},med:{fontSize:15,fontWeight:'700',color:'#1D332F'},section:{fontSize:11,fontWeight:'800',letterSpacing:1.3,color:'#0E6E63',marginBottom:8},card:{backgroundColor:'#FFF',borderWidth:1,borderColor:'#E0E7E1',borderRadius:10,padding:15,gap:7},report:{backgroundColor:'#FFF',borderRadius:10,padding:15,gap:12,borderWidth:1,borderColor:'#D9E5DF'},reportTitle:{fontSize:18,fontWeight:'800',color:'#1D332F'},row:{flexDirection:'row',gap:10,alignItems:'center'},finding:{borderTopWidth:1,borderTopColor:'#E7ECE8',paddingTop:10,gap:6},findingTitle:{fontSize:14,fontWeight:'800',color:'#0E6E63'},coverage:{backgroundColor:'#F0F5F1',padding:15,borderRadius:10,gap:7},warning:{backgroundColor:'#FFF4DE',padding:15,borderRadius:10,gap:6},warningTitle:{fontWeight:'800',color:'#754B12'},next:{backgroundColor:'#0E6E63',padding:16,borderRadius:10,alignItems:'center',marginTop:10},nextText:{color:'#FFF',fontWeight:'800'},foot:{fontSize:12,color:'#7B8781',lineHeight:18,marginTop:8}});
