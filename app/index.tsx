import { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Animated, Easing } from 'react-native';
import { Link } from 'expo-router';
import { Brand } from '../components/Brand';

const teal = '#0E6E63';
const ECG_BEAT_WIDTH = 180;
const ECG_TRACE_WIDTH = ECG_BEAT_WIDTH * 3;
const ECG_HEIGHT = 84;
const ECG_TEMPLATE = [
  {x:0,y:42},{x:15,y:42},{x:22,y:38},{x:30,y:42},{x:50,y:42},
  {x:62,y:52},{x:70,y:9},{x:78,y:73},{x:88,y:42},{x:118,y:42},
  {x:136,y:34},{x:150,y:42},{x:180,y:42},
];
function ecgY(x:number) {
  const beatX=x%ECG_BEAT_WIDTH;
  for(let i=0;i<ECG_TEMPLATE.length-1;i++){
    const a=ECG_TEMPLATE[i],b=ECG_TEMPLATE[i+1];
    if(beatX>=a.x&&beatX<=b.x){
      const ratio=(beatX-a.x)/(b.x-a.x);
      return a.y+(b.y-a.y)*ratio;
    }
  }
  return 42;
}
const ECG_POINTS=Array.from({length:ECG_TRACE_WIDTH/5+1},(_,i)=>({x:i*5,y:ecgY(i*5)}));
const ECG_SEGMENTS=ECG_POINTS.slice(0,-1).map((a,i)=>{
  const b=ECG_POINTS[i+1],dx=b.x-a.x,dy=b.y-a.y;
  return {key:i,left:a.x,top:(a.y+b.y)/2,width:Math.hypot(dx,dy),angle:Math.atan2(dy,dx)};
});
function EcgMonitor() {
  const offset=useRef(new Animated.Value(0)).current;
  useEffect(()=>{
    const animation=Animated.loop(Animated.timing(offset,{toValue:1,duration:2400,easing:Easing.linear,useNativeDriver:true}));
    animation.start();
    return ()=>animation.stop();
  },[offset]);
  const translateX=offset.interpolate({inputRange:[0,1],outputRange:[0,-ECG_BEAT_WIDTH]});
  return <View style={s.ecgCard}>
    <View style={s.ecgHeader}>
      <Text style={s.ecgTitle}>LIVE ECG DISPLAY</Text>
      <Text style={s.ecgTag}>DEMO SIGNAL</Text>
    </View>
    <View style={s.ecgViewport}>
      <View style={s.ecgGrid}>
        {Array.from({length:10},(_,i)=><View key={'v'+i} style={[s.gridVertical,{left:i*34}]}/>)}
        {Array.from({length:4},(_,i)=><View key={'h'+i} style={[s.gridHorizontal,{top:i*22}]}/>)}
      </View>
      <Animated.View style={{width:ECG_TRACE_WIDTH,height:ECG_HEIGHT,transform:[{translateX}]}}>
        {ECG_SEGMENTS.map(segment=><View key={segment.key} style={{position:'absolute',left:segment.left,top:segment.top,width:segment.width,height:2,borderRadius:2,backgroundColor:'#56D6B5',transform:[{rotate:segment.angle+'rad'}]}}/>)}
      </Animated.View>
    </View>
    <Text style={s.ecgCaption}>Simulated moving ECG waveform for display preview. No live patient ECG or sensor is connected.</Text>
  </View>;
}
export default function Home() {
  return <ScrollView contentContainerStyle={s.page}>
    <Text style={s.kicker}>MEDICATION SAFETY • REVIEW TOOL</Text>
    <Brand size={62} />
    <Text style={s.lead}>A clearer second look at a prescription.</Text>
    <EcgMonitor />
    <View style={s.notice}><Text style={s.noticeTitle}>For review, not prescribing</Text><Text style={s.noticeText}>This prototype can help organise prescription details. Always verify OCR and discuss possible risks with a qualified clinician or pharmacist.</Text></View>
    <Text style={s.section}>GET STARTED</Text>
    <Action href="/scan" title="Prescription scanner" subtitle="Capture or choose a prescription image" />
    <Action href="/manual" title="Manual medicine entry" subtitle="Enter patient details and medicines yourself" />
    <Action href="/history" title="Prescription history" subtitle="Review saved local sessions" />
    <Text style={s.footer}>Connect a compatible ECG device and validated data feed before displaying a real patient recording.</Text>
  </ScrollView>;
}
function Action({ href, title, subtitle }: { href: '/scan' | '/manual' | '/history'; title: string; subtitle: string }) {
  return <Link href={href} asChild><Pressable style={s.action}><View style={{flex:1}}><Text style={s.actionTitle}>{title}</Text><Text style={s.sub}>{subtitle}</Text></View><Text style={s.arrow}>›</Text></Pressable></Link>;
}
const s = StyleSheet.create({
  page:{padding:24,paddingTop:54,gap:18},kicker:{fontSize:11,letterSpacing:1.6,color:'#6B7771',fontWeight:'700'},
  lead:{fontSize:17,color:'#53635E',marginTop:-12},
  ecgCard:{backgroundColor:'#102E2A',borderRadius:12,padding:16,gap:9},
  ecgHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  ecgTitle:{fontSize:11,fontWeight:'800',letterSpacing:1.4,color:'#A7E6D8'},
  ecgTag:{fontSize:9,fontWeight:'800',color:'#75BDAE',letterSpacing:1},
  ecgViewport:{height:ECG_HEIGHT,overflow:'hidden',borderRadius:7,backgroundColor:'#0C2623'},
  ecgGrid:{...StyleSheet.absoluteFillObject},
  gridVertical:{position:'absolute',top:0,bottom:0,width:1,backgroundColor:'#1B4942'},
  gridHorizontal:{position:'absolute',left:0,right:0,height:1,backgroundColor:'#1B4942'},
  ecgCaption:{fontSize:11,color:'#C2D8D1',lineHeight:16},
  notice:{backgroundColor:'#FFF4DE',borderLeftWidth:3,borderLeftColor:'#B7791F',padding:16,borderRadius:10,gap:5},
  noticeTitle:{fontWeight:'800',color:'#754B12'},noticeText:{color:'#745B36',lineHeight:20},
  section:{fontSize:11,fontWeight:'800',letterSpacing:1.4,color:'#6B7771',marginTop:8},
  action:{backgroundColor:'#FFFFFF',borderRadius:10,padding:18,flexDirection:'row',alignItems:'center',borderWidth:1,borderColor:'#E1E7E1',shadowColor:'#142B25',shadowOpacity:.04,shadowRadius:8,elevation:1},
  actionTitle:{fontSize:16,fontWeight:'800',color:'#1D332F'},sub:{fontSize:13,color:'#718079',marginTop:4},
  arrow:{fontSize:27,color:teal,marginLeft:12},footer:{fontSize:12,color:'#829089',lineHeight:18,marginTop:8}
});
