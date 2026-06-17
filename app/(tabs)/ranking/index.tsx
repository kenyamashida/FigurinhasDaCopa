import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useRanking } from '../../../hooks/useRanking';
import { supabase } from '../../../lib/supabase';
import { useTheme } from '../../../hooks/useTheme';
import SkeletonCard from '../../../components/SkeletonCard';

export default function RankingScreen() {
  const { leaderboard, isLoading } = useRanking();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { colors } = useTheme();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, padding: 24, gap: 12 }]}>
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} height={80} />
        ))}
      </View>
    );
  }

  // Verifica se o usuário atual está no Top 3
  const myRank = leaderboard?.find((u: any) => u.id === currentUserId);
  const isTop3 = myRank && myRank.posicao <= 3;

  const renderItem = ({ item }: { item: any }) => {
    const isMe = item.id === currentUserId;
    
    // Define a cor da medalha
    let medalColor = 'transparent';
    let medalText = item.posicao.toString();
    if (item.posicao === 1) { medalColor = '#FFD700'; medalText = '🥇'; }
    else if (item.posicao === 2) { medalColor = '#C0C0C0'; medalText = '🥈'; }
    else if (item.posicao === 3) { medalColor = '#CD7F32'; medalText = '🥉'; }

    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, isMe && [styles.cardMe, { borderColor: colors.primary }]]}>
        <View style={styles.rankBadge}>
          <Text style={[styles.rankText, { color: colors.text }]}>{medalText}</Text>
        </View>
        <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
          <Text style={styles.avatarText}>{item.nome?.charAt(0).toUpperCase() || 'U'}</Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }, isMe && [styles.nameMe, { color: colors.primary }]]}>
            {item.nome} {isMe && '(Você)'}
          </Text>
          <Text style={[styles.stats, { color: colors.textSecondary }]}>{item.total_coladas} figurinhas • {item.porcentagem}%</Text>
          {item.posicao <= 3 && (
            <Text style={[styles.rewardText, { color: colors.primary }]}>🎁 Elegível a Pacote Grátis!</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.secondary }]}>
        <Text style={styles.title}>Top Colecionadores 🏆</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Os maiores negociadores da região</Text>
      </View>

      {isTop3 && (
        <View style={[styles.rewardBanner, { backgroundColor: colors.background, borderColor: colors.primary }]}>
          <Text style={[styles.rewardBannerTitle, { color: colors.primary }]}>🎉 Parabéns! Você está no Top 3!</Text>
          <Text style={[styles.rewardBannerText, { color: colors.text }]}>
            Vá a qualquer Ponto de Troca Oficial (Banca Dourada no Mapa) e mostre esta tela para resgatar 1 pacote de figurinhas grátis!
          </Text>
        </View>
      )}

      <FlatList
        data={leaderboard}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9FF',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 24,
    backgroundColor: '#0A2540',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#D1E3F8',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D1E3F8',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardMe: {
    backgroundColor: '#FFF3F4', // Fundo levemente avermelhado para destacar o usuário
    borderColor: '#E61D25',
    borderWidth: 2,
  },
  rankBadge: {
    width: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A2540',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0A2540',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0A2540',
    marginBottom: 4,
  },
  nameMe: {
    color: '#E61D25',
  },
  stats: {
    fontSize: 14,
    color: '#666',
  },
  rewardText: {
    fontSize: 12,
    color: '#E61D25',
    fontWeight: 'bold',
    marginTop: 4,
  },
  rewardBanner: {
    backgroundColor: '#FFF3F4',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E61D25',
  },
  rewardBannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E61D25',
    marginBottom: 8,
  },
  rewardBannerText: {
    fontSize: 14,
    color: '#0A2540',
  },
});
