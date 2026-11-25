import { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { RxMark } from '../components/Brand';
import { listReviews, type SavedReview } from '../services/localHistory';

const ONBOARDING_KEY = 'rxcheck.home.onboarding.v1';
const slides = [
  { title: 'Understand your medicines', body: 'RxCheck reads prescription text on your phone and organises medicine details for review.' },
  { title: 'What RxCheck does not do', body: 'It does not diagnose, prescribe, or certify that a medicine combination is safe. Always confirm medicines and findings with a pharmacist or doctor.' },
  { title: 'Get a clearer scan', body: 'Keep the page flat, use good light, and fill the camera frame. Check every extracted name, strength and dose against the original.' },
];

export default function Home() {
  const router = useRouter();
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const [tipsOpen, setTipsOpen] = useState(false);
  const [resume, setResume] = useState<SavedReview | null>(null);
  const [onboarding, setOnboarding] = useState(false);
  const [slide, setSlide] = useState(0);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const rows = await listReviews();
      const draft = rows.find(row => row.status === 'Draft');
      setResume(draft || null);
    } catch { setResume(null); }
    try {
      const seen = await SecureStore.getItemAsync(ONBOARDING_KEY);
      if (!seen) setOnboarding(true);
    } catch { /* onboarding can be opened again from Settings */ }
    setReady(true);
  }, []);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  async function finishOnboarding() {
    try { await SecureStore.setItemAsync(ONBOARDING_KEY, 'complete'); } catch {}
    setOnboarding(false);
  }

  const bg = dark ? '#101B19' : '#F4F7F3';
  const panel = dark ? '#1B2925' : '#FFFFFF';
  const ink = dark ? '#F0F5F2' : '#172B28';
  const muted = dark ? '#B1C0B9' : '#62716B';

  return <View style={[s.root, { backgroundColor: bg }]}>
    <ScrollView contentContainerStyle={s.page}>
      <View style={s.header}>
        <View style={s.brand}><RxMark size={42}/><View><Text style={[s.logo,{color:ink}]}>RxCheck</Text><Text style={[s.tag,{color:muted}]}>Understand your medicines. Feel more informed.</Text></View></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={() => router.push('/settings')} style={s.iconButton}><Text style={[s.gear,{color:ink}]}>⚙</Text></Pressable>
      </View>

      <View style={[s.illustration,{backgroundColor:panel,borderColor:dark?'#34443E':'#E0E7E1'}]}>
        <View style={s.paper}><Text style={s.paperTitle}>PRESCRIPTION</Text><View style={s.paperLine}/><View style={[s.paperLine,{width:'72%'}]}/><View style={[s.paperLine,{width:'84%'}]}/><View style={s.paperCheck}><Text style={s.check}>✓</Text></View></View>
        <View style={s.illustrationCopy}><Text style={[s.illustrationTitle,{color:ink}]}>A clearer medicine review</Text><Text style={[s.illustrationText,{color:muted}]}>Scan, confirm details, then review the information.</Text></View>
      </View>

      {resume ? <Pressable onPress={() => router.push({pathname:'/manual',params:{resumeId:resume.id}})} style={[s.resume,{backgroundColor:dark?'#203B35':'#E4F2EC'}]}>
        <Text style={s.resumeEyebrow}>UNFINISHED CHECK</Text><Text style={[s.resumeTitle,{color:ink}]}>Continue your last check</Text><Text style={[s.resumeText,{color:muted}]}>{Array.isArray(resume.medicines)?resume.medicines.length:0} medicines · {resume.title}</Text>
      </Pressable> : null}

      <Pressable accessibilityRole="button" onPress={() => router.push('/scan')} style={s.primary}><Text style={s.buttonIcon}>▧</Text><Text style={s.primaryText}>Scan prescription</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.push('/manual')} style={[s.secondary,{backgroundColor:panel,borderColor:'#0E756A'}]}><Text style={s.secondaryIcon}>⌨</Text><Text style={[s.secondaryText,{color:dark?'#75D6C4':'#0E6E63'}]}>Enter manually</Text></Pressable>

      <Text style={[s.privacy,{color:muted}]}>Photos are read on your phone. Nothing is uploaded for OCR.</Text>
      <View style={s.links}><Pressable onPress={() => router.push('/history')}><Text style={s.link}>Check history</Text></Pressable><Text style={[s.dot,{color:muted}]}>·</Text><Pressable onPress={() => router.push('/settings')}><Text style={s.link}>How it works</Text></Pressable></View>

      <Pressable onPress={() => setTipsOpen(v=>!v)} style={s.tipsToggle}><Text style={[s.tipsTitle,{color:ink}]}>Scan tips</Text><Text style={[s.chevron,{color:muted}]}>{tipsOpen?'−':'＋'}</Text></Pressable>
      {tipsOpen ? <View style={[s.tips,{backgroundColor:panel}]}><Text style={[s.tipsText,{color:muted}]}>• Keep the page flat{"\n"}• Use bright, even light{"\n"}• Fill the frame and avoid shadows{"\n"}• Check every medicine name and dose after scanning</Text></View> : null}
      <Text style={[s.safety,{color:muted}]}>Informational aid. Not a substitute for a doctor or pharmacist.</Text>
    </ScrollView>

    <Modal visible={onboarding && ready} transparent animationType="fade" onRequestClose={finishOnboarding}>
      <View style={s.modalBackdrop}><View style={[s.modalCard,{backgroundColor:panel}]}>
        <Text style={s.modalKicker}>WELCOME TO RXCHECK · {slide+1} OF 3</Text><Text style={[s.modalTitle,{color:ink}]}>{slides[slide].title}</Text><Text style={[s.modalBody,{color:muted}]}>{slides[slide].body}</Text>
        <View style={s.modalActions}>{slide>0?<Pressable onPress={()=>setSlide(v=>v-1)} style={s.modalBack}><Text style={s.modalBackText}>Back</Text></Pressable>:<View/>}
          <Pressable onPress={()=>slide===2?finishOnboarding():setSlide(v=>v+1)} style={s.modalNext}><Text style={s.modalNextText}>{slide===2?'Get started':'Next'}</Text></Pressable></View>
        <Pressable onPress={finishOnboarding} style={s.skip}><Text style={{color:muted}}>Skip introduction</Text></Pressable>
      </View></View>
    </Modal>
  </View>;
}

const s=StyleSheet.create({
 root:{flex:1},page:{flexGrow:1,paddingHorizontal:22,paddingTop:14,paddingBottom:20,gap:14},
 header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},brand:{flexDirection:'row',alignItems:'center',gap:10},logo:{fontSize:25,fontWeight:'900',letterSpacing:-.7},tag:{fontSize:11,marginTop:2},iconButton:{width:42,height:42,borderRadius:12,alignItems:'center',justifyContent:'center'},gear:{fontSize:23},
 illustration:{minHeight:128,borderRadius:18,borderWidth:1,padding:14,flexDirection:'row',alignItems:'center',gap:17},paper:{width:74,height:92,backgroundColor:'#FFFFFF',borderRadius:7,padding:9,justifyContent:'center',gap:8,elevation:2},paperTitle:{fontSize:7,fontWeight:'900',color:'#62716B'},paperLine:{height:4,width:'95%',backgroundColor:'#DCE7E1',borderRadius:4},paperCheck:{position:'absolute',right:-7,bottom:-7,width:28,height:28,borderRadius:14,backgroundColor:'#0E756A',alignItems:'center',justifyContent:'center',borderWidth:3,borderColor:'#FFFFFF'},check:{color:'#FFFFFF',fontSize:16,fontWeight:'900'},illustrationCopy:{flex:1,gap:5},illustrationTitle:{fontSize:17,fontWeight:'900'},illustrationText:{fontSize:12,lineHeight:18},
 resume:{padding:13,borderRadius:12,gap:3},resumeEyebrow:{fontSize:9,fontWeight:'900',letterSpacing:1,color:'#0E756A'},resumeTitle:{fontSize:15,fontWeight:'900'},resumeText:{fontSize:11},
 primary:{minHeight:60,backgroundColor:'#0E756A',borderRadius:13,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10},buttonIcon:{fontSize:21,color:'#FFFFFF'},primaryText:{fontSize:17,fontWeight:'900',color:'#FFFFFF'},secondary:{minHeight:60,borderRadius:13,borderWidth:1.5,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10},secondaryIcon:{fontSize:19,color:'#0E6E63'},secondaryText:{fontSize:17,fontWeight:'900'},
 privacy:{fontSize:11,textAlign:'center',marginTop:-5},links:{flexDirection:'row',justifyContent:'center',alignItems:'center',gap:12},link:{fontSize:12,fontWeight:'800',color:'#159080',textDecorationLine:'underline'},dot:{fontSize:14},tipsToggle:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:8,borderTopWidth:1,borderTopColor:'#DCE5DF'},tipsTitle:{fontSize:13,fontWeight:'800'},chevron:{fontSize:18},tips:{padding:12,borderRadius:10},tipsText:{fontSize:12,lineHeight:20},safety:{fontSize:10,textAlign:'center',marginTop:'auto',paddingTop:8},
 modalBackdrop:{flex:1,backgroundColor:'rgba(0,0,0,.55)',justifyContent:'center',padding:24},modalCard:{padding:22,borderRadius:18,gap:15},modalKicker:{fontSize:10,fontWeight:'900',letterSpacing:1,color:'#0E756A'},modalTitle:{fontSize:23,fontWeight:'900'},modalBody:{fontSize:14,lineHeight:22},modalActions:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},modalBack:{padding:12},modalBackText:{color:'#0E756A',fontWeight:'800'},modalNext:{backgroundColor:'#0E756A',paddingHorizontal:22,paddingVertical:13,borderRadius:10},modalNextText:{color:'#FFFFFF',fontWeight:'900'},skip:{alignItems:'center',padding:6}
});
