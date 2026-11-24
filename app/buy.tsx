import { useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Brand } from '../components/Brand';

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

  const openMedicinePage = async (url: string) => {
    try {
      // Android opens this in an in-app Chrome Custom Tab; iOS uses an in-app Safari view.
      await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        showTitle: true,
      });
    } catch {
      Alert.alert('Unable to open medicine page', 'Please check your internet connection and try again.');
    }
  };

  return (
    <ScrollView contentContainerStyle={s.page}>
      <Link href="/" style={s.back}>‹ Home</Link>
      <Brand size={38} />
      <Text style={s.title}>Find your prescribed medicine</Text>
      <Text style={s.copy}>
        Select a pharmacy to open its medicine search inside RxCheck. Check the exact brand or generic name,
        strength, dosage form and pack size before ordering. RxCheck does not confirm stock, price, seller,
        prescription validity or suitability.
      </Text>
      {meds.length ? meds.map((medicine, i) => (
        <View key={medicine + '-' + i} style={s.card}>
          <Text style={s.med}>{medicine}</Text>
          <Pressable
            style={s.button}
            onPress={() => openMedicinePage('https://www.1mg.com/search/all?name=' + encodeURIComponent(medicine))}
          >
            <Text style={s.buttonText}>View {medicine} on Tata 1mg ↗</Text>
          </Pressable>
          <Pressable
            style={s.buttonAlt}
            onPress={() => openMedicinePage('https://www.truemeds.in/search?search=' + encodeURIComponent(medicine))}
          >
            <Text style={s.buttonAltText}>View {medicine} on Truemeds ↗</Text>
          </Pressable>
        </View>
      )) : (
        <View style={s.card}>
          <Text style={s.med}>No prescribed medicines were provided.</Text>
          <Text style={s.copy}>Return to patient and medicine review, then add the exact prescribed medicine names.</Text>
        </View>
      )}
      <Text style={s.warning}>
        These links open pharmacy search results, not a guaranteed exact product page. Confirm the exact medicine
        with a pharmacist. Do not purchase a substitute or change a prescription based only on an interaction alert.
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { padding: 22, paddingTop: 48, gap: 15 },
  back: { color: '#0E6E63', fontWeight: '700' },
  title: { fontSize: 29, fontWeight: '800', color: '#172B28' },
  copy: { fontSize: 13, color: '#63716B', lineHeight: 20 },
  card: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E7E1', borderRadius: 10, padding: 15, gap: 9 },
  med: { fontSize: 16, fontWeight: '800', color: '#1D332F' },
  button: { backgroundColor: '#0E6E63', padding: 16, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#FFF', fontWeight: '800' },
  buttonAlt: { borderWidth: 1, borderColor: '#0E6E63', padding: 16, borderRadius: 10, alignItems: 'center' },
  buttonAltText: { color: '#0E6E63', fontWeight: '800' },
  warning: { backgroundColor: '#FFF4DE', padding: 15, borderRadius: 10, color: '#754B12', lineHeight: 20 },
});
