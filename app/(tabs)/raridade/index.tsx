import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Dimensions } from 'react-native';
import catalogo from '../../../data/catalogo-figurinhas.json';
import { useRaridadeDinamica } from '../../../hooks/useRaridade';
import { useAlbum } from '../../../hooks/useAlbum';
import { useTheme } from '../../../hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Classifica a raridade com base no número de donos vs total de usuários
function getRaridadeInfo(totalDonos: number, maxDonos: number) {
  if (totalDonos === 0) return { label: 'Impossível', cor: '#FF0000', corBg: '#FFF0F0', icone: '🔥', estrelas: 5 };
  const ratio = totalDonos / Math.max(maxDonos, 1);
  if (ratio <= 0.05) return { label: 'Lendária', cor: '#FFD700', corBg: '#FFF8DC', icone: '⭐', estrelas: 5 };
  if (ratio <= 0.15) return { label: 'Épica', cor: '#A855F7', corBg: '#F3E8FF', icone: '💎', estrelas: 4 };
  if (ratio <= 0.30) return { label: 'Rara', cor: '#3B82F6', corBg: '#EFF6FF', icone: '🔷', estrelas: 3 };
  if (ratio <= 0.60) return { label: 'Incomum', cor: '#22C55E', corBg: '#F0FDF4', icone: '🟢', estrelas: 2 };
  return { label: 'Comum', cor: '#6B7280', corBg: '#F9FAFB', icone: '⚪', estrelas: 1 };
}

export default function RaridadeScreen() {
  const { data: raridadeData, isLoading: loadingRaridade } = useRaridadeDinamica();
  const { inventario } = useAlbum();
  const { colors } = useTheme();

  const mapInventario = useMemo(() => {
    const map = new Map();
    if (inventario) {
      inventario.forEach((item: any) => {
        map.set(item.codigo_figurinha, item);
      });
    }
    return map;
  }, [inventario]);

  // Cria o ranking completo mesclando catálogo + dados reais de demanda
  const ranking = useMemo(() => {
    const donosMap = new Map<string, number>();
    let maxDonos = 0;

    if (raridadeData) {
      raridadeData.forEach((r) => {
        donosMap.set(r.codigo_figurinha, r.total_donos);
        if (r.total_donos > maxDonos) maxDonos = r.total_donos;
      });
    }

    return (catalogo as any[])
      .map((item) => {
        const totalDonos = donosMap.get(item.codigo) || 0;
        const raridade = getRaridadeInfo(totalDonos, maxDonos);
        const status = mapInventario.get(item.codigo);
        const isColada = status?.quantidade_colada > 0;

        return {
          ...item,
          totalDonos,
          raridade,
          isColada,
        };
      })
      .sort((a, b) => a.totalDonos - b.totalDonos); // Menos donos = mais rara = primeiro
  }, [catalogo, raridadeData, mapInventario]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = ranking.length;
    const impossiveis = ranking.filter(r => r.totalDonos === 0).length;
    const lendarias = ranking.filter(r => r.raridade.label === 'Lendária').length;
    const epicas = ranking.filter(r => r.raridade.label === 'Épica').length;
    return { total, impossiveis, lendarias, epicas };
  }, [ranking]);

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const { raridade, isColada, totalDonos } = item;

    let imageUrl = '';
    let isFifaLogo = false;
    if (item.tipo === 'escudo' || item.tipo === 'time' || item.posicao_campo === 'Especial') {
      if (!item.country_code || item.country_code === 'un') {
        isFifaLogo = true;
      } else {
        imageUrl = `https://flagcdn.com/w160/${item.country_code}.png`;
      }
    } else {
      imageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.nome_jogador)}&background=random&color=fff&size=128`;
    }

    return (
      <View
        style={[
          styles.row,
          { backgroundColor: colors.surface, borderColor: colors.border },
          isColada && { borderLeftColor: raridade.cor, borderLeftWidth: 3 },
        ]}
      >
        {/* Posição no ranking */}
        <View style={styles.rankCol}>
          <Text style={[styles.rankNumber, { color: index < 3 ? raridade.cor : colors.textSecondary }]}>
            #{index + 1}
          </Text>
        </View>

        {/* Imagem */}
        <Image
          source={isFifaLogo ? require('../../../assets/images/fifa-logo.png') : { uri: imageUrl }}
          style={[styles.thumb, { opacity: isColada ? 1 : 0.3 }]}
          resizeMode={isFifaLogo ? "contain" : "cover"}
        />

        {/* Info */}
        <View style={styles.infoCol}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {item.nome_jogador}
          </Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {item.codigo} • {item.selecao}
          </Text>
        </View>

        {/* Raridade */}
        <View style={styles.rarityCol}>
          <View style={[styles.rarityBadge, { backgroundColor: raridade.corBg }]}>
            <Text style={[styles.rarityText, { color: raridade.cor }]}>
              {raridade.icone} {raridade.label}
            </Text>
          </View>
          <Text style={[styles.donosText, { color: colors.textSecondary }]}>
            {totalDonos === 0 ? 'Ninguém tem' : `${totalDonos} dono${totalDonos > 1 ? 's' : ''}`}
          </Text>
        </View>

        {/* Status do usuário */}
        {isColada ? (
          <Ionicons name="checkmark-circle" size={22} color={colors.success} />
        ) : (
          <Ionicons name="ellipse-outline" size={22} color="#DDD" />
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.secondary }]}>
        <Text style={styles.title}>Ranking de Raridade 💎</Text>
        <Text style={styles.subtitle}>Baseado na demanda real dos colecionadores</Text>
      </View>

      {/* Stats */}
      <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#FF0000' }]}>{stats.impossiveis}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>🔥 Ninguém tem</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#FFD700' }]}>{stats.lendarias}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>⭐ Lendárias</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#A855F7' }]}>{stats.epicas}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>💎 Épicas</Text>
        </View>
      </View>

      {/* Lista */}
      {loadingRaridade ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Calculando raridade...</Text>
        </View>
      ) : (
        <FlatList
          data={ranking}
          renderItem={renderItem}
          keyExtractor={(item) => item.codigo}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
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
  statsRow: {
    flexDirection: 'row',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  rankCol: {
    width: 36,
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  infoCol: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  meta: {
    fontSize: 11,
  },
  rarityCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  donosText: {
    fontSize: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
});
