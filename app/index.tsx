import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Animated, Easing } from 'react-native';
import { Link } from 'expo-router';
import { Brand } from '../components/Brand';

const teal = '#117568';
const ECG_BEAT_WIDTH = 180;
const ECG_HEIGHT = 84;
const ECG_SCALE = 0.8;
const ECG_TEMPLATE = [
  {x:0,y:42},{x:12,y:42},{x:19,y:38},{x:27,y:42},{x:43,y:42},
  {x:49,y:47},{x:55,y:9},{x:62,y:72},{x:69,y:42},{x:96,y:42},
  {x:108,y:35},{x:119,y:31},{x:131,y:34},{x:143,y:42},{x:180,y:42},
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
function PaperBanner() {
  return <View style={s.banner}>
    <View style={s.paper}>
      {Array.from({length:7},(_,i)=><View key={i} style={[s.paperRule,{top:20+i*16}]}/>)}
      <View style={s.handwriting}>
        {[0,1,2,3].map(i=><View key={i} style={[s.inkStroke,{top:i*13,width:72+(i%2)*24,transform:[{rotate:(i%2?'-':'')+'7deg'}]}]}/>)}
      </View>
    </View>
    <View style={s.paperCorner}/>
    <View style={s.pen}><View style={s.penTip}/></View>
    <View style={s.fabric}/>
  </View>;
}

function EcgMonitor() {
  const progress=useRef(new Animated.Value(0)).current;
  const [width,setWidth]=useState(0);
  useEffect(()=>{
    const animation=Animated.loop(Animated.timing(progress,{
      toValue:1,
      duration:1800,
      easing:Easing.linear,
      useNativeDriver:true,
    }));
    animation.start();
    return ()=>animation.stop();
  },[progress]);

  const beatPixels=ECG_BEAT_WIDTH*ECG_SCALE;
  const traceWidth=width/ECG_SCALE+ECG_BEAT_WIDTH;
  const segments=useMemo(()=>{
    if(width<=0)return [];
    const points=Array.from({length:Math.ceil(traceWidth/3)+1},(_,i)=>{
      const x=i*3;
      return {x:x*ECG_SCALE,y:ecgY(x)};
    });
    return points.slice(0,-1).map((a,i)=>{
      const b=points[i+1],dx=b.x-a.x,dy=b.y-a.y;
      return {
        key:i,
        left:a.x,
        top:(a.y+b.y)/2,
        width:Math.hypot(dx,dy),
        angle:Math.atan2(dy,dx),
      };
    });
  },[traceWidth,width]);

  const scrollX=progress.interpolate({
    inputRange:[0,1],
    outputRange:[0,-beatPixels],
  });

  return <View style={s.ecgCard}>
    <View style={s.ecgViewport} onLayout={event=>setWidth(event.nativeEvent.layout.width)}>
      <View style={s.ecgGrid}>
        {Array.from({length:19},(_,i)=><View key={'v'+i} style={[s.ecgVertical,{left:i*17}]}/>)}
        {Array.from({length:6},(_,i)=><View key={'h'+i} style={[s.ecgHorizontal,{top:i*14}]}/>)}
      </View>
      {width>0?<Animated.View style={[s.ecgTrace,{width:width+beatPixels,transform:[{translateX:scrollX}]}]}>
        {segments.map(segment=><View key={segment.key} style={{position:'absolute',left:segment.left,top:segment.top,width:segment.width,height:2.5,borderRadius:2,backgroundColor:'#16796C',transform:[{rotate:segment.angle+'rad'}]}}/>)}
      </Animated.View>:null}
      <View pointerEvents="none" style={s.ecgCursor}/>
    </View>
  </View>;
}

export default function Home() {
  return <View style={s.screen}>
    <View pointerEvents="none" style={s.backgroundGrid}>
      {Array.from({length:30},(_,i)=><View key={'bgv'+i} style={[s.bgVertical,{left:i*34}]}/>)}
      {Array.from({length:70},(_,i)=><View key={'bgh'+i} style={[s.bgHorizontal,{top:i*34}]}/>)}
    </View>
    <ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false}>
      <PaperBanner />
      <View style={s.kickerRow}><View style={s.kickerDot}/><Text style={s.kicker}>READ THE SLIP ON THIS DEVICE</Text></View>
      <Text style={s.title}>Organise prescription details for pharmacist review.</Text>
      <Text style={s.intro}>Scan a prescription to extract possible text on this device. Printed-text OCR and experimental handwriting OCR can miss or misread medicine names and doses, so check every field against the original. You can also enter details manually. This prototype does not save patient records.</Text>
      <EcgMonitor />
      <Action href="/scan" icon="camera" title="Scan the prescription" subtitle="Read a prescription image on this device. Review and correct any extracted details manually." />
      <Action href="/manual" icon="keyboard" title="Enter details yourself" subtitle="Enter patient and medicine details manually. You can read a prescription image to help fill the form." />
      <View style={s.savedCard}>
        <Text style={s.savedTitle}>Saved checks</Text>
        <Text style={s.savedText}>No reviews are saved. This prototype does not store patient or prescription history.</Text>
        <Link href="/history" style={s.savedLink}>View saved checks  ›</Link>
      </View>
      <Text style={s.footer}>RxCheck is a review aid, not a substitute for a pharmacist or clinician. Verify every extracted medicine and dose against the original prescription.</Text>
    </ScrollView>
  </View>;
}

