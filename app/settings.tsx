import Constants from 'expo-constants';
import { ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { Link } from 'expo-router';
import { Brand } from '../components/Brand';

export default function Settings(){
 const dark=useColorScheme()==='dark'; const bg=dark?'#101B19':'#F4F7F3'; const card=dark?'#1B2925':'#FFFFFF'; const ink=dark?'#F0F5F2':'#172B28'; const muted=dark?'#B1C0B9':'#62716B';
 return <ScrollView contentContainerStyle={[s.page,{backgroundColor:bg}]}>
  <Link href="/" style={s.back}>‹ Home</Link><Brand size={38}/><Text style={[s.title,{color:ink}]}>Settings & help</Text>
  <View style={[s.card,{backgroundColor:card}]}><Text style={[s.heading,{color:ink}]}>How RxCheck works</Text><Text style={[s.body,{color:muted}]}>1. Scan a prescription or enter details.{"\n"}2. Confirm every medicine and instruction.{"\n"}3. Review possible findings and unknowns.{"\n"}4. Share the report with a pharmacist or doctor.</Text></View>
  <View style={[s.card,{backgroundColor:card}]}><Text style={[s.heading,{color:ink}]}>App information</Text><Text style={[s.body,{color:muted}]}>Version {Constants.expoConfig?.version || 'Unknown'}</Text></View>
  <View style={[s.warning]}><Text style={s.warningTitle}>Emergency help</Text><Text style={s.body}>For severe symptoms, contact local emergency services immediately. Do not wait for an app review.</Text></View>
  <Text style={[s.body,{color:muted}]}>Full safety information: RxCheck is an informational aid, not a diagnosis or a substitute for professional medical advice. OCR and medicine databases can be incomplete or incorrect. Never treat an unknown or unassessed result as safe.</Text>
 </ScrollView>;
}
const s=StyleSheet.create({page:{padding:22,gap:15,flexGrow:1},back:{color:'#0E756A',fontWeight:'800'},title:{fontSize:28,fontWeight:'900'},card:{padding:16,borderRadius:12,gap:8,borderWidth:1,borderColor:'#DCE5DF'},heading:{fontSize:16,fontWeight:'900'},body:{fontSize:13,lineHeight:21},warning:{backgroundColor:'#FFF2DC',padding:15,borderRadius:12,gap:6},warningTitle:{fontSize:15,fontWeight:'900',color:'#754B12'}});
