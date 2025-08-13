import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Thermometer, Sun, Droplets, Trash2 } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase, Campanula } from '@/lib/supabase';
import { LineChart } from 'react-native-chart-kit';

interface TemperatureReading {
  temperatura: number;
  created_at: string;
}

// --- FUNÇÃO ADICIONADA PARA DETERMINAR A COR DA TEMPERATURA ---
const getTemperatureColor = (
  temp_atual?: number | null,
  temp_min?: number | null,
  temp_max?: number | null
) => {
  if (temp_atual == null || temp_min == null || temp_max == null) {
    return '#fff'; // Cor padrão (branco)
  }

  if (temp_atual > temp_max || temp_atual < temp_min) {
    return '#ef4444'; // Vermelho
  }
  if (temp_atual >= temp_max - 1 || temp_atual <= temp_min + 1) {
    return '#f59e0b'; // Amarelo
  }
  return '#4ade80'; // Verde
};
// ----------------------------------------------------------------

export default function DetailScreen() {
  const { nome, codigo } = useLocalSearchParams<{ nome: string; codigo: string }>();
  const [data, setData] = useState<Campanula | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRemoving, setIsRemoving] = useState(false);
  const [chartData, setChartData] = useState<any>(null);
  const [isLoadingChart, setIsLoadingChart] = useState(true);

  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    if (!codigo) return;
    
    fetchData();
    fetchChartData();
    
    const interval = setInterval(() => {
      fetchData();
      fetchChartData();
    }, 5000); 

    return () => clearInterval(interval);
  }, [codigo]);

  const fetchData = async () => {
    // ... (função fetchData inalterada)
    if (!codigo) return;
    try {
      const { data: result, error } = await supabase
        .from('campanulas')
        .select('*')
        .eq('id', codigo)
        .maybeSingle();

      if (error) {
        console.error('Error fetching campanula data:', error);
      } else {
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching campanula data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChartData = async () => {
    // ... (função fetchChartData inalterada)
    if (!codigo) return;
    
    setIsLoadingChart(true);
    try {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { data: readings, error } = await supabase
        .from('leituras_sensores')
        .select('temperatura, created_at')
        .eq('campanula_id', codigo)
        .gte('created_at', twentyFourHoursAgo.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching chart data:', error);
        setChartData(null);
        return;
      }

      if (!readings || readings.length === 0) {
        setChartData(null);
        return;
      }

      const processedData = processChartData(readings);
      setChartData(processedData);

    } catch (error) {
      console.error('Error fetching chart data:', error);
      setChartData(null);
    } finally {
      setIsLoadingChart(false);
    }
  };

  const processChartData = (readings: TemperatureReading[]) => {
    // ... (função processChartData inalterada)
    if (!readings || readings.length === 0) return null;

    const intervalData: { [key: string]: number[] } = {};

    readings.forEach(reading => {
      const date = new Date(reading.created_at);
      const hour = date.getHours();
      const minutes = date.getMinutes();

      const intervalKey = minutes < 30
        ? `${hour.toString().padStart(2, '0')}:00`
        : `${hour.toString().padStart(2, '0')}:30`;

      if (!intervalData[intervalKey]) {
        intervalData[intervalKey] = [];
      }
      intervalData[intervalKey].push(reading.temperatura);
    });

    const sortedKeys = Object.keys(intervalData).sort((a, b) => {
      const [hourA, minA] = a.split(':').map(Number);
      const [hourB, minB] = b.split(':').map(Number);
      if (hourA !== hourB) {
        return hourA - hourB;
      }
      return minA - minB;
    });

    const labels: string[] = [];
    const temperatures: number[] = [];

    sortedKeys.forEach(key => {
      const temps = intervalData[key];
      const avgTemp = temps.reduce((sum, temp) => sum + temp, 0) / temps.length;

      labels.push(key);
      temperatures.push(Math.round(avgTemp * 10) / 10);
    });

    const displayLabels = labels.map((label, index) => {
      return index % 8 === 0 ? label : '';
    });

    return {
      labels: displayLabels,
      datasets: [
        {
          data: temperatures,
          color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  };

  const handleRemove = () => {
    // ... (função handleRemove inalterada)
    Alert.alert(
      'Remover Campânula',
      `Tem certeza que deseja remover "${nome}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            setIsRemoving(true);
            try {
              const { error } = await supabase
                .from('campanulas')
                .update({ 
                  userID: null, 
                  nome: null 
                })
                .eq('id', codigo);

              if (error) {
                throw error;
              }
              
              Alert.alert('Sucesso', 'A campânula foi removida.');
              router.replace('/');

            } catch (error: any) {
              console.error('Error removing campanula:', error);
              Alert.alert('Erro', 'Não foi possível remover a campânula.');
            } finally {
              setIsRemoving(false);
            }
          }
        }
      ]
    );
  };

  const chartConfig = {
    // ... (configuração do gráfico inalterada)
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'transparent',
    backgroundGradientTo: 'transparent',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    fillShadowGradientOpacity: 0.7,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#ef4444',
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: 'rgba(255, 255, 255, 0.2)',
      strokeWidth: 1,
    },
  };
  
  // --- APLICAÇÃO DA COR DINÂMICA ---
  const temperatureColor = getTemperatureColor(
    data?.temp_atual,
    data?.temp_min,
    data?.temp_max
  );
  // ------------------------------------

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.title}>{nome}</Text>
            <Text style={styles.subtitle}>Código: {codigo}</Text>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.dataSection}>
            <Text style={styles.sectionTitle}>Dados Atuais</Text>
            
            <View style={styles.dataGrid}>
              <View style={styles.dataCard}>
                <Thermometer size={24} color="#ef4444" />
                {/* ESTILO DA COR APLICADO AQUI */}
                <Text style={[styles.dataValue, { color: temperatureColor }]}>
                  {isLoading ? '--' : data?.temp_atual ?? '--'}°C
                </Text>
                <Text style={styles.dataLabel}>Temperatura</Text>
              </View>
              
              <View style={styles.dataCard}>
                <Sun size={24} color="#f59e0b" />
                <Text style={styles.dataValue}>
                  {isLoading ? '--' : data?.intensidade ?? '--'}%
                </Text>
                <Text style={styles.dataLabel}>Potência</Text>
              </View>
              
              <View style={styles.dataCard}>
                <Droplets size={24} color="#3b82f6" />
                <Text style={styles.dataValue}>
                  {isLoading ? '--' : data?.umidade ?? '--'}%
                </Text>
                <Text style={styles.dataLabel}>Umidade</Text>
              </View>
            </View>

            <View style={styles.configGrid}>
              <View style={styles.configCard}>
                <Text style={styles.configLabel}>Temp. Máxima</Text>
                <Text style={styles.configValue}>
                  {data?.temp_max ?? '--'}°C
                </Text>
              </View>
              
              <View style={styles.configCard}>
                <Text style={styles.configLabel}>Temp. Mínima</Text>
                <Text style={styles.configValue}>
                  {data?.temp_min ?? '--'}°C
                </Text>
              </View>
              
              <View style={styles.configCard}>
                <Text style={styles.configLabel}>Dia</Text>
                <Text style={styles.configValue}>
                  {data?.dia ?? '--'}
                </Text>
              </View>
            </View>
          </View>

          {/* Seção do Gráfico (inalterada) */}
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>Temperatura nas Últimas 24h</Text>
            
            {isLoadingChart ? (
              <View style={styles.chartLoadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loadingText}>Carregando dados do gráfico...</Text>
              </View>
            ) : chartData ? (
              <View style={styles.chartContainer}>
                <LineChart
                  data={chartData}
                  width={screenWidth - 48}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                  withDots={true}
                  withShadow={true} 
                  withVerticalLabels={true}
                  withHorizontalLabels={true}
                  fromZero={true}
                />
              </View>
            ) : (
              <View style={styles.noDataContainer}>
                <Thermometer size={48} color="#6b7280" />
                <Text style={styles.noDataText}>
                  Nenhum dado de temperatura recente para exibir
                </Text>
                <Text style={styles.noDataSubtext}>
                  Os dados aparecerão aqui quando houver leituras nas últimas 24 horas
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.removeButton, isRemoving && styles.removeButtonDisabled]} 
            onPress={handleRemove}
            disabled={isRemoving}
          >
            {isRemoving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Trash2 size={20} color="#fff" />
            )}
            <Text style={styles.removeButtonText}>
              {isRemoving ? 'Removendo...' : 'Remover Campânula'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ... (o restante do código de styles permanece o mesmo)
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  dataSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  dataGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dataCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  dataValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  dataLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  configGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  configCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  configLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  configValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  chartSection: {
    marginBottom: 32,
  },
  chartContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chart: {
    borderRadius: 16,
  },
  chartLoadingContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: 16,
    marginTop: 12,
  },
  noDataContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  noDataText: {
    color: '#9ca3af',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '600',
  },
  noDataSubtext: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  removeButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  removeButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
