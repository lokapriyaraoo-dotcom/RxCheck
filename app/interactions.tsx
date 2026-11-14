import { useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Linking, Alert } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import { Brand } from '../components/Brand';

function External({title,detail,url}:{title:string;detail:string;url:string}) {
  return <Pressable style={s.card} onPress={()=>Linking.openURL(url).catch(()=>Alert.alert('Unable to open link','Please try again.'))}>
    <Text style={s.cardTitle}>{title} ↗</Text><Text style={s.copy}>{detail}</Text>
  </Pressable>;
}
export default function Interactions() {
  const params=useLocalSearchParams<{meds?:string}>();
  const medicines=useMemo(()=>{try{return JSON.parse(typeof params.meds==='string'?params.meds:'[]') as string[]}catch{return []}},[params.meds]);
  const list=medicines.filter(Boolean);
  const query=encodeURIComponent(list.join(' '));
  const pairQuery=encodeURIComponent(list.join(', '));
  return <ScrollView contentContainerStyle={s.page}>
    <Link href="/" style={s.back}>‹ Home</Link><Brand size={38}/>
    <Text style={s.title}>Drug interaction report</Text>
    <Text style={s.copy}>Medicines to check (confirm these against the prescription and add every medicine currently taken, including OTC products, vitamins and supplements):</Text>
    {list.length?list.map((m,i)=><Text key={i} style={s.med}>• {m}</Text>):<Text style={s.warning}>No medicine names were passed to this report. Return and add the exact medicine names.</Text>}
    <View style={s.warning}><Text style={s.warningTitle}>Important safety limitation</Text><Text style={s.copy}>This app does not have licensed access to the clinical interaction databases behind these checkers. Open each checker to review the complete regimen. Do not treat missing results as proof of safety. If a checker reports contraindicated or serious interactions, contact the prescriber or pharmacist promptly; do not stop, ignore, or substitute a medicine yourself.</Text></View>
    <Text style={s.section}>INTERACTION CHECKERS</Text>
    <External title="Drugs.com Interaction Checker" detail="Check prescription medicines, OTC products and supplements together." url={'https://www.drugs.com/drug_interactions.html'}/>
    <External title="Medscape Drug Interaction Checker" detail="Includes categories such as contraindicated, serious/use alternative and monitor closely." url={'https://reference.medscape.com/drug-interactionchecker'}/>
    <External title="Cyntegrity Drug Interaction Visualizer" detail="Explores adverse-event patterns from FDA reports; these are signals, not proof that one drug caused an event." url={'https://cyntegrity.com/drug-interaction-visualizer/'}/>
    <Text style={s.section}>FDA LABEL & SAFETY EVIDENCE</Text>
    <External title="openFDA drug label search" detail="Search official submitted labeling, including the Drug Interactions section. FDA warns not to use this data alone for medical-care decisions." url={'https://open.fda.gov/apis/drug/label/'}/>
    <External title="FDA FDALabel" detail="Search full-text drug product labeling, including warnings and drug-interaction sections." url={'https://www.fda.gov/science-research/bioinformatics-tools/fdalabel-full-text-search-drug-product-labeling'}/>
    <External title="FDA Drug Interactions & Labeling" detail="FDA regulatory resources and guidance on drug-interaction assessment and labeling." url={'https://www.fda.gov/drugs/development-resources/drug-interactions-labeling'}/>
    <Text style={s.section}>BUY PRESCRIBED MEDICINES</Text>
    <Text style={s.copy}>These links search the medicine names above. Confirm the exact brand, strength, dosage form and pack size; buy only what the prescriber has approved.</Text>
    <External title="Tata 1mg — search these medicines" detail="Open Tata 1mg search results." url={'https://www.1mg.com/search/all?name='+query}/>
    <External title="Truemeds — search these medicines" detail="Open Truemeds search results." url={'https://www.truemeds.in/search?search='+query}/>
    <Text style={s.foot}>“FDA source” means the information is drawn from FDA labeling or safety-report datasets. It is not an FDA approval certificate for this prescription, a drug combination, or a substitute.</Text>
  </ScrollView>;
}
const s=StyleSheet.create({page:{padding:22,paddingTop:48,gap:13},back:{color:'#0E6E63',fontWeight:'700'},title:{fontSize:29,fontWeight:'800',color:'#172B28'},copy:{fontSize:13,color:'#63716B',lineHeight:20},med:{fontSize:15,fontWeight:'700',color:'#1D332F'},warning:{backgroundColor:'#FFF4DE',padding:15,borderRadius:10,gap:6},warningTitle:{fontWeight:'800',color:'#754B12'},section:{fontSize:11,fontWeight:'800',letterSpacing:1.3,color:'#0E6E63',marginTop:12},card:{backgroundColor:'#FFF',borderWidth:1,borderColor:'#E0E7E1',borderRadius:10,padding:15,gap:5},cardTitle:{fontSize:15,fontWeight:'800',color:'#0E6E63'},foot:{fontSize:12,color:'#7B8781',lineHeight:18,marginTop:8}});
