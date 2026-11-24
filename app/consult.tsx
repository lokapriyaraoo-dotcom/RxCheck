import { ScrollView, View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Link } from 'expo-router';

const providers = [
 {name:'Practo',detail:'Find doctors and explore online consultations.',url:'https://www.practo.com/consult'},
 {name:'Apollo 24|7',detail:'Explore doctor appointments and online care.',url:'https://www.apollo247.com/specialties'},
];
const specialties=['General Physician','Cardiologist','Endocrinologist','Dermatologist','Paediatrician','Psychiatrist'];
export default function Consult(){
 const open=async(url:string)=>{try{await WebBrowser.openBrowserAsync(url,{presentationStyle:WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,showTitle:true});}catch{Alert.alert('Unable to open link','Please try again or open the provider website in your browser.');}};
 return <View style={s.screen}><ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false}>
  <Link href="/" style={s.back}>‹  Back to home</Link>
  <Text style={s.eyebrow}>PROFESSIONAL SUPPORT</Text><Text style={s.title}>Talk to a doctor</Text>
  <Text style={s.intro}>Choose a consultation provider to find a qualified healthcare professional. Check the doctor's registration, specialty, fees and availability before booking.</Text>
  <View style={s.report}><Text style={s.reportIcon}>▤</Text><View style={s.reportCopy}><Text style={s.reportTitle}>Take your RxCheck findings with you</Text><Text style={s.reportText}>Keep your prescription and medicine list ready. Share interaction or safety findings with the doctor and ask them to verify the details.</Text></View></View>
  <Text style={s.section}>Consultation platforms</Text>
  {providers.map(p=><Pressable key={p.name} style={s.provider} onPress={()=>open(p.url)}><View style={s.providerMark}><Text style={s.providerMarkText}>{p.name==='Practo'?'P':'A'}</Text></View><View style={s.providerCopy}><Text style={s.providerName}>{p.name}</Text><Text style={s.providerDetail}>{p.detail}</Text><Text style={s.providerLink}>Open provider website ↗</Text></View><Text style={s.chevron}>›</Text></Pressable>)}
  <Text style={s.section}>Find the right specialist</Text><View style={s.specialties}>{specialties.map(item=><View key={item} style={s.specialty}><Text style={s.specialtyText}>{item}</Text></View>)}</View>
  <View style={s.caution}><Text style={s.cautionTitle}>Important</Text><Text style={s.cautionText}>RxCheck does not currently book appointments, host video calls or send health records to providers. The links open external provider services inside the app. You choose what information to share. In an emergency, contact local emergency services rather than waiting for an online appointment.</Text></View>
  <Text style={s.footer}>Doctor consultation is provided by the linked service, not by RxCheck.</Text>
 </ScrollView></View>;
}
const s=StyleSheet.create({
 screen:{flex:1,backgroundColor:'#F4F7F4'},page:{padding:20,paddingTop:18,paddingBottom:36,gap:16},back:{fontSize:14,fontWeight:'700',color:'#087E72',marginBottom:5},eyebrow:{fontSize:10,fontWeight:'900',letterSpacing:1.6,color:'#087E72'},title:{fontSize:30,fontWeight:'900',letterSpacing:-.7,color:'#102F2C',marginTop:-10},intro:{fontSize:14,lineHeight:22,color:'#61736E',marginTop:-8},report:{flexDirection:'row',gap:12,backgroundColor:'#E6F1EB',borderRadius:17,padding:15,marginTop:2},reportIcon:{fontSize:24,color:'#087E72'},reportCopy:{flex:1,gap:5},reportTitle:{fontSize:15,fontWeight:'900',color:'#102F2C'},reportText:{fontSize:12,lineHeight:18,color:'#526E65'},section:{fontSize:18,fontWeight:'900',color:'#102F2C',marginTop:5},provider:{flexDirection:'row',alignItems:'center',backgroundColor:'#FFF',borderRadius:16,borderWidth:1,borderColor:'#E5ECE7',padding:14,gap:12},providerMark:{width:43,height:43,borderRadius:14,backgroundColor:'#EAF4EF',alignItems:'center',justifyContent:'center'},providerMarkText:{fontSize:20,fontWeight:'900',color:'#087E72'},providerCopy:{flex:1,gap:4},providerName:{fontSize:16,fontWeight:'900',color:'#102F2C'},providerDetail:{fontSize:12,lineHeight:17,color:'#61736E'},providerLink:{fontSize:12,fontWeight:'800',color:'#087E72',marginTop:3},chevron:{fontSize:24,color:'#8BA49B'},specialties:{flexDirection:'row',flexWrap:'wrap',gap:8},specialty:{backgroundColor:'#FFF',borderWidth:1,borderColor:'#E1EAE4',paddingHorizontal:12,paddingVertical:10,borderRadius:20},specialtyText:{fontSize:12,fontWeight:'700',color:'#315C51'},caution:{backgroundColor:'#F0F1EB',padding:15,borderRadius:15,gap:6,marginTop:4},cautionTitle:{fontSize:14,fontWeight:'900',color:'#334B40'},cautionText:{fontSize:12,lineHeight:19,color:'#68766F'},footer:{fontSize:10,lineHeight:16,color:'#89978F',textAlign:'center',marginTop:2}
});