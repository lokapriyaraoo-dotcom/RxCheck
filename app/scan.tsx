import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, Image, ScrollView, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Link, useRouter } from 'expo-router';
import { Brand } from '../components/Brand';
import { readPrescriptionImage, validateImageBytes, extractPatientDetails, extractMedicineCandidates } from '../services/ocr';

export default function Scan() {
  const router=useRouter();
  const [images,setImages]=useState<string[]>([]);
  const [recognizedText,setRecognizedText]=useState('');
  const [busy,setBusy]=useState(false);
  const patient=extractPatientDetails(recognizedText);
  const medicines=extractMedicineCandidates(recognizedText);
  const patientFieldCount=[patient.name,patient.age,patient.gender,patient.weightKg,patient.allergies].filter(Boolean).length;

  async function recognize(uris:string[]) {
    setBusy(true);
    const completed:string[]=[];
    const failures:string[]=[];
    try {
      for(const uri of uris) {
        try {
          const result=await readPrescriptionImage(uri);
          completed.push(result.text);
        } catch(error) {
          failures.push(error instanceof Error?error.message:'Image recognition failed.');
        }
      }
      if(completed.length) setRecognizedText(old=>[old,...completed].filter(Boolean).join('\n\n--- Next image ---\n\n'));
      if(failures.length) Alert.alert('Some images need attention',failures.join('\n\n'));
      if(!completed.length&&!failures.length) Alert.alert('No images','Choose a prescription image first.');
    } finally {
      setBusy(false);
    }
  }

  async function choose(source:'camera'|'library') {
    if(busy)return;
    let result:ImagePicker.ImagePickerResult;
    if(source==='camera') {
      const permission=await ImagePicker.requestCameraPermissionsAsync();
      if(!permission.granted){Alert.alert('Permission needed','Allow camera access to photograph a prescription.');return;}
      result=await ImagePicker.launchCameraAsync({mediaTypes:['images'],quality:0.9});
    } else {
      result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsMultipleSelection:true,selectionLimit:5,quality:0.9});
    }
    if(result.canceled||!result.assets.length)return;
    const remaining=Math.max(0,5-images.length);
    const acceptable=result.assets.filter(asset=>asset.fileSize==null||validateImageBytes(asset.fileSize));
    const oversized=result.assets.length-acceptable.length;
    if(oversized)Alert.alert('Some images were skipped','Images over 12 MB are not processed. Please resize them and try again.');
    const selected=acceptable.slice(0,remaining).map(asset=>asset.uri);
    if(!selected.length){Alert.alert('Image limit reached','You can process up to five images in one review.');return;}
    setImages(old=>[...old,...selected]);
    await recognize(selected);
  }

  function openReview() {
    router.push({pathname:'/manual',params:{ocrText:recognizedText}});
  }

  return <ScrollView contentContainerStyle={s.page}>
    <Link href="/" style={s.back}>‹ Home</Link>
    <Brand size={38}/>
    <Text style={s.title}>Prescription scan</Text>
    <Text style={s.copy}>Capture a clear, well-lit image or select up to five pages. Keep the entire prescription flat and in frame.</Text>
    <Pressable disabled={busy} style={s.primary} onPress={()=>choose('camera')}><Text style={s.primaryText}>Take photo & read prescription</Text></Pressable>
    <Pressable disabled={busy} style={s.secondary} onPress={()=>choose('library')}><Text style={s.secondaryText}>Choose from gallery</Text></Pressable>
    {busy&&<View style={s.progress}><ActivityIndicator color="#0E6E63"/><Text style={s.copy}>Reading prescription text on this device with Google ML Kit…</Text></View>}
    {images.map((uri,i)=><Image key={uri+'-'+i} source={{uri}} style={s.preview}/>)}
    {recognizedText?<>
      <View style={s.resultCard}>
        <Text style={s.resultTitle}>PRESCRIPTION ATTACHED</Text>
        <Text style={s.copy}>Image text was read. The fields below are extracted on this device and will be prefilled on the next screen where identifiable. Check every value against the original.</Text>
        <View style={s.previewGrid}>
          <View style={s.previewItem}><Text style={s.fieldLabel}>PATIENT NAME</Text><Text style={s.fieldValue}>{patient.name||'Not detected'}</Text></View>
          <View style={s.previewItem}><Text style={s.fieldLabel}>AGE</Text><Text style={s.fieldValue}>{patient.age||'Not detected'}</Text></View>
          <View style={s.previewItem}><Text style={s.fieldLabel}>WEIGHT</Text><Text style={s.fieldValue}>{patient.weightKg?patient.weightKg+' kg':'Not detected'}</Text></View>
          <View style={s.previewItem}><Text style={s.fieldLabel}>GENDER</Text><Text style={s.fieldValue}>{patient.gender||'Not detected'}</Text></View>
        </View>
        <Text style={s.fieldLabel}>MEDICINES & DOSES DETECTED</Text>
        {medicines.length?medicines.map((medicine,i)=><Text key={i} style={s.medicineLine}>{i+1}. {medicine.name||'Medicine'}{medicine.strength?' · '+medicine.strength:''}{medicine.dose?' · Dose: '+medicine.dose:''}</Text>):<Text style={s.copy}>No medicine rows could be mapped by on-device extraction. Enter medicine details manually and verify them against the original prescription.</Text>}
        <Text style={s.resultNote}>Detected {patientFieldCount} patient fields and {medicines.length} medicine candidates. OCR values are unverified.</Text>
      </View>
      <View style={s.notice}><Text style={s.noticeTitle}>On-device OCR limitation</Text><Text style={s.noticeText}>RxCheck reads prescription images on this device; it does not upload the image for OCR. Complex layouts or handwriting may not be mapped into fields. Enter missing details manually and verify every value against the original.</Text></View>
      <Pressable style={s.secondary} onPress={openReview}><Text style={s.secondaryText}>CONTINUE TO REVIEW</Text></Pressable>
    </>:<View style={s.notice}><Text style={s.noticeTitle}>Important</Text><Text style={s.noticeText}>OCR may misread handwriting, medicine names, decimal points or units. If text is unclear, do not guess; ask a pharmacist or prescriber.</Text></View>}
  </ScrollView>;
}
const s=StyleSheet.create({
  page:{padding:22,paddingTop:48,gap:14},back:{color:'#0E6E63',fontWeight:'700'},
  title:{fontSize:30,fontWeight:'800',color:'#172B28'},copy:{fontSize:14,color:'#62716B',lineHeight:21},
  primary:{backgroundColor:'#0E6E63',padding:16,borderRadius:10,alignItems:'center'},
  primaryText:{color:'white',fontWeight:'800',textAlign:'center'},
  secondary:{padding:16,borderRadius:10,borderColor:'#0E6E63',borderWidth:1,alignItems:'center'},
  secondaryText:{color:'#0E6E63',fontWeight:'800',textAlign:'center'},
  preview:{width:'100%',height:210,resizeMode:'contain',backgroundColor:'#E9EDE8',borderRadius:10},
  resultCard:{backgroundColor:'#FFFFFF',padding:15,borderRadius:11,gap:10,borderWidth:1,borderColor:'#E1E7E1'},
  resultTitle:{fontSize:13,fontWeight:'900',letterSpacing:1,color:'#0E6E63'},
  previewGrid:{flexDirection:'row',flexWrap:'wrap',gap:10},
  previewItem:{width:'47%',backgroundColor:'#F2F7F4',padding:10,borderRadius:8,gap:4},
  fieldLabel:{fontSize:10,fontWeight:'800',letterSpacing:1,color:'#6B7771'},
  fieldValue:{fontSize:14,fontWeight:'700',color:'#203A34'},
  medicineLine:{fontSize:13,color:'#344640',lineHeight:19},
  resultNote:{fontSize:12,fontWeight:'700',color:'#8A5A16'},
  notice:{backgroundColor:'#FFF4DE',padding:14,borderRadius:10,gap:5},
  noticeTitle:{fontWeight:'800',color:'#754B12'},noticeText:{color:'#745B36',lineHeight:20},
  progress:{flexDirection:'row',alignItems:'center',gap:10,padding:10}
});
