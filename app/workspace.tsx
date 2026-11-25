import { useMemo } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import { Brand } from '../components/Brand';

function parse(value?:string):string[]{try{const v=JSON.parse(value||'[]');return Array.isArray(v)?v.filter((x):x is string=>typeof x==='string'):[]}catch{return[]}}
export default function Workspace(){
 const p=useLocalSearchParams<{meds?:string;prescribed?:string;taking?:string}>();
 const meds=useMemo(()=>[...new Set([...parse(p.meds),...parse(p.taking)])],[p.meds,p.taking]);
 const prescribed=useMemo(()=>parse(p.prescribed),[p.prescribed]);
 const params={meds:JSON.stringify(meds),prescribed:JSON.stringify(prescribed),taking:p.taking||'[]'};
 const cards=[
  {href:'/interactions' as const,title:'Review possible interactions',detail:'Review medicine pairs and individual FDA label findings.'},
  {href:'/safety' as const,title:'Smart safety report',detail:'Review allergies, pregnancy, kidney/liver and other safety factors.'},
  {href:'/final-report' as const,title:'Prepare professional review report',detail:'Create a concise summary and export it as PDF.'},
  {href:'/buy' as const,title:'Find medicines',detail:'Search pharmacy listings for prescribed medicines.'},
  {href:'/buy' as const,title:'Verify pharmacy products',detail:'Compare salt, strength, dosage form and release type with a pharmacist.'},
  {href:'/history' as const,title:'Check history',detail:'View saved checks on this device.'}
 ];
 const completed=0;
 return <ScrollView contentContainerStyle={s.page}>
  <Link href="/" style={s.back}>‹ Home</Link><Brand size={38}/>
  <Text style={s.title}>Prescription workspace</Text>
  <Text style={s.copy}>Your confirmed medicine list is shared across the review tools. Editing medicines requires the review to be repeated.</Text>
  <View style={s.progressCard}><View style={s.progressTop}><Text style={s.progressLabel}>REVIEW PROGRESS</Text><Text style={s.progressCount}>{completed} of 6 steps done</Text></View><View style={s.track}><View style={[s.fill,{width:(completed/6*100)+'%'}]}/></View><Text style={s.progressHint}>Steps remain incomplete until their results are available and reviewed.</Text></View>
  <View style={s.card}><Text style={s.section}>MEDICINES IN THIS CHECK ({meds.length})</Text>{meds.length?meds.map((m,i)=><Text key={i} style={s.med}>• {m}</Text>):<Text style={s.copy}>No medicine names were supplied.</Text>}</View>
  {cards.map((card,i)=><Link key={card.title} href={{pathname:card.href,params}} asChild><Pressable style={s.tile}><View style={s.tileTop}><Text style={s.tileTitle}>{i+1}. {card.title}</Text><Text style={s.badge}>Not started</Text></View><Text style={s.copy}>{card.detail}</Text></Pressable></Link>)}
  <View style={s.warning}><Text style={s.warningTitle}>Medicine safety notice</Text><Text style={s.copy}>RxCheck does not currently have a validated pairwise interaction database; unknown or unchecked results are not safe results. Ask a pharmacist or clinician before acting on any finding.</Text></View>
 </ScrollView>
}
const s=StyleSheet.create({page:{padding:22,paddingTop:18,paddingBottom:28,gap:13,backgroundColor:'#F4F7F3'},back:{color:'#0E6E63',fontWeight:'800'},title:{fontSize:28,fontWeight:'900',color:'#172B28'},copy:{fontSize:13,color:'#62716B',lineHeight:19},progressCard:{backgroundColor:'#FFF',padding:14,borderRadius:12,borderWidth:1,borderColor:'#E0E7E1',gap:8},progressTop:{flexDirection:'row',justifyContent:'space-between',gap:8},progressLabel:{fontSize:10,fontWeight:'900',letterSpacing:1,color:'#0E6E63'},progressCount:{fontSize:11,fontWeight:'800',color:'#52645D'},track:{height:7,backgroundColor:'#E6ECE7',borderRadius:9,overflow:'hidden'},fill:{height:7,backgroundColor:'#0E756A',borderRadius:9},progressHint:{fontSize:11,color:'#748078'},card:{backgroundColor:'#FFF',padding:15,borderRadius:12,gap:8,borderWidth:1,borderColor:'#E0E7E1'},section:{fontSize:11,fontWeight:'900',letterSpacing:1,color:'#0E6E63'},med:{fontSize:14,fontWeight:'700',color:'#263C36'},tile:{backgroundColor:'#FFF',padding:15,borderRadius:12,borderWidth:1,borderColor:'#E0E7E1',gap:7},tileTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:8},tileTitle:{flex:1,fontSize:15,fontWeight:'900',color:'#1D332F'},badge:{fontSize:10,fontWeight:'800',color:'#59645E',backgroundColor:'#EDF0ED',padding:6,borderRadius:7,overflow:'hidden'},warning:{backgroundColor:'#FCE8E6',padding:14,borderRadius:11,gap:6},warningTitle:{fontSize:14,fontWeight:'900',color:'#A12622'}});
