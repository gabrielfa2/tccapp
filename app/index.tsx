import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, LogOut } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import CampanulaCard from '@/components/CampanulaCard';
import { router } from 'expo-router';
import { supabase, Campanula } from '@/lib/supabase';

const CARD_COLORS = [
  '#37474f',
  '#00695c',
  '#5d4037',
  '#303f9f',
  '#d84315',
  '#7b1fa2',
];

export default function DashboardScreen() {
  const [campanulas, setCampanulas] = useState<Campanula[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const screenWidth = Dimensions.get('window').width;

  // Hooks de autenticação e carregamento de dados (sem alterações)
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
        return;
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        router.replace('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadCampanulas = async () => {
    setIsLoading(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (session) {
        const { data, error } = await supabase
          .from('campanulas')
          .select('*')
          .eq('userID', session.user.id);

        if (error) {
          throw error;
        }

        if (data) {
          setCampanulas(data);
        }
      } else {
        setCampanulas([]);
      }
    } catch (error) {
      console.error('Error loading campanulas from Supabase:', error);
      Alert.alert('Erro', 'Não foi possível carregar suas campânulas.');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCampanulas();
    }, [])
  );

  // Funções de manipulação de eventos (sem alterações)
  const handleCardPress = (campanula: Campanula) => {
    router.push({
      pathname: '/detail',
      params: {
        nome: campanula.nome,
        codigo: campanula.id
      }
    });
  };

  const handleScroll = (event: any) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const cardWidth = 280 + 24;
    const newIndex = Math.round(scrollX / cardWidth);
    setCurrentIndex(newIndex);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Carregando suas campânulas...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* O botão de logout foi REMOVIDO do cabeçalho */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Suas Campânulas</Text>
            <Text style={styles.subtitle}>Monitoramento em tempo real</Text>
          </View>
        </View>

        {campanulas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Nenhuma Campânula</Text>
            <Text style={styles.emptySubtitle}>
              Clique no botão + para adicionar sua primeira campânula!
            </Text>
          </View>
        ) : (
          <View style={styles.carouselContainer}>
            <ScrollView
              ref={scrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              decelerationRate="fast"
              snapToInterval={280 + 24}
              snapToAlignment="center"
              contentContainerStyle={[
                styles.scrollContent,
                { paddingHorizontal: (screenWidth - 280) / 2 },
              ]}
              style={styles.scrollView}
            >
              {campanulas.map((campanula, index) => (
                <CampanulaCard
                  key={campanula.id}
                  campanula={campanula}
                  color={CARD_COLORS[index % CARD_COLORS.length]}
                  onPress={() => handleCardPress(campanula)}
                />
              ))}
            </ScrollView>

            {campanulas.length > 1 && (
              <View style={styles.pagination}>
                {campanulas.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      index === currentIndex && styles.paginationDotActive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* ✨ NOVO CONTAINER PARA OS BOTÕES DE AÇÃO ✨ */}
        <View style={styles.actionsContainer}>
          {/* Botão de Logout agora está aqui */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <LogOut size={24} color="#fff" />
          </TouchableOpacity>

          {/* Botão de Adicionar (+) */}
          <TouchableOpacity
            style={styles.fab}
            onPress={() => router.push('/add')}
          >
            <Plus size={28} color="#fff" />
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
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 70,
    paddingBottom: 32,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    color: '#fff',
    marginBottom: 8,
    fontFamily: 'GFSDidot-Regular',
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#9ca3af',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  carouselContainer: {
    flex: 1,
    paddingBottom: 100,
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  paginationDotActive: {
    backgroundColor: '#fff',
    width: 24,
  },
  // ✨ ESTILOS ATUALIZADOS E NOVOS ✨
  actionsContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16, // Espaço entre os botões
  },
  logoutButton: {
    // Estilo antigo foi removido. Novo estilo para se parecer com um botão de ação.
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#374151', // Cor cinza escuro
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fab: {
    // A posição absoluta foi removida, pois agora é controlada pelo 'actionsContainer'
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
