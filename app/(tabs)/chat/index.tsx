import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useActiveMatches } from '../../../hooks/useChat';
import { useTheme } from '../../../hooks/useTheme';
import SkeletonCard from '../../../components/SkeletonCard';

export default function ChatListScreen() {
  const router = useRouter();
  const { activeMatches, isLoading } = useActiveMatches();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, padding: 24, gap: 12 }]}>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} height={80} />
        ))}
      </View>
    );
  }

  if (!activeMatches || activeMatches.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={styles.emptyEmoji}>💬</Text>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhuma conversa</Text>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Proponha trocas na aba Match para iniciar conversas.</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.chatCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => router.push(`/chat/${item.id}`)}
    >
      <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
        <Text style={styles.avatarText}>{item.parceiro.nome?.charAt(0).toUpperCase() || 'U'}</Text>
      </View>
      <View style={styles.chatInfo}>
        <Text style={[styles.userName, { color: colors.text }]}>{item.parceiro.nome}</Text>
        <Text style={[styles.previewMessage, { color: colors.textSecondary }]}>Toque para combinar o encontro...</Text>
      </View>
      {/* TODO: Implementar lógica real de mensagens não lidas */}
      {/* <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]} /> */}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={activeMatches}
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
    padding: 24,
  },
  list: {
    padding: 16,
  },
  emptyEmoji: {
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
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D1E3F8',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  avatar: {
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  chatInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0A2540',
    marginBottom: 4,
  },
  previewMessage: {
    fontSize: 14,
    color: '#666',
  },
  unreadBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E61D25',
  },
});
