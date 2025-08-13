import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Platform } from 'react-native'; // Importe o Platform

// --- ADIÇÕES PARA NOTIFICAÇÕES ---
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { registerBackgroundTask } from '@/lib/tasks';
// ------------------------------------

// Previne que a tela de splash seja escondida automaticamente
SplashScreen.preventAutoHideAsync();

// --- CONFIGURAÇÃO DAS NOTIFICAÇÕES ---
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Função para registrar e pedir permissão de notificação
async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web') return; // Não executa na web
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Permissão para notificações não concedida!');
      return;
    }
  } else {
    console.log('É necessário um dispositivo físico para testar as notificações.');
  }
}
// ------------------------------------

export default function RootLayout() {
  useFrameworkReady();
  
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carrega a sua fonte específica: GFSDidot-Regular
  const [fontsLoaded, fontError] = useFonts({
    'GFSDidot-Regular': require('../assets/fonts/GFSDidot-Regular.ttf'),
  });

  useEffect(() => {
    // ---> AQUI ESTÁ A CORREÇÃO <---
    // Apenas tentamos registrar as tarefas se não estivermos na web
    if (Platform.OS !== 'web') {
      registerForPushNotificationsAsync();
      registerBackgroundTask();
    }
    // ------------------------------------

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
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, isLoading]);

  if ((!fontsLoaded && !fontError) || isLoading) {
    return null;
  }

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