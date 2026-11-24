import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, StyleSheet, View } from 'react-native';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { Brand } from '../components/Brand';
import { clearReviews, deleteReview, listReviews, type SavedReview } from '../services/localHistory';

export default function History(){
  const [items,setItems]=useState<SavedReview[]>([]);
  const [loading,setLoading]=useState(true);
  const router=useRouter();
  const refresh=useCallback(()=>{
    setLoading(true);
    listReviews().then(setItems).catch(()=>Alert.alert('History unavailable','Could not unlock the encrypted local history on this device.')).finally(()=>setLoading(false));
  },[]);
  useFocusEffect(useCallback(()=>{refresh();},[refresh]));
  function remove(id:string){
    Alert.alert('Delete saved review?','This permanently deletes this review from this device.',[
      {text:'Cancel',style:'cancel'},
      {text:'Delete',style:'destructive',onPress:()=>deleteReview(id).then(refresh).catch(()=>Alert.alert('Delete failed','Please try again.'))}
    ]);
  }
  function removeAll(){
    Alert.alert('Delete all history?','All saved reviews will be permanently deleted from this device.',[
      {text:'Cancel',style:'cancel'},
      {text:'Delete all',style:'destructive',onPress:()=>clearReviews().then(refresh).catch(()=>Alert.alert('Delete failed','Please try again.'))}
    ]);
  }
  return <ScrollView contentContainerStyle={s.page}>
    <Link href="/" style={s.back}>‹ Home</Link><Brand size={38}/>
    <Text style={s.title}>Prescription history</Text>
    <Text style={s.copy}>Saved reviews are stored locally in an SQLCipher-encrypted database. The encryption key is held in Android Keystore through SecureStore. This data is not synchronised to a cloud account.</Text>
    {loading?<Text style={s.copy}>Unlocking encrypted history…</Text>:null}
    {!loading&&!items.length?<View style={s.card}><Text style={s.cardTitle}>No saved reviews yet</Text><Text style={s.copy}>Start or edit a prescription review. RxCheck autosaves the draft on this device.</Text></View>:null}
    {items.map(item=><View key={item.id} style={s.card}>
      <Text style={s.cardTitle}>{item.title}</Text>
      <Text style={s.copy}>{new Date(item.createdAt).toLocaleString()} · {item.status||'Saved review'}</Text>
      <Text style={s.copy}>{Array.isArray(item.medicines)?item.medicines.length:0} medicine entries</Text>
      <View style={s.actions}>
        <Pressable style={s.primary} onPress={()=>router.push({pathname:'/manual',params:{resumeId:item.id}})}><Text style={s.primaryText}>Resume review</Text></Pressable>
        <Pressable style={s.delete} onPress={()=>remove(item.id)}><Text style={s.deleteText}>Delete</Text></Pressable>
      </View>
    </View>)}
    {items.length>0?<Pressable onPress={removeAll} style={s.deleteAll}><Text style={s.deleteText}>Delete all history</Text></Pressable>:null}
  </ScrollView>;
}
const s=StyleSheet.create({page:{padding:22,paddingTop:48,gap:15,backgroundColor:'#F4F7F3',flexGrow:1},back:{color:'#0E6E63',fontWeight:'700'},title:{fontSize:30,fontWeight:'800',color:'#172B28'},copy:{color:'#6C7973',lineHeight:20,fontSize:13},card:{backgroundColor:'#FFF',padding:16,borderRadius:11,gap:8,borderColor:'#E0E7E1',borderWidth:1},cardTitle:{fontSize:17,fontWeight:'800',color:'#1D332F'},actions:{flexDirection:'row',gap:9,marginTop:4},primary:{backgroundColor:'#0E6E63',padding:11,borderRadius:8},primaryText:{color:'#FFF',fontWeight:'800'},delete:{borderWidth:1,borderColor:'#B42318',padding:11,borderRadius:8},deleteText:{color:'#B42318',fontWeight:'800'},deleteAll:{alignItems:'center',padding:14}});
