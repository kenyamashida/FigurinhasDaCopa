import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useLocation } from '../../../hooks/useLocation';
import { useTheme } from '../../../hooks/useTheme';

export default function MapaScreen() {
  const router = useRouter();
  const { location, errorMsg, nearbyUsers, isLoadingNearby, tradePoints } = useLocation();
  const { colors } = useTheme();

  if (errorMsg) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>{errorMsg}</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Obtendo sua localização...</Text>
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ fontSize: 18, color: colors.text, textAlign: 'center', padding: 20 }}>
          🗺️ O Mapa Interativo não está disponível na versão Web.
        </Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', padding: 20 }}>
          Por favor, utilize o aplicativo nativo (Android/iOS) para acessar o radar e encontrar colecionadores próximos de você.
        </Text>
      </View>
    );
  }

  // Importa dinamicamente apenas no Native para evitar crash no Web
  const MapView = require('react-native-maps').default;
  const { Marker, Callout } = require('react-native-maps');

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {/* Marcadores de Usuários */}
        {nearbyUsers?.map((user: any) => (
          <Marker
            key={`user_${user.id}`}
            coordinate={{
              latitude: user.latitude,
              longitude: user.longitude,
            }}
            pinColor={colors.secondary}
          >
            <Callout onPress={() => router.push('/(tabs)/match')}>
              <View style={styles.calloutContainer}>
                <Text style={[styles.calloutTitle, { color: colors.text }]}>{user.nome}</Text>
                <Text style={[styles.calloutSubtitle, { color: colors.textSecondary }]}>
                  A {(user.distancia_metros / 1000).toFixed(1)} km de você
                </Text>
                <Text style={[styles.calloutAction, { color: colors.primary }]}>Tocar para propor troca</Text>
              </View>
            </Callout>
          </Marker>
        ))}

        {/* Marcadores de Pontos Oficiais de Troca */}
        {tradePoints?.map((point: any) => (
          <Marker
            key={`tp_${point.id}`}
            coordinate={{
              latitude: point.latitude,
              longitude: point.longitude,
            }}
            pinColor={colors.accent}
          >
            <Callout>
              <View style={styles.calloutContainer}>
                <Text style={[styles.calloutTitle, { color: colors.text }]}>📍 {point.nome}</Text>
                <Text style={[styles.calloutSubtitle, { color: colors.textSecondary }]}>{point.descricao}</Text>
                <Text style={[styles.calloutSubtitle, { color: colors.textSecondary }]}>
                  A {(point.distancia_metros / 1000).toFixed(1)} km de você
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      <View style={[styles.overlay, { backgroundColor: colors.surface }]}>
        <Text style={[styles.overlayText, { color: colors.text }]}>
          {isLoadingNearby ? "Buscando colecionadores..." : `${nearbyUsers?.length || 0} colecionadores num raio de 5km`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F9FF',
  },
  errorText: {
    color: '#E61D25',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#0A2540',
    fontSize: 16,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  calloutContainer: {
    padding: 8,
    alignItems: 'center',
    minWidth: 150,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#0A2540',
  },
  calloutSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  calloutAction: {
    fontSize: 12,
    color: '#E61D25',
    fontWeight: 'bold',
    marginTop: 8,
  },
  overlay: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  overlayText: {
    color: '#0A2540',
    fontWeight: 'bold',
    fontSize: 14,
  }
});
