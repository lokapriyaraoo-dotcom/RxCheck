import { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';

import { Brand } from '../components/Brand';

type Pharmacy = {
  name: string;
  url: (medicine: string) => string;
  note: string;
};

const pharmacies: Pharmacy[] = [
  {
    name: 'Tata 1mg',
    url: (medicine) => 'https://www.1mg.com/search/all?name=' + encodeURIComponent(medicine),
    note: 'Search medicines',
  },
  {
    name: 'Truemeds',
    url: (medicine) => 'https://www.truemeds.in/search?search=' + encodeURIComponent(medicine),
    note: 'Search medicines',
  },
  {
    name: 'PharmEasy',
    url: (medicine) => 'https://pharmeasy.in/search/all?name=' + encodeURIComponent(medicine),
    note: 'Search medicines',
  },
  {
    name: 'Apollo Pharmacy',
    url: (medicine) => 'https://www.apollopharmacy.in/search-medicines/' + encodeURIComponent(medicine),
    note: 'Search medicines',
  },
];

export default function Buy() {
  const p = useLocalSearchParams<{ meds?: string }>();
  const meds = useMemo(() => {
    try {
      const parsed = JSON.parse(typeof p.meds === 'string' ? p.meds : '[]');
      return Array.isArray(parsed)
        ? parsed.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
        : [];
    } catch {
      return [];
    }
  }, [p.meds]);

  const [verified,setVerified]=useState<Record<string,boolean[]>>({});
  const checks=['Exact medicine name matches prescription','Active ingredient / salt confirmed','Strength and dosage form match','Release type and pack size checked','Seller, expiry and stock checked on pharmacy site'];
  const openMedicinePage = (url: string, title: string) => {
    router.push({ pathname: '/pharmacy', params: { url, title } });
  };

  return (
    <ScrollView contentContainerStyle={s.page}>
      <Link href="/" style={s.back}>‹ Home</Link>
      <Brand size={38} />
      <Text style={s.title}>Smart Medicine Shopping</Text>
      <Text style={s.copy}>
        Compare pharmacy listings for each prescribed medicine. RxCheck opens pharmacy results inside the app;
        prices, discounts and stock are displayed by the pharmacy and are not verified or live-compared by RxCheck.
      </Text>

      {meds.length ? meds.map((medicine, i) => (
        <View key={medicine + '-' + i} style={s.card}>
          <Text style={s.label}>PRESCRIBED MEDICINE</Text>
          <Text style={s.med}>{medicine}</Text>
          <Text style={s.sectionTitle}>Compare pharmacy listings</Text>
          {pharmacies.map((pharmacy) => (
            <Pressable
              key={pharmacy.name}
              style={s.pharmacyButton}
              onPress={() => openMedicinePage(pharmacy.url(medicine), pharmacy.name)}
              accessibilityRole="button"
              accessibilityLabel={'Search ' + medicine + ' on ' + pharmacy.name}
            >
              <View style={s.pharmacyText}>
                <Text style={s.pharmacyName}>{pharmacy.name}</Text>
                <Text style={s.pharmacyNote}>{pharmacy.note} · check price and stock</Text>
              </View>
              <Text style={s.arrow}>↗</Text>
            </Pressable>
          ))}
          <View style={s.verifyCard}>
            <Text style={s.sectionTitle}>Product verification checklist</Text>
            <Text style={s.smallNote}>Tick each item only after checking the pharmacy listing or asking a pharmacist. These are user confirmations, not automatic RxCheck verification.</Text>
            {checks.map((label,index)=>{
              const done=Boolean(verified[medicine]?.[index]);
              return <Pressable key={medicine+'-'+index} style={s.checkRow} onPress={()=>setVerified(old=>({...old,[medicine]:checks.map((_,i)=>i===index?!Boolean(old[medicine]?.[i]):Boolean(old[medicine]?.[i]))}))}>
                <Text style={s.checkMark}>{done?'☑':'☐'}</Text><Text style={s.checkText}>{label}</Text>
              </Pressable>;
            })}
            <Text style={s.smallNote}>{(verified[medicine]||[]).filter(Boolean).length} of {checks.length} checks marked by you.</Text>
          </View>
          <Pressable
            style={s.genericButton}
            onPress={() => openMedicinePage(
              'https://www.1mg.com/search/all?name=' + encodeURIComponent(medicine + ' generic'),
              'Tata 1mg · Generic medicines'
            )}
          >
            <Text style={s.genericButtonText}>Explore lower-cost generic listings ↗</Text>
          </Pressable>
          <Text style={s.smallNote}>
            Generic search is only a starting point. Confirm the same active ingredient (salt), strength,
            dosage form and release type with a pharmacist before considering any alternative.
          </Text>
        </View>
      )) : (
        <View style={s.card}>
          <Text style={s.med}>No prescribed medicines were provided.</Text>
          <Text style={s.copy}>Return to patient and medicine review, then add the exact prescribed medicine names.</Text>
        </View>
      )}

      <View style={s.safetyCard}>
        <Text style={s.safetyTitle}>Before you order</Text>
        <Text style={s.safetyText}>
          • Match the medicine name, active ingredient, strength, dosage form, release type and pack size.{'\n'}
          • Check seller, expiry, stock, final price and delivery details on the pharmacy site.{'\n'}
          • Follow prescription requirements. Never change brands, doses or medicines based only on a search result
          or interaction alert; confirm substitutions with your prescriber or pharmacist.
        </Text>
      </View>
      <Text style={s.disclaimer}>
        Pharmacy buttons open search results inside RxCheck, not guaranteed exact product-detail pages. RxCheck does not currently
        have pharmacy APIs, verified product matching, live price comparison or stock feeds. Do not treat missing
        listings as proof that a medicine is unavailable.
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { padding: 22, paddingTop: 48, gap: 15 },
  back: { color: '#0E6E63', fontWeight: '700' },
  title: { fontSize: 29, fontWeight: '800', color: '#172B28' },
  copy: { fontSize: 13, color: '#63716B', lineHeight: 20 },
  card: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E7E1', borderRadius: 12, padding: 15, gap: 11 },
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 1, color: '#718079' },
  med: { fontSize: 18, fontWeight: '800', color: '#1D332F' },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#263D37', marginTop: 4 },
  pharmacyButton: { borderWidth: 1, borderColor: '#DCE7E1', borderRadius: 10, padding: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pharmacyText: { flex: 1, gap: 3 },
  pharmacyName: { color: '#0E6E63', fontWeight: '800', fontSize: 15 },
  pharmacyNote: { color: '#718079', fontSize: 11 },
  arrow: { color: '#0E6E63', fontSize: 20, fontWeight: '800', paddingLeft: 8 },
  verifyCard:{backgroundColor:'#F7FAF8',borderWidth:1,borderColor:'#DCE7E1',borderRadius:10,padding:12,gap:8},
  checkRow:{flexDirection:'row',alignItems:'center',gap:9,paddingVertical:5},checkMark:{fontSize:19,color:'#0E6E63'},checkText:{fontSize:12,color:'#40534C',flex:1},
  genericButton: { backgroundColor: '#EAF5F1', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 3 },
  genericButtonText: { color: '#0E6E63', fontWeight: '800' },
  smallNote: { color: '#63716B', fontSize: 11, lineHeight: 17 },
  safetyCard: { backgroundColor: '#F2F7F4', borderRadius: 12, padding: 15, gap: 8 },
  safetyTitle: { color: '#1D332F', fontSize: 15, fontWeight: '800' },
  safetyText: { color: '#40534C', fontSize: 12, lineHeight: 20 },
  disclaimer: { color: '#7A6650', backgroundColor: '#FFF4E4', borderRadius: 10, padding: 13, fontSize: 11, lineHeight: 17 },
});
