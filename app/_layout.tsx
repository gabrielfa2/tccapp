import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

// Previne que a tela de splash seja escondida automaticamente
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carrega a sua fonte específica: GFSDidot-Regular
  const [fontsLoaded, fontError] = useFonts({
    'GFSDidot-Regular': require('../assets/fonts/GFSDidot-Regular.ttf'),
  });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && !isLoading) {
      // Esconde a tela de splash quando a fonte carregar (ou der erro) e auth estiver pronto
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, isLoading]);

  // Se a fonte ainda não carregou ou auth ainda está carregando, não renderiza nada para manter o splash visível
  if ((!fontsLoaded && !fontError) || isLoading) {
    return null;
  }

  // Renderiza o app quando a fonte estiver pronta e auth estiver carregado
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="add" options={{ headerShown: false }} />
        <Stack.Screen name="detail" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}