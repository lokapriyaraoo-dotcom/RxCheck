import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, Image, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Link } from 'expo-router';

export default function Scan() {
  const [images,setImages] = useState<string[]>([]);
  async function choose(source:'camera'|'library') {
    const result = source==='camera'
      ? await (async()=>{const p=await ImagePicker.requestCameraPermissionsAsync();if(!p.granted){Alert.alert('Permission needed','Allow camera access to photograph a prescription.');return null;}return ImagePicker.launchCameraAsync({mediaTypes:['images'],quality:0.85});})()
      : await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsMultipleSelection:true,quality:0.85});
    if (!result || result.canceled) return;
    const uris = result.assets.map(a=>a.uri);
    setImages(old=>[...old,...uris].slice(0,5));
    Alert.alert('Image added','Image capture works, but OCR is not configured in this starter. Please verify and enter all medicine details manually.');
  }
  return <ScrollView contentContainerStyle={s.page}><Link href="/" style={s.back}>‹ Home</Link><Text style={s.title}>Prescription scan</Text><Text style={s.copy}>Take a clear, well-lit photo or choose up to five images. Keep the entire prescription in frame.</Text>
    <Pressable style={s.primary} onPress={()=>choose('camera')}><Text style={s.primaryText}>Take photo</Text></Pressable>
    <Pressable style={s.secondary} onPress={()=>choose('library')}><Text style={s.secondaryText}>Choose from gallery</Text></Pressable>
    {images.map((uri,i)=><Image key={`${uri}-${i}`} source={{uri}} style={s.preview}/>) }
    <View style={s.warning}><Text style={s.warnTitle}>OCR not enabled</Text><Text style={s.warnText}>This starter does not pretend to read the image. Please continue to manual entry and copy details exactly from the prescription. Do not rely on a guessed medicine name or dose.</Text></View>
    <Link href="/manual" asChild><Pressable style={s.primary}><Text style={s.primaryText}>Continue to manual review</Text></Pressable></Link>
  </ScrollView>;
}
const s=StyleSheet.create({page:{padding:22,paddingTop:48,gap:14},back:{color:'#0E6E63',fontWeight:'700'},title:{fontSize:30,fontWeight:'800',color:'#172B28'},copy:{fontSize:15,color:'#62716B',lineHeight:22},primary:{backgroundColor:'#0E6E63',padding:16,borderRadius:10,alignItems:'center'},primaryText:{color:'white',fontWeight:'800'},secondary:{padding:16,borderRadius:10,borderColor:'#0E6E63',borderWidth:1,alignItems:'center'},secondaryText:{color:'#0E6E63',fontWeight:'800'},preview:{width:'100%',height:220,resizeMode:'contain',backgroundColor:'#E9EDE8',borderRadius:10},warning:{backgroundColor:'#FFF4DE',padding:15,borderRadius:10,gap:5},warnTitle:{fontWeight:'800',color:'#754B12'},warnText:{color:'#745B36',lineHeight:20}});
