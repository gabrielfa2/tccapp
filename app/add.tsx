import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Save } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase'; // Importar o Supabase

export default function AddScreen() {
  const [nome, setNome] = useState('');
  const [codigo, setCodigo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ nome: '', codigo: '' });

  const validateForm = () => {
    const newErrors = { nome: '', codigo: '' };
    let isValid = true;

    if (!nome.trim()) {
      newErrors.nome = 'O nome da campânula é obrigatório.';
      isValid = false;
    }

    if (!codigo.trim()) {
      newErrors.codigo = 'O código da campânula é obrigatório.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Função de salvar corrigida para interagir com o Supabase
  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // 1. Obter o usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado.');
      }

      // 2. Verificar se a campânula com o código informado existe e se já não foi vinculada
      const { data: campanula, error: fetchError } = await supabase
        .from('campanulas')
        .select('userID')
        .eq('id', codigo.trim())
        .single();

      if (fetchError || !campanula) {
        Alert.alert('Erro', 'Nenhuma campânula encontrada com este código. Verifique e tente novamente.');
        setIsLoading(false);
        return;
      }

      if (campanula.userID) {
        Alert.alert('Atenção', 'Esta campânula já foi adicionada por outro usuário.');
        setIsLoading(false);
        return;
      }

      // 3. Se a campânula existir e não tiver dono, atualize-a com o nome e o userID.
      const { error: updateError } = await supabase
        .from('campanulas')
        .update({
          nome: nome.trim(),
          userID: user.id,
        })
        .eq('id', codigo.trim());

      if (updateError) {
        throw updateError;
      }

      Alert.alert(
        'Sucesso!',
        'Sua campânula foi adicionada com sucesso.',
        [{ text: 'OK', onPress: () => router.back() }]
      );

    } catch (error: any) {
      console.error('Error adding campanula:', error);
      Alert.alert('Erro', error.message || 'Não foi possível adicionar a campânula.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.title}>Adicionar Campânula</Text>
            <Text style={styles.subtitle}>Configure sua nova campânula</Text>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nome da Campânula</Text>
            <TextInput
              style={[styles.input, errors.nome ? styles.inputError : null]}
              value={nome}
              onChangeText={setNome}
              placeholder="Ex: Campânula Azul"
              placeholderTextColor="#6b7280"
              editable={!isLoading}
            />
            {errors.nome ? <Text style={styles.errorText}>{errors.nome}</Text> : null}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Código da Campânula</Text>
            <TextInput
              style={[styles.input, errors.codigo ? styles.inputError : null]}
              value={codigo}
              onChangeText={setCodigo}
              placeholder="Ex: CAMP001"
              placeholderTextColor="#6b7280"
              editable={!isLoading}
              autoCapitalize="characters"
            />
            {errors.codigo ? <Text style={styles.errorText}>{errors.codigo}</Text> : null}
          </View>

          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Save size={20} color="#fff" />
            )}
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  form: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  saveButtonDisabled: {
    backgroundColor: '#6b7280',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
