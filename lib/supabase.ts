import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rktybanymktqkjyopcrd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrdHliYW55bWt0cWtqeW9wY3JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzNzIxMjcsImV4cCI6MjA2Njk0ODEyN30.8bUcaM1MdjcuWoMsbqaDFoBM4YDY8p5nXfkMRNgjEz0';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Sua interface pode continuar aqui
export interface Campanula {
  id: string;
  nome: string;
  temp_atual?: number;
  intensidade?: number;
  umidade?: number;
  temp_max?: number;
  temp_min?: number;
  dia?: number;
  userID?: string; // Adicionado para corresponder à nova coluna
}