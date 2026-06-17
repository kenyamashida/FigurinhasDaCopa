import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, TextInput, ScrollView } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../hooks/useTheme';
import { useAlbum } from '../../../hooks/useAlbum';
import { useHistorico } from '../../../hooks/useHistorico';
import { useConquistas } from '../../../hooks/useConquistas';

export default function PerfilScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { inventario } = useAlbum();
  const { historico, isLoading: loadingHistorico } = useHistorico();
  const { conquistas, isLoading: loadingConquistas } = useConquistas();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [nome, setNome] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.user.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setNome(data.nome);
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ nome })
        .eq('id', user.user.id);

      if (error) throw error;
      
      setProfile({ ...profile, nome });
      setIsEditing(false);
      Alert.alert('Sucesso', 'Perfil atualizado!');
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const totalColadas = inventario?.filter((i: any) => i.quantidade_colada > 0).length || 0;
  const totalRepetidas = inventario?.reduce((acc: number, curr: any) => acc + (curr.quantidade_repetida || 0), 0) || 0;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
          <Text style={styles.avatarText}>{profile?.nome?.charAt(0).toUpperCase() || 'U'}</Text>
        </View>
        
        {isEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={nome}
              onChangeText={setNome}
              placeholder="Seu nome"
              placeholderTextColor={colors.textSecondary}
            />
            <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.secondary }]} onPress={saveProfile}>
              <Text style={styles.saveButtonText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.nameContainer}>
            <Text style={[styles.name, { color: colors.text }]}>{profile?.nome}</Text>
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Text style={[styles.editLink, { color: colors.primary }]}>Editar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Dashboard de Estatísticas */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Minhas Estatísticas</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{totalColadas}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Coladas</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.secondary }]}>{totalRepetidas}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Repetidas</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.accent }]}>{historico?.length || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Trocas Realizadas</Text>
          </View>
        </View>
      </View>

      {/* Conquistas / Badges */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Minhas Conquistas</Text>
        {loadingConquistas ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgesContainer}>
            {conquistas.map((conquista: any) => (
              <View 
                key={conquista.id} 
                style={[
                  styles.badgeCard, 
                  { backgroundColor: conquista.desbloqueada ? colors.surface : colors.background, borderColor: conquista.desbloqueada ? colors.accent : colors.border },
                  !conquista.desbloqueada && { opacity: 0.5 }
                ]}
              >
                <Text style={styles.badgeIcon}>{conquista.icone}</Text>
                <Text style={[styles.badgeName, { color: colors.text }]} numberOfLines={1}>{conquista.nome}</Text>
                {conquista.desbloqueada && (
                  <Text style={[styles.badgePoints, { color: colors.accent }]}>+{conquista.pontos} pts</Text>
                )}
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Histórico de Trocas */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Histórico de Trocas</Text>
        {loadingHistorico ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : historico && historico.length > 0 ? (
          historico.map((troca: any) => (
            <View key={troca.id} style={[styles.historyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.historyHeader}>
                <Text style={[styles.historyDate, { color: colors.textSecondary }]}>{troca.data}</Text>
                <Text style={[styles.historyPartner, { color: colors.text }]}>Trocou com <Text style={{ fontWeight: 'bold' }}>{troca.parceiro_nome}</Text></Text>
              </View>
              <View style={styles.historyDetails}>
                <View style={styles.historyCol}>
                  <Text style={[styles.historyAction, { color: colors.error }]}>Dadas: {troca.figurinhas_dadas.length}</Text>
                  <Text style={[styles.historyCodes, { color: colors.textSecondary }]}>{troca.figurinhas_dadas.join(', ')}</Text>
                </View>
                <View style={styles.historyCol}>
                  <Text style={[styles.historyAction, { color: colors.success }]}>Recebidas: {troca.figurinhas_recebidas.length}</Text>
                  <Text style={[styles.historyCodes, { color: colors.textSecondary }]}>{troca.figurinhas_recebidas.join(', ')}</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>Nenhuma troca registrada ainda.</Text>
          </View>
        )}
      </View>

      <View style={[styles.optionsContainer, { marginTop: 32 }]}>
        <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.surface, borderColor: colors.primary }]} onPress={handleLogout}>
          <Text style={[styles.logoutButtonText, { color: colors.primary }]}>Sair do Aplicativo</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9FF',
    padding: 24,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#0A2540',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    color: '#FFF',
    fontWeight: 'bold',
  },
  nameContainer: {
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0A2540',
    marginBottom: 8,
  },
  editLink: {
    color: '#E61D25',
    fontSize: 16,
    fontWeight: '600',
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1E3F8',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    minWidth: 200,
  },
  saveButton: {
    backgroundColor: '#0A2540',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  optionsContainer: {
    marginTop: 'auto',
  },
  logoutButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E61D25',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#E61D25',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  historyCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historyDate: {
    fontSize: 12,
  },
  historyPartner: {
    fontSize: 14,
  },
  historyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyCol: {
    flex: 1,
  },
  historyAction: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  historyCodes: {
    fontSize: 12,
  },
  emptyState: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
  },
  badgesContainer: {
    gap: 12,
    paddingRight: 24,
  },
  badgeCard: {
    width: 100,
    height: 110,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  badgePoints: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 4,
  }
});
