import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useMatches } from '../../../hooks/useMatches';
import { useTheme } from '../../../hooks/useTheme';
import SkeletonCard from '../../../components/SkeletonCard';

const { width } = Dimensions.get('window');

export default function MatchScreen() {
  const { perfectMatches, isLoadingMatches, requestTrade } = useMatches();
  const { colors } = useTheme();

  if (isLoadingMatches) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, padding: 24, gap: 16 }]}>
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} height={180} />
        ))}
      </View>
    );
  }

  if (!perfectMatches || perfectMatches.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={styles.emoji}>🔍</Text>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhum Match Perfeito ainda</Text>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Continue colando figurinhas e marcando suas repetidas para o algoritmo encontrar parceiros!
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>Trocas Inteligentes</Text>
      <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
        Cruzamos o seu inventário com o de outras pessoas. Estes usuários têm o que você quer e precisam do que você tem!
      </Text>

      {perfectMatches.map((match: any, index: number) => (
        <View key={index} style={[styles.matchCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.secondary }]}>
              <Text style={styles.avatarText}>{match.parceiro_nome?.charAt(0).toUpperCase() || 'U'}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: colors.text }]}>{match.parceiro_nome}</Text>
              <Text style={[styles.matchScore, { color: colors.primary }]}>Score: {match.score_match} pontos de troca</Text>
            </View>
          </View>

          <View style={[styles.stickersBox, { backgroundColor: colors.background }]}>
            <View style={styles.stickerRow}>
              <Text style={[styles.boxTitle, { color: colors.text }]}>Você precisa:</Text>
              <Text style={[styles.codesText, { color: colors.text }]}>{match.figurinhas_para_receber.slice(0, 5).join(', ')}{match.figurinhas_para_receber.length > 5 ? '...' : ''}</Text>
            </View>
            
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.stickerRow}>
              <Text style={[styles.boxTitle, { color: colors.text }]}>Eles precisam:</Text>
              <Text style={[styles.codesText, { color: colors.text }]}>{match.figurinhas_para_dar.slice(0, 5).join(', ')}{match.figurinhas_para_dar.length > 5 ? '...' : ''}</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.tradeButton, { backgroundColor: colors.primary }]}
            onPress={() => requestTrade.mutate(match.parceiro_id)}
            disabled={requestTrade.isPending}
          >
            <Text style={styles.tradeButtonText}>Propor Troca</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9FF',
  },
  content: {
    padding: 24,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F9FF',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#0A2540',
    fontSize: 16,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0A2540',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0A2540',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  matchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D1E3F8',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0A2540',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A2540',
  },
  matchScore: {
    fontSize: 14,
    color: '#E61D25',
    fontWeight: '600',
  },
  stickersBox: {
    backgroundColor: '#F5F9FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  stickerRow: {
    marginVertical: 4,
  },
  boxTitle: {
    fontSize: 12,
    color: '#0A2540',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  codesText: {
    fontSize: 14,
    color: '#0A2540',
  },
  divider: {
    height: 1,
    backgroundColor: '#D1E3F8',
    marginVertical: 8,
  },
  tradeButton: {
    backgroundColor: '#E61D25',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  tradeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
