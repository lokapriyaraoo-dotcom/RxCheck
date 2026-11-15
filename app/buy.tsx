import { useMemo } from 'react';
import { View,Text,Pressable,ScrollView,StyleSheet,Linking,Alert } from 'react-native';
import { Link,useLocalSearchParams } from 'expo-router';
import { Brand } from '../components/Brand';
export default function Buy(){
 const p=useLocalSearchParams<{meds?:string}>();
 const meds=useMemo(()=>{try{const parsed=JSON.parse(typeof p.meds==='string'?p.meds:'[]');return Array.isArray(parsed)?parsed.filter((x):x is string=>typeof x==='string'&&x.trim().length>0):[];}catch{return []; }},[p.meds]);
 const open=(url:string)=>Linking.openURL(url).catch(()=>Alert.alert('Unable to open link','Please try again.'));
 return <ScrollView contentContainerStyle={s.page}>
  <Link href="/" style={s.back}>‹ Home</Link><Brand size={38}/>
  <Text style={s.title}>Search prescribed medicines</Text>
  <Text style={s.copy}>These are external search links only. RxCheck does not confirm stock, price, seller, prescription validity or suitability. Verify the exact medicine, strength, form and prescription requirements with a pharmacist before ordering.</Text>
  {meds.length?meds.map((medicine,i)=><View key={medicine+'-'+i} style={s.card}>
    <Text style={s.med}>{medicine}</Text>
    <Pressable style={s.button} onPress={()=>open('https://www.1mg.com/search/all?name='+encodeURIComponent(medicine))}><Text style={s.buttonText}>Search on Tata 1mg ↗</Text></Pressable>
    <Pressable style={s.buttonAlt} onPress={()=>open('https://www.truemeds.in/search?search='+encodeURIComponent(medicine))}><Text style={s.buttonAltText}>Search on Truemeds ↗</Text></Pressable>
  </View>):<View style={s.card}><Text style={s.med}>No prescribed medicines were provided.</Text><Text style={s.copy}>Return to patient and medicine review, then add the exact prescribed medicine names.</Text></View>}
  <Text style={s.warning}>Do not purchase a suggested substitute or change a prescribed medicine based only on an interaction alert. Confirm any alternative with the prescribing doctor or pharmacist.</Text>
 </ScrollView>;
}
const s=StyleSheet.create({page:{padding:22,paddingTop:48,gap:15},back:{color:'#0E6E63',fontWeight:'700'},title:{fontSize:29,fontWeight:'800',color:'#172B28'},copy:{fontSize:13,color:'#63716B',lineHeight:20},card:{backgroundColor:'#FFF',borderWidth:1,borderColor:'#E0E7E1',borderRadius:10,padding:15,gap:9},med:{fontSize:16,fontWeight:'800',color:'#1D332F'},button:{backgroundColor:'#0E6E63',padding:16,borderRadius:10,alignItems:'center'},buttonText:{color:'#FFF',fontWeight:'800'},buttonAlt:{borderWidth:1,borderColor:'#0E6E63',padding:16,borderRadius:10,alignItems:'center'},buttonAltText:{color:'#0E6E63',fontWeight:'800'},warning:{backgroundColor:'#FFF4DE',padding:15,borderRadius:10,color:'#754B12',lineHeight:20}});
