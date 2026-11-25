import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const dark = useColorScheme() === 'dark';
  return <SafeAreaProvider>
    <StatusBar style="auto" />
    <SafeAreaView style={{flex:1,backgroundColor:dark?'#101B19':'#F4F7F3'}} edges={['top','bottom']}>
      <Stack screenOptions={{ headerShown:false, contentStyle:{backgroundColor:dark?'#101B19':'#F4F7F3'} }} />
    </SafeAreaView>
  </SafeAreaProvider>;
}
