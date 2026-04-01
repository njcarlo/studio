import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View } from 'react-native';
import { useFonts, Anton_400Regular } from '@expo-google-fonts/anton';
import { Inter_400Regular_Italic } from '@expo-google-fonts/inter';
import AppNavigator from './src/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';

export default function App() {
  const [fontsLoaded] = useFonts({ Anton_400Regular, Inter_400Regular_Italic });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#C9A84C" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <AppNavigator />
      </SafeAreaProvider>
    </AuthProvider>
  );
}
