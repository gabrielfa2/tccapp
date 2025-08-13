import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '', general: '' });

  // Bloco de Autenticação (sem alterações)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/');
      }
    };
    
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.replace('/');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Função de Validação (sem alterações)
  const validateForm = () => {
    const newErrors = { email: '', password: '', general: '' };
    let isValid = true;

    if (!email.trim()) {
      newErrors.email = 'Email é obrigatório';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email inválido';
      isValid = false;
    }

    if (!password.trim()) {
      newErrors.password = 'Senha é obrigatória';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Função de Login (sem alterações)
  const handleSignIn = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    setErrors({ email: '', password: '', general: '' });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          Alert.alert('Email não confirmado', 'Verifique sua caixa de entrada para ativar sua conta.', [{ text: 'OK' }]);
        } else if (error.message.includes('Invalid login credentials')) {
          setErrors({ ...errors, general: 'Email ou senha incorretos' });
        } else {
          setErrors({ ...errors, general: 'Erro ao fazer login. Tente novamente.' });
        }
        return;
      }

      if (data.user) {
        router.replace('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ ...errors, general: 'Erro inesperado. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  // ==================================================================
  // ✨ FUNÇÃO DE CADASTRO SIMPLIFICADA ✨
  // ==================================================================
  const handleSignUp = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    setErrors({ email: '', password: '', general: '' });

    try {
      // A função agora SÓ se preocupa em chamar o signUp.
      // O trigger que criamos anteriormente cuidará de inserir o usuário na tabela 'usuarios'.
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (error) {
        // A verificação de duplicidade do Supabase já nos protege aqui.
        // E a nossa nova regra 'UNIQUE' no banco de dados é a proteção final.
        if (error.message.includes('User already registered')) {
            setErrors({ ...errors, general: 'Este email já está cadastrado.' });
        } else {
            setErrors({ ...errors, general: 'Erro ao criar conta: ' + error.message });
        }
        return;
      }
      
      // Se o cadastro funcionou, mostramos o alerta para o usuário confirmar o email.
      if (data.user) {
        Alert.alert(
          'Conta criada!',
          'Verifique sua caixa de entrada para confirmar sua conta.',
          [{ text: 'OK', onPress: () => setIsSignUp(false) }]
        );
      }

    } catch (error) {
      console.error('Sign up error:', error);
      setErrors({ ...errors, general: 'Erro inesperado. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };


  // Função de Recuperar Senha (sem alterações)
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setErrors({ ...errors, email: 'Digite seu email para recuperar a senha' });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors({ ...errors, email: 'Email inválido' });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      
      if (error) {
        setErrors({ ...errors, general: 'Erro ao enviar email de recuperação' });
      } else {
        Alert.alert(
          'Email enviado!',
          'Verifique sua caixa de entrada para redefinir sua senha.'
        );
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setErrors({ ...errors, general: 'Erro inesperado. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  // JSX para renderização (sem alterações)
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a1a', '#2d2d2d']}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>
                {isSignUp ? 'Criar Conta' : 'Bem-vindo'}
              </Text>
              <Text style={styles.subtitle}>
                {isSignUp 
                  ? 'Configure sua conta para monitorar suas campânulas'
                  : 'Acesse sua conta para monitorar suas campânulas'
                }
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {errors.general ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errors.general}</Text>
                </View>
              ) : null}

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <View style={[styles.inputWrapper, errors.email ? styles.inputError : null]}>
                  <Mail size={20} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="seu@email.com"
                    placeholderTextColor="#6b7280"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>
                {errors.email ? <Text style={styles.fieldErrorText}>{errors.email}</Text> : null}
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Senha</Text>
                <View style={[styles.inputWrapper, errors.password ? styles.inputError : null]}>
                  <Lock size={20} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Sua senha"
                    placeholderTextColor="#6b7280"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color="#9ca3af" />
                    ) : (
                      <Eye size={20} color="#9ca3af" />
                    )}
                  </TouchableOpacity>
                </View>
                {errors.password ? <Text style={styles.fieldErrorText}>{errors.password}</Text> : null}
              </View>

              {/* Forgot Password Link */}
              {!isSignUp && (
                <TouchableOpacity 
                  style={styles.forgotPasswordButton}
                  onPress={handleForgotPassword}
                  disabled={isLoading}
                >
                  <Text style={styles.forgotPasswordText}>Esqueceu sua senha?</Text>
                </TouchableOpacity>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                onPress={isSignUp ? handleSignUp : handleSignIn}
                disabled={isLoading}
              >
                <Text style={styles.submitButtonText}>
                  {isLoading 
                    ? (isSignUp ? 'Criando conta...' : 'Entrando...') 
                    : (isSignUp ? 'Criar Conta' : 'Entrar')
                  }
                </Text>
                {!isLoading && <ArrowRight size={20} color="#fff" style={styles.submitIcon} />}
              </TouchableOpacity>

              {/* Toggle Sign Up/Sign In */}
              <View style={styles.toggleContainer}>
                <Text style={styles.toggleText}>
                  {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setIsSignUp(!isSignUp);
                    setErrors({ email: '', password: '', general: '' });
                    setPassword('');
                  }}
                  disabled={isLoading}
                >
                  <Text style={styles.toggleLink}>
                    {isSignUp ? 'Fazer Login' : 'Criar Conta'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// Estilos (sem alterações)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    fontFamily: 'GFSDidot-Regular',
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    paddingVertical: 12,
  },
  eyeButton: {
    padding: 4,
  },
  fieldErrorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 4,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 32,
  },
  forgotPasswordText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#6b7280',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitIcon: {
    marginLeft: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  toggleText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  toggleLink: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
});
