import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, Image, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Link, useRouter } from 'expo-router';
import { Brand } from '../components/Brand';
import { readPrescriptionImage, validateImageBytes } from '../services/ocr';

export default function Scan() {
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const [recognizedText, setRecognizedText] = useState('');
  const [busy, setBusy] = useState(false);
  async function recognize(uris: string[]) {
    setBusy(true);
    const completed: string[] = [];
    const failures: string[] = [];
    for (const uri of uris) {
      try { const result = await readPrescriptionImage(uri); completed.push(result.text); }
      catch (error) { failures.push(error instanceof Error ? error.message : 'Image recognition failed.'); }
    }
    if (completed.length) setRecognizedText(old => [old, ...completed].filter(Boolean).join('\n\n--- Next image ---\n\n'));
    setBusy(false);
    if (failures.length) Alert.alert('Some images need attention', failures.join('\n\n'));
    if (!completed.length && !failures.length) Alert.alert('No images', 'Choose a prescription image first.');
  }
  async function choose(source: 'camera' | 'library') {
    if (busy) return;
    let result: ImagePicker.ImagePickerResult;
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) { Alert.alert('Permission needed', 'Allow camera access to photograph a prescription.'); return; }
      result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9 });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: 5, quality: 0.9 });
    }
    if (result.canceled || !result.assets.length) return;
    const remaining = Math.max(0, 5 - images.length);
    const acceptable = result.assets.filter(asset => asset.fileSize == null || validateImageBytes(asset.fileSize));
    const oversized = result.assets.length - acceptable.length;
    if (oversized) Alert.alert('Some images were skipped', 'Images over 12 MB are not processed. Please resize them and try again.');
    const selected = acceptable.slice(0, remaining).map(asset => asset.uri);
    if (!selected.length) { Alert.alert('Image limit reached', 'You can process up to five images in one review.'); return; }
    setImages(old => [...old, ...selected]);
    await recognize(selected);
  }
  return (
    <ScrollView contentContainerStyle={s.page}>
      <Link href="/" style={s.back}>‹ Home</Link>
      <Brand size={38} />
      <Text style={s.title}>Prescription scan</Text>
      <Text style={s.copy}>Capture a clear, well-lit image or select up to five pages. Keep the entire prescription flat and in frame.</Text>
      <Pressable disabled={busy} style={s.primary} onPress={() => choose('camera')}><Text style={s.primaryText}>Take photo & read prescription</Text></Pressable>
      <Pressable disabled={busy} style={s.secondary} onPress={() => choose('library')}><Text style={s.secondaryText}>Choose from gallery</Text></Pressable>
      {busy && <View style={s.progress}><ActivityIndicator color="#0E6E63" /><Text style={s.copy}>Reading prescription text on this device with Google ML Kit…</Text></View>}
      {images.map((uri, i) => <Image key={`${uri}-${i}`} source={{ uri }} style={s.preview} />)}
      {recognizedText ? <>
        <View style={s.warning}><Text style={s.warnTitle}>Prescription read successfully</Text><Text style={s.warnText}>RxCheck will organize detected text into patient and medicine fields using AI on the next screen. Review every value against the original image.</Text></View>
        <Pressable style={s.primary} onPress={() => Alert.alert('Allow AI prescription autofill?','The extracted prescription text will be sent to the RxCheck secure AI gateway and configured AI provider to fill patient and medicine fields. Continue only if you consent.',[{text:'Cancel',style:'cancel'},{text:'Allow & continue',onPress:()=>router.push({pathname:'/manual',params:{ocrText:recognizedText,aiConsent:'true'}})}])}><Text style={s.primaryText}>Continue — AI autofill patient & medicines →</Text></Pressable>
      </> : <View style={s.warning}><Text style={s.warnTitle}>Important</Text><Text style={s.warnText}>OCR may misread handwriting, medicine names, decimal points or units. If text is unclear, do not guess; ask a pharmacist or prescriber.</Text></View>}
    </ScrollView>
  );
}
const s = StyleSheet.create({
  page: { padding: 22, paddingTop: 48, gap: 14 }, back: { color: '#0E6E63', fontWeight: '700' },
  title: { fontSize: 30, fontWeight: '800', color: '#172B28' }, copy: { fontSize: 14, color: '#62716B', lineHeight: 21 },
  primary: { backgroundColor: '#0E6E63', padding: 16, borderRadius: 10, alignItems: 'center' }, primaryText: { color: 'white', fontWeight: '800', textAlign: 'center' },
  secondary: { padding: 16, borderRadius: 10, borderColor: '#0E6E63', borderWidth: 1, alignItems: 'center' }, secondaryText: { color: '#0E6E63', fontWeight: '800' },
  preview: { width: '100%', height: 210, resizeMode: 'contain', backgroundColor: '#E9EDE8', borderRadius: 10 },
  warning: { backgroundColor: '#FFF4DE', padding: 15, borderRadius: 10, gap: 5 }, warnTitle: { fontWeight: '800', color: '#754B12' }, warnText: { color: '#745B36', lineHeight: 20 },
  progress: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10 }, label: { fontSize: 13, fontWeight: '800', color: '#344640' },
  ocrText: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E7E1', borderRadius: 9, padding: 13, minHeight: 170, color: '#243832', lineHeight: 21 },
});
