import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Link } from 'expo-router';

export default function Home() {
 return <ScrollView contentContainerStyle={s.page}>
  <View style={s.brand}><Text style={s.logo}>Rx<Text style={{color:'#0E6E63'}}>Check</Text></Text><Text style={s.tag}>MEDICINE REVIEW WORKSPACE</Text></View>
  <View style={s.hero}><Text style={s.kicker}>YOUR MEDICINES, ORGANISED</Text><Text style={s.title}>Start a prescription review</Text><Text style={s.copy}>Scan a prescription or enter medicine details manually. You can review the results before continuing.</Text></View>
  <Link href="/scan" asChild><Pressable style={s.primary}><Text style={s.primaryText}>▧  Scan prescription</Text></Pressable></Link>
  <Link href="/manual" asChild><Pressable style={s.secondary}><Text style={s.secondaryText}>✎  Enter manually</Text></Pressable></Link>
  <View style={s.notice}><Text style={s.noticeTitle}>Important safety information</Text><Text style={s.copy}>RxCheck is an informational review aid, not a diagnosis or a substitute for a doctor or pharmacist. OCR can make mistakes. Confirm every medicine and instruction against the original prescription. A missing label match is UNKNOWN, not evidence of safety. Do not change treatment based only on this app.</Text></View>
 </ScrollView>;
}
const s=StyleSheet.create({page:{flexGrow:1,padding:24,paddingTop:58,gap:18,backgroundColor:'#F4F7F3'},brand:{gap:3},logo:{fontSize:31,fontWeight:'900',color:'#172B28',letterSpacing:-1},tag:{fontSize:10,fontWeight:'900',letterSpacing:1.5,color:'#718079'},hero:{backgroundColor:'#103F3A',padding:22,borderRadius:20,gap:10,marginTop:18},kicker:{fontSize:10,fontWeight:'900',letterSpacing:1.3,color:'#BDE7D9'},title:{fontSize:27,fontWeight:'900',color:'#FFF'},copy:{fontSize:13,lineHeight:20,color:'#D3E4DD'},primary:{backgroundColor:'#0E6E63',padding:18,borderRadius:12,alignItems:'center'},primaryText:{color:'#FFF',fontSize:16,fontWeight:'900'},secondary:{backgroundColor:'#FFF',padding:18,borderRadius:12,alignItems:'center',borderWidth:1,borderColor:'#0E6E63'},secondaryText:{color:'#0E6E63',fontSize:16,fontWeight:'900'},notice:{backgroundColor:'#FFF2DC',padding:15,borderRadius:12,gap:7,marginTop:10},noticeTitle:{fontSize:14,fontWeight:'900',color:'#754B12'}});
