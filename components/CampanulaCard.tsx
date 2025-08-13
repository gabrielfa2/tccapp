import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Thermometer, Sun, Droplets, Wifi, WifiOff } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase, Campanula } from '@/lib/supabase';

interface CampanulaCardProps {
  campanula: Campanula;
  color: string;
  onPress: () => void;
}

const CARD_GRADIENTS = [
  ['#1a1a1a', '#2d2d2d'], // Dark gray
  ['#0f0f0f', '#1f1f1f'], // Almost black
  ['#1e1e1e', '#2a2a2a'], // Charcoal
  ['#141414', '#252525'], // Dark charcoal
  ['#0d0d0d', '#1d1d1d'], // Deep black
  ['#1c1c1c', '#2c2c2c'], // Medium dark
];

export default function CampanulaCard({ campanula, color, onPress }: CampanulaCardProps) {
  const [data, setData] = useState<Campanula | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: result, error } = await supabase
          .from('campanulas')
          .select('*')
          .eq('id', campanula.id)
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

    fetchData();
    const interval = setInterval(fetchData, 10000);

    return () => clearInterval(interval);
  }, [campanula.id]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const gradientIndex = Math.abs(campanula.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % CARD_GRADIENTS.length;
  const gradient = CARD_GRADIENTS[gradientIndex];
  const isOnline = data !== null;

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
    >
      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
        {/* Dark Gradient Background */}
        <LinearGradient
          colors={gradient}
          style={styles.gradientBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Subtle Pattern Overlay */}
        <View style={styles.patternOverlay} />

        {/* Card Content */}
        <View style={styles.cardContent}>
          {/* Header with Status */}
          <View style={styles.header}>
            <View style={styles.statusIndicator}>
              {isOnline ? (
                <Wifi size={16} color="#4ADE80" />
              ) : (
                <WifiOff size={16} color="#EF4444" />
              )}
            </View>
          </View>

          {/* Main Content */}
          <View style={styles.mainContent}>
            <Text style={styles.name} numberOfLines={2}>
              {campanula.nome}
            </Text>
            <Text style={styles.code}>
              @{campanula.id.toLowerCase()}
            </Text>
          </View>

          {/* Data Grid */}
          <View style={styles.dataGrid}>
            <View style={styles.dataRow}>
              <View style={styles.dataItem}>
                <View style={styles.iconContainer}>
                  <Thermometer size={18} color="#ef4444" />
                </View>
                <View style={styles.dataTextContainer}>
                  <Text style={styles.dataValue}>
                    {isLoading ? '--' : data?.temp_atual ?? '--'}°C
                  </Text>
                  <Text style={styles.dataLabel}>Temperatura</Text>
                </View>
              </View>
            </View>

            <View style={styles.dataRow}>
              <View style={styles.dataItem}>
                <View style={styles.iconContainer}>
                  <Sun size={18} color="#f59e0b" />
                </View>
                <View style={styles.dataTextContainer}>
                  <Text style={styles.dataValue}>
                    {isLoading ? '--' : data?.intensidade ?? '--'}%
                  </Text>
                  <Text style={styles.dataLabel}>Luminosidade</Text>
                </View>
              </View>
            </View>

            <View style={styles.dataRow}>
              <View style={styles.dataItem}>
                <View style={styles.iconContainer}>
                  <Droplets size={18} color="#3b82f6" />
                </View>
                <View style={styles.dataTextContainer}>
                  <Text style={styles.dataValue}>
                    {isLoading ? '--' : data?.umidade ?? '--'}%
                  </Text>
                  <Text style={styles.dataLabel}>Umidade</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity style={styles.actionButton} onPress={onPress}>
            <Text style={styles.actionButtonText}>Ver Detalhes</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 280,
    height: 500, // 9:16 aspect ratio (280 * 16/9 ≈ 500)
    borderRadius: 20,
    marginHorizontal: 12,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  patternOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    opacity: 0.5,
  },
  cardContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
  statusIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 32,
    fontFamily: 'GFSDidot-Regular',
  },
  code: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontWeight: '500',
  },
  dataGrid: {
    gap: 12,
  },
  dataRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dataItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  dataTextContainer: {
    flex: 1,
  },
  dataValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  dataLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
  },
});