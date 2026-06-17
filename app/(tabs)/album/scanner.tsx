import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence } from 'react-native-reanimated';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useAlbum } from '../../../hooks/useAlbum';
import catalogo from '../../../data/catalogo-figurinhas.json';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const router = useRouter();
  const { toggleSticker } = useAlbum();

  // Animated line for scanning effect
  const translateY = useSharedValue(0);

  const startScanningAnimation = () => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(340, { duration: 1500, easing: Easing.linear }),
        withTiming(0, { duration: 1500, easing: Easing.linear })
      ),
      -1, // infinite
      true
    );
  };

  const stopScanningAnimation = () => {
    translateY.value = 0;
  };

  const animatedLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!permission) {
    return <View style={styles.center}><ActivityIndicator /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ textAlign: 'center', marginBottom: 16 }}>Precisamos da permissão da câmera para escanear as figurinhas.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Dar Permissão</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleScan = async () => {
    setScanning(true);
    startScanningAnimation();
    // Simulando o processo de OCR / Visão Computacional
    setTimeout(() => {
      setScanning(false);
      stopScanningAnimation();
      // Sorteia uma figurinha aleatória do catálogo para simular o que a IA leu
      const randomSticker = catalogo[Math.floor(Math.random() * catalogo.length)];
      
      Alert.alert(
        "Figurinha Detectada! 📸",
        `A IA identificou a figurinha: ${randomSticker.codigo} - ${randomSticker.nome_jogador} (${randomSticker.selecao})\n\nDeseja marcá-la no seu álbum?`,
        [
          { text: "Cancelar", style: "cancel" },
          { 
            text: "Colar!", 
            onPress: () => {
              // Passamos 0 para atual para forçar o upsert a setar como 1 (colada)
              toggleSticker.mutate({ codigo: randomSticker.codigo, atual: 0 });
              Alert.alert("Sucesso", "Figurinha colada no seu álbum!");
              router.back();
            }
          }
        ]
      );
    }, 2000); // 2 segundos de processamento "IA"
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back">
        <View style={styles.overlay}>
          <View style={styles.frame}>
             {scanning && <Animated.View style={[styles.scanLine, animatedLineStyle]} />}
          </View>
          <Text style={styles.instructions}>Centralize a figurinha no quadro abaixo para a IA reconhecer o código.</Text>
          
          <TouchableOpacity 
            style={[styles.scanButton, scanning && styles.scanningButton]} 
            onPress={handleScan}
            disabled={scanning}
          >
            {scanning ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.scanButtonText}>🔍 Escanear Figurinha</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <Text style={styles.closeButtonText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
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
    padding: 24,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  frame: {
    width: 250,
    height: 350,
    borderWidth: 2,
    borderColor: '#F1C40F', // Dourado
    backgroundColor: 'transparent',
    marginBottom: 24,
    borderRadius: 8,
    overflow: 'hidden',
  },
  scanLine: {
    width: '100%',
    height: 3,
    backgroundColor: '#E61D25',
    shadowColor: '#E61D25',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 5,
  },
  instructions: {
    color: '#FFF',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 24,
  },
  scanButton: {
    backgroundColor: '#E61D25',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  scanningButton: {
    backgroundColor: '#0A2540',
  },
  scanButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 16,
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#0A2540',
    padding: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFF',
  }
});
