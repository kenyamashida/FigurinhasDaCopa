import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useRouter } from 'expo-router';

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={[styles.title, { color: colors.text }]}>Ops! Algo deu errado.</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Encontramos um erro inesperado. Nossa equipe já foi notificada (mentira, foi não).
      </Text>
      <View style={[styles.errorBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>{error.message}</Text>
      </View>
      
      <View style={styles.buttons}>
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={retry}>
          <Text style={styles.buttonText}>Tentar Novamente</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.buttonOutline, { borderColor: colors.primary }]} onPress={() => router.replace('/')}>
          <Text style={[styles.buttonOutlineText, { color: colors.primary }]}>Voltar ao Início</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorBox: {
    width: '100%',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 32,
  },
  errorText: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  buttons: {
    width: '100%',
    gap: 12,
  },
  button: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonOutline: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  buttonOutlineText: {
    fontSize: 16,
    fontWeight: 'bold',
  }
});
