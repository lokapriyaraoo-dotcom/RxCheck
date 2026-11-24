import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';

const allowedHosts = [
  '1mg.com',
  'truemeds.in',
  'pharmeasy.in',
  'apollopharmacy.in',
];

function isAllowedPharmacyUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && allowedHosts.some(
      (host) => parsed.hostname === host || parsed.hostname.endsWith('.' + host)
    );
  } catch {
    return false;
  }
}

export default function PharmacyBrowser() {
  const params = useLocalSearchParams<{ url?: string; title?: string }>();
  const targetUrl = typeof params.url === 'string' ? params.url : '';
  const title = typeof params.title === 'string' ? params.title : 'Pharmacy search';
  const validUrl = useMemo(() => isAllowedPharmacyUrl(targetUrl), [targetUrl]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <Link href="/buy" style={s.back}>‹ Back</Link>
        <View style={s.headerCopy}>
          <Text numberOfLines={1} style={s.title}>{title}</Text>
          <Text style={s.subtitle}>Browsing securely inside RxCheck</Text>
        </View>
      </View>
      {!validUrl ? (
        <View style={s.message}>
          <Text style={s.messageTitle}>Pharmacy link unavailable</Text>
          <Text style={s.messageBody}>This link is not a recognised RxCheck pharmacy address. Return and choose a pharmacy again.</Text>
          <Link href="/buy" style={s.retry}>Back to pharmacy search</Link>
        </View>
      ) : failed ? (
        <View style={s.message}>
          <Text style={s.messageTitle}>Unable to load this pharmacy</Text>
          <Text style={s.messageBody}>Check your internet connection. Some pharmacy websites may restrict embedded browsing or require you to continue on their own website.</Text>
          <Pressable style={s.retryButton} onPress={() => { setFailed(false); setLoading(true); }}>
            <Text style={s.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {loading && <View style={s.loading}><ActivityIndicator size="large" color="#087E72" /><Text style={s.loadingText}>Loading pharmacy…</Text></View>}
          <WebView
            key={targetUrl}
            source={{ uri: targetUrl }}
            style={s.webview}
            startInLoadingState
            javaScriptEnabled
            domStorageEnabled
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            setSupportMultipleWindows={false}
            onLoadStart={() => { setLoading(true); setFailed(false); }}
            onLoadEnd={() => setLoading(false)}
            onError={() => { setLoading(false); setFailed(true); }}
            onHttpError={(event) => {
              if (event.nativeEvent.statusCode >= 500) {
                setLoading(false);
                setFailed(true);
              }
            }}
            onShouldStartLoadWithRequest={(request) => isAllowedPharmacyUrl(request.url)}
            allowsBackForwardNavigationGestures
          />
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F7F4' },
  header: { minHeight: 68, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5ECE7' },
  back: { color: '#087E72', fontSize: 14, fontWeight: '800' },
  headerCopy: { flex: 1, gap: 3 },
  title: { color: '#102F2C', fontSize: 15, fontWeight: '900' },
  subtitle: { color: '#718079', fontSize: 10 },
  webview: { flex: 1, backgroundColor: '#FFFFFF' },
  loading: { position: 'absolute', zIndex: 2, top: 68, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#F4F7F4' },
  loadingText: { color: '#61736E', fontSize: 13, fontWeight: '600' },
  message: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 12 },
  messageTitle: { color: '#102F2C', fontSize: 20, fontWeight: '900', textAlign: 'center' },
  messageBody: { color: '#61736E', fontSize: 13, lineHeight: 20, textAlign: 'center' },
  retry: { color: '#087E72', fontWeight: '800', marginTop: 8 },
  retryButton: { backgroundColor: '#103F3A', paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  retryText: { color: '#FFFFFF', fontWeight: '800' },
});
