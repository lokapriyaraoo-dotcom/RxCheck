import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { Brand } from '../components/Brand';
export default function History(){return <View style={s.page}><Link href="/" style={s.back}>‹ Home</Link><Brand size={38} /><Text style={s.title}>Prescription history</Text><View style={s.card}><Text style={s.cardTitle}>No saved reviews yet</Text><Text style={s.copy}>This starter does not persist patient or prescription information. Local encrypted history and deletion controls must be designed before storing real health data.</Text></View></View>}
const s=StyleSheet.create({page:{padding:22,paddingTop:48,gap:18,flex:1},back:{color:'#0E6E63',fontWeight:'700'},title:{fontSize:30,fontWeight:'800',color:'#172B28'},card:{backgroundColor:'#FFF',padding:18,borderRadius:10,gap:8,borderColor:'#E0E7E1',borderWidth:1},cardTitle:{fontSize:17,fontWeight:'800',color:'#1D332F'},copy:{color:'#6C7973',lineHeight:21}});
