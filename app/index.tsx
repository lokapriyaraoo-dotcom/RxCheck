import { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Animated, Easing } from 'react-native';
import { Link } from 'expo-router';

const teal = '#0E6E63';
function Action({ href, title, subtitle }: { href: '/scan' | '/manual' | '/history'; title: string; subtitle: string }) {
  return <Link href={href} asChild><Pressable style={s.action}><View style={{flex:1}}><Text style={s.actionTitle}>{title}</Text><Text style={s.sub}>{subtitle}</Text></View><Text style={s.arrow}>›</Text></Pressable></Link>;
}
function EcgAnimation() {
  const pulse = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 520, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.35, duration: 720, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [pulse]);
  return <View style={s.ecgCard}>
    <View style={s.ecgHeader}><Text style={s.ecgTitle}>ECG BREAKDOWN</Text><Text style={s.ecgTag}>HEART RHYTHM</Text></View>
    <Animated.View style={{opacity:pulse, transform:[{scaleY:pulse}]}}>
      <Text style={s.ecgLine}>━━━━━━━━╱╲━━━━╱╲╱╲━━━━━━━━</Text>
    </Animated.View>
    <Text style={s.ecgCaption}>A visual guide to understanding an ECG waveform</Text>
  </View>;
}
export default function Home() {
  return <ScrollView contentContainerStyle={s.page}>
    <Text style={s.kicker}>MEDICATION SAFETY • REVIEW TOOL</Text>
    <Text style={s.brand}>Rx/<Text style={{color:teal}}>Check</Text></Text>
    <Text style={s.lead}>A clearer second look at a prescription.</Text>
    <EcgAnimation />
    <View style={s.notice}><Text style={s.noticeTitle}>For review, not prescribing</Text><Text style={s.noticeText}>This prototype can help organise prescription details. Always verify OCR and discuss possible risks with a qualified clinician or pharmacist.</Text></View>
    <Text style={s.section}>GET STARTED</Text>
    <Action href="/scan" title="Prescription scanner" subtitle="Capture or choose a prescription image" />
    <Action href="/manual" title="Manual medicine entry" subtitle="Enter patient details and medicines yourself" />
    <Action href="/history" title="Prescription history" subtitle="Review saved local sessions" />
    <Text style={s.footer}>Your prescription image stays on this device in this starter. No cloud OCR is configured.</Text>
  </ScrollView>;
}
const s = StyleSheet.create({page:{padding:24,paddingTop:54,gap:18},kicker:{fontSize:11,letterSpacing:1.6,color:'#6B7771',fontWeight:'700'},brand:{fontSize:42,fontWeight:'800',color:'#172B28',letterSpacing:-1.5},lead:{fontSize:17,color:'#53635E',marginTop:-12},ecgCard:{backgroundColor:'#102E2A',borderRadius:12,padding:16,gap:9},ecgHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},ecgTitle:{fontSize:11,fontWeight:'800',letterSpacing:1.4,color:'#A7E6D8'},ecgTag:{fontSize:9,fontWeight:'700',color:'#75BDAE'},ecgLine:{fontSize:17,color:'#56D6B5',letterSpacing:-1,overflow:'hidden'},ecgCaption:{fontSize:11,color:'#C2D8D1'},notice:{backgroundColor:'#FFF4DE',borderLeftWidth:3,borderLeftColor:'#B7791F',padding:16,borderRadius:10,gap:5},noticeTitle:{fontWeight:'800',color:'#754B12'},noticeText:{color:'#745B36',lineHeight:20},section:{fontSize:11,fontWeight:'800',letterSpacing:1.4,color:'#6B7771',marginTop:8},action:{backgroundColor:'#FFFFFF',borderRadius:10,padding:18,flexDirection:'row',alignItems:'center',borderWidth:1,borderColor:'#E1E7E1',shadowColor:'#142B25',shadowOpacity:.04,shadowRadius:8,elevation:1},actionTitle:{fontSize:16,fontWeight:'800',color:'#1D332F'},sub:{fontSize:13,color:'#718079',marginTop:4},arrow:{fontSize:27,color:teal,marginLeft:12},footer:{fontSize:12,color:'#829089',lineHeight:18,marginTop:8}});
