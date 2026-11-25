import { useMemo } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Brand } from '../components/Brand';
import { runClinicalWorkflow } from '../services/clinicalWorkflow';
import type { Medicine } from '../services/types';

function parse(value?:string):string[]{
  try{const v=JSON.parse(value||'[]');return Array.isArray(v)?v.filter((x):x is string=>typeof x==='string'&&x.trim().length>0):[];}
  catch{return[];}
}
function unique(values:string[]):string[]{
  const seen=new Set<string>();
  return values.filter(value=>{const key=value.trim().toLocaleLowerCase();if(!key||seen.has(key))return false;seen.add(key);return true;});
}
export default function Workspace(){
 const p=useLocalSearchParams<{meds?:string;prescribed?:string;taking?:string}>();
 const router=useRouter();
 const meds=useMemo(()=>unique([...parse(p.meds),...parse(p.taking)]),[p.meds,p.taking]);
 const prescribed=useMemo(()=>unique(parse(p.prescribed)),[p.prescribed]);
 const params={meds:JSON.stringify(meds),prescribed:JSON.stringify(prescribed),taking:p.taking||'[]'};
 const workflow=useMemo(()=>{
   const entries:Medicine[]=meds.map((name,index)=>({id:String(index),name,strength:'',dose:'',unit:'unknown',frequency:'',duration:'',instructions:'',needsReview:true}));
   return runClinicalWorkflow(entries);
 },[meds]);
 const findings=workflow.interactionFindings;
 const high=findings.filter(x=>x.severity==='high').length;
 const moderate=findings.filter(x=>x.severity==='moderate').length;
 const low=findings.filter(x=>x.severity==='low').length;
 const unknown=findings.filter(x=>x.severity==='unknown').length;
 const outcome=unknown>0?'UNKNOWN — PHARMACIST REVIEW REQUIRED':high>0?'HIGH-SEVERITY INTERACTION FOUND':moderate>0?'INTERACTION REVIEW REQUIRED':low>0?'INFORMATIONAL FINDINGS':'NO FINDINGS RETURNED';
 const outcomeColor=unknown>0||high>0?'#A12622':moderate>0?'#94600C':'#0E6E63';
 return <ScrollView contentContainerStyle={s.page}>
  <Link href="/" style={s.back}>‹ Home</Link><Brand size={38}/>
  <Text style={s.title}>Medicine review</Text>
  <Text style={s.copy}>Confirmed medicines and the final interaction assessment for this check.</Text>
  <View style={s.card}>
   <Text style={s.section}>MEDICINES IN THIS CHECK ({workflow.medicineCount})</Text>
   {meds.length?meds.map((m,i)=><Text key={i} style={s.med}>• {m}</Text>):<Text style={s.copy}>No medicine names were supplied. Return to prescription entry and add all prescribed and currently used medicines.</Text>}
  </View>
  <View style={s.outcome}>
   <Text style={s.section}>FINAL DRUG–DRUG INTERACTION OUTCOME</Text>
   <Text style={[s.outcomeTitle,{color:outcomeColor}]}>{meds.length<2?'CHECK INCOMPLETE':outcome}</Text>
   <Text style={s.copy}>{workflow.medicineCount} unique medicines · {workflow.pairCount} unique medicine pairs evaluated.</Text>
   <View style={s.counts}>
    <Text style={s.count}>High: {high}</Text><Text style={s.count}>Moderate: {moderate}</Text><Text style={s.count}>Informational: {low}</Text><Text style={s.count}>Unknown: {unknown}</Text>
   </View>
   {findings.map((finding,index)=><View key={index} style={s.finding}>
    <Text style={s.findingTitle}>{finding.title}</Text>
    <Text style={[s.severity,{color:finding.severity==='high'?'#B42318':finding.severity==='moderate'?'#94600C':finding.severity==='low'?'#0E6E63':'#68736D'}]}>
     {finding.severity==='high'?'HIGH':finding.severity==='moderate'?'MODERATE':finding.severity==='low'?'INFORMATIONAL':'UNKNOWN — NOT CLEARED'}
    </Text>
    <Text style={s.copy}>{finding.detail}</Text>
    {finding.source?<Text style={s.source}>Source: {finding.source}</Text>:null}
   </View>)}
   <Text style={s.disclaimer}>Unknown or unassessed does not mean safe. The bundled database currently has no pharmacist-reviewed pair records; therefore an unknown result cannot be cleared by this app.</Text>
   <Pressable style={s.button} onPress={()=>router.push({pathname:'/interactions',params})}><Text style={s.buttonText}>Generate Final Drug Safety Report →</Text></Pressable>
  </View>
  <View style={s.notice}><Text style={s.noticeTitle}>Important safety note</Text><Text style={s.copy}>This is an automated information aid, not clinical clearance. FDA individual medicine labels are shown separately and do not, by themselves, establish a drug–drug interaction. Ask a pharmacist or prescriber to review the complete regimen. Do not stop or change medicines based on this result.</Text></View>
 </ScrollView>;
}
const s=StyleSheet.create({
 page:{padding:22,paddingTop:18,paddingBottom:30,gap:14,backgroundColor:'#F4F7F3'},
 back:{color:'#0E6E63',fontWeight:'800'},title:{fontSize:28,fontWeight:'900',color:'#172B28'},copy:{fontSize:13,color:'#62716B',lineHeight:19},
 card:{backgroundColor:'#FFF',padding:15,borderRadius:12,gap:8,borderWidth:1,borderColor:'#E0E7E1'},
 section:{fontSize:11,fontWeight:'900',letterSpacing:1,color:'#0E6E63'},med:{fontSize:14,fontWeight:'700',color:'#263C36'},
 outcome:{backgroundColor:'#FFF',padding:15,borderRadius:12,borderWidth:1,borderColor:'#E0E7E1',gap:10},
 outcomeTitle:{fontSize:19,fontWeight:'900'},counts:{flexDirection:'row',flexWrap:'wrap',gap:8},count:{fontSize:11,fontWeight:'800',color:'#344640',backgroundColor:'#EDF1EE',padding:8,borderRadius:7,overflow:'hidden'},
 finding:{borderTopWidth:1,borderTopColor:'#E6ECE7',paddingTop:10,gap:5},findingTitle:{fontSize:14,fontWeight:'800',color:'#1D332F'},severity:{fontSize:11,fontWeight:'900',letterSpacing:.7},source:{fontSize:11,color:'#77837D'},disclaimer:{fontSize:12,lineHeight:18,color:'#754B12',backgroundColor:'#FFF2DC',padding:10,borderRadius:8},
 button:{backgroundColor:'#0E6E63',padding:14,borderRadius:9,alignItems:'center'},buttonText:{color:'#FFF',fontWeight:'900',textAlign:'center'},
 
 notice:{backgroundColor:'#FCE8E6',padding:14,borderRadius:11,gap:6},noticeTitle:{fontSize:14,fontWeight:'900',color:'#A12622'}
});