function Action({ href, icon, title, subtitle }: { href: '/scan' | '/manual'; icon: 'camera' | 'keyboard'; title: string; subtitle: string }) {
  return <Link href={href} asChild><Pressable style={s.action}>
    <Text style={s.actionIcon}>{icon==='camera'?'▣':'▦'}</Text>
    <Text style={s.actionTitle}>{title}</Text>
    <Text style={s.actionText}>{subtitle}</Text>
  </Pressable></Link>;
}

const s = StyleSheet.create({
  screen:{flex:1,backgroundColor:'#F3F6F1'},
  backgroundGrid:{...StyleSheet.absoluteFillObject,overflow:'hidden'},
  bgVertical:{position:'absolute',top:0,bottom:0,width:1,backgroundColor:'#DFE8E1'},
  bgHorizontal:{position:'absolute',left:0,right:0,height:1,backgroundColor:'#DFE8E1'},
  page:{paddingHorizontal:22,paddingTop:12,paddingBottom:36,gap:18},
  banner:{height:132,borderRadius:15,overflow:'hidden',backgroundColor:'#E9E5D9',marginBottom:3,justifyContent:'center'},
  paper:{position:'absolute',left:55,right:42,top:-22,bottom:-18,backgroundColor:'#F8F5E9',transform:[{rotate:'-5deg'}],borderRadius:5,borderWidth:1,borderColor:'#D9D2C2'},
  paperRule:{position:'absolute',left:0,right:0,height:1,backgroundColor:'#E4DCCB'},
  handwriting:{position:'absolute',right:42,top:35,width:130,height:70,transform:[{rotate:'-3deg'}]},
  inkStroke:{position:'absolute',right:0,height:2,backgroundColor:'#77786F',borderRadius:3,opacity:.65},
  paperCorner:{position:'absolute',right:38,top:0,width:30,height:30,backgroundColor:'#E4DFD1',borderBottomLeftRadius:22,opacity:.9},
  pen:{position:'absolute',right:58,top:-12,width:13,height:150,backgroundColor:'#176F68',borderRadius:7,transform:[{rotate:'-25deg'}],borderWidth:1,borderColor:'#0E5B55'},
  penTip:{position:'absolute',bottom:-6,left:3,width:7,height:12,backgroundColor:'#C2B9A5',borderBottomLeftRadius:5,borderBottomRightRadius:5},
  fabric:{position:'absolute',left:-20,bottom:-30,width:105,height:95,backgroundColor:'#F5F2E9',borderRadius:45,opacity:.9},
  kickerRow:{flexDirection:'row',alignItems:'center',gap:10,marginTop:2},
  kickerDot:{width:9,height:9,borderRadius:5,backgroundColor:teal},
  kicker:{fontSize:12,letterSpacing:2.1,color:'#286F65',fontWeight:'700'},
  title:{fontSize:27,lineHeight:34,fontWeight:'900',letterSpacing:-.5,color:'#172B27',marginTop:-2},
  intro:{fontSize:16,lineHeight:25,color:'#52645D',marginTop:-2},
  ecgCard:{height:102,backgroundColor:'#F7F3E9',borderRadius:17,borderWidth:1,borderColor:'#E0DCCE',paddingHorizontal:16,paddingVertical:9,justifyContent:'center',overflow:'hidden'},
  ecgViewport:{height:84,overflow:'hidden',borderRadius:5,backgroundColor:'#F7F3E9'},
  ecgGrid:{...StyleSheet.absoluteFillObject},
  ecgVertical:{position:'absolute',top:0,bottom:0,width:1,backgroundColor:'#E8D8CF'},
  ecgHorizontal:{position:'absolute',left:0,right:0,height:1,backgroundColor:'#E8D8CF'},
  ecgTrace:{position:'absolute',left:0,top:0,bottom:0,overflow:'hidden'},
  ecgCursor:{position:'absolute',right:0,top:0,bottom:0,width:2,backgroundColor:'#78A99D',opacity:.75},
  action:{backgroundColor:'#FCFDFC',borderRadius:15,padding:19,borderWidth:1,borderColor:'#DDE5DF',minHeight:142,justifyContent:'center',shadowColor:'#183B32',shadowOpacity:.035,shadowRadius:7,elevation:1},
  actionIcon:{fontSize:24,color:teal,fontWeight:'700',marginBottom:12},
  actionTitle:{fontSize:18,fontWeight:'800',color:'#1C302B',marginBottom:7},
  actionText:{fontSize:15,lineHeight:23,color:'#5C6B65'},
  savedCard:{backgroundColor:'#FCFDFC',borderRadius:15,padding:20,borderWidth:1,borderColor:'#DDE5DF',gap:9},
  savedTitle:{fontSize:18,fontWeight:'800',color:'#1C302B'},
  savedText:{fontSize:15,lineHeight:23,color:'#5C6B65'},
  savedLink:{fontSize:14,fontWeight:'700',color:teal,marginTop:2},
  footer:{fontSize:12,lineHeight:18,color:'#7A8982',marginTop:2},
});
