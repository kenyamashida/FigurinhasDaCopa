import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator, Share, Alert, TextInput } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import catalogo from '../../../data/catalogo-figurinhas.json';
import { useAlbum } from '../../../hooks/useAlbum';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import StickerDetailModal from '../../../components/StickerDetailModal';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import SkeletonCard from '../../../components/SkeletonCard';
import ConfettiOverlay from '../../../components/ConfettiOverlay';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 4;
const PADDING = 16;
const CARD_WIDTH = (width - PADDING * 2 - (COLUMN_COUNT - 1) * 8) / COLUMN_COUNT;

export default function AlbumScreen() {
  const router = useRouter();
  const { inventario, isLoading, toggleSticker } = useAlbum();
  const { colors, isDark } = useTheme();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('Todas'); // Todas, Tenho, Faltam, Repetidas
  
  const [selectedSticker, setSelectedSticker] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [showConfetti, setShowConfetti] = useState(false);

  // Cria um mapa rápido do inventário para acesso O(1)
  const mapInventario = useMemo(() => {
    const map = new Map();
    if (inventario) {
      inventario.forEach((item: any) => {
        map.set(item.codigo_figurinha, item);
      });
    }
    return map;
  }, [inventario]);

  const totalColadas = inventario?.filter((i: any) => i.quantidade_colada > 0).length || 0;
  const porcentagemNum = (totalColadas / catalogo.length) * 100;
  const porcentagem = porcentagemNum.toFixed(1);

  // Check milestones for confetti
  useEffect(() => {
    if (porcentagemNum >= 100) setShowConfetti(true);
    else if (porcentagemNum >= 75 && porcentagemNum < 76) setShowConfetti(true);
    else if (porcentagemNum >= 50 && porcentagemNum < 51) setShowConfetti(true);
    else if (porcentagemNum >= 25 && porcentagemNum < 26) setShowConfetti(true);
  }, [porcentagemNum]);

  const filteredCatalogo = useMemo(() => {
    return catalogo.filter((item: any) => {
      // 1. Busca por texto
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!item.codigo.toLowerCase().includes(query) && 
            !item.nome_jogador.toLowerCase().includes(query)) {
          return false;
        }
      }
      
      // 2. Filtro de status
      const status = mapInventario.get(item.codigo);
      const isColada = status?.quantidade_colada > 0;
      const qtdRepetida = status?.quantidade_repetida || 0;
      
      if (filterType === 'Tenho' && !isColada) return false;
      if (filterType === 'Faltam' && isColada) return false;
      if (filterType === 'Repetidas' && qtdRepetida === 0) return false;
      
      return true;
    });
  }, [catalogo, mapInventario, searchQuery, filterType]);

  const renderSticker = ({ item }: { item: any }) => {
    const isEspecial = item.tipo === 'especial';
    const status = mapInventario.get(item.codigo);
    const isColada = status?.quantidade_colada > 0;
    const qtdRepetida = status?.quantidade_repetida || 0;
    
    return (
      <View style={styles.cardContainer}>
        <TouchableOpacity 
          style={[
            styles.card, 
            isEspecial && styles.cardEspecial,
            isColada ? styles.cardColada : styles.cardFaltante
          ]}
          onPress={() => toggleSticker.mutate({ codigo: item.codigo, atual: status?.quantidade_colada || 0 })}
          onLongPress={() => {
            setSelectedSticker(item);
            setModalVisible(true);
          }}
        >
          <Text style={[styles.cardCode, isColada ? styles.textColada : styles.textFaltante]}>{item.codigo}</Text>
          <View style={[styles.imagePlaceholder, isColada ? styles.bgColada : styles.bgFaltante]}>
            <Text style={[styles.placeholderText, isColada ? styles.textColada : styles.textFaltante]} numberOfLines={2}>
              {item.nome_jogador}
            </Text>
          </View>
          {qtdRepetida > 0 && (
            <View style={styles.badgeRepetida}>
              <Text style={styles.badgeText}>+{qtdRepetida}</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.playerName} numberOfLines={1}>{item.selecao}</Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: 16 }]}>
        <View style={styles.listContainer}>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonCard key={i} width={CARD_WIDTH} height={CARD_WIDTH * 1.4} />
            ))}
          </View>
        </View>
      </View>
    );
  }

  const handleShare = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const profileUrl = `https://albumcopa26.app/u/${user.user.id}`;
      await Share.share({
        message: `Estou com ${porcentagem}% do álbum completo! Faltam apenas ${catalogo.length - totalColadas} figurinhas. Veja meu inventário e vamos trocar: ${profileUrl}`,
      });
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerInfo, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.progressContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[styles.progressTitle, { color: colors.text }]}>Progresso do Álbum</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={() => router.push('/(tabs)/album/scanner')} style={[styles.iconButton, { backgroundColor: colors.secondary }]}>
                <Text style={styles.iconText}>📷 Ler</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShare} style={[styles.iconButton, { backgroundColor: colors.secondary }]}>
                <Text style={styles.iconText}>📤 Web</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
            <View style={[styles.progressBarFill, { width: `${porcentagem}%`, backgroundColor: colors.primary }]} />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>{totalColadas} de {catalogo.length} ({porcentagem}%)</Text>
        </View>

        <View style={[styles.searchContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Buscar por código ou jogador..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filtersContainer}>
          {['Todas', 'Tenho', 'Faltam', 'Repetidas'].map((type) => (
            <TouchableOpacity 
              key={type}
              style={[
                styles.filterChip, 
                { backgroundColor: colors.background, borderColor: colors.border },
                filterType === type && { backgroundColor: colors.secondary, borderColor: colors.secondary }
              ]}
              onPress={() => setFilterType(type)}
            >
              <Text style={[
                styles.filterChipText, 
                { color: colors.textSecondary },
                filterType === type && { color: '#FFF' }
              ]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlashList
        data={filteredCatalogo}
        renderItem={renderSticker}
        estimatedItemSize={120}
        numColumns={COLUMN_COUNT}
        contentContainerStyle={styles.listContainer}
        extraData={mapInventario} // Força re-render quando inventário mudar
      />

      <StickerDetailModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        sticker={selectedSticker}
        status={selectedSticker ? mapInventario.get(selectedSticker.codigo) : null}
      />
      <ConfettiOverlay active={showConfetti} onComplete={() => setShowConfetti(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9FF',
  },
  headerInfo: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  progressContainer: {
    gap: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0A2540',
  },
  progressBarBg: {
    height: 12,
    backgroundColor: '#D1E3F8',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#E61D25',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  iconButton: {
    backgroundColor: '#0A2540',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  iconText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: PADDING,
    paddingBottom: 80,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F9FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#D1E3F8',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: '#0A2540',
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F9FF',
    borderWidth: 1,
    borderColor: '#D1E3F8',
  },
  filterChipActive: {
    backgroundColor: '#0A2540',
    borderColor: '#0A2540',
  },
  filterChipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  cardContainer: {
    width: CARD_WIDTH,
    alignItems: 'center',
    marginBottom: 16,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.4, // Proporção retrato da figurinha
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1E3F8',
    padding: 4,
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardEspecial: {
    borderColor: '#F1C40F', // Dourado
    borderWidth: 2,
  },
  cardColada: {
    borderColor: '#0A2540',
    borderWidth: 2,
  },
  cardFaltante: {
    opacity: 0.5,
  },
  cardCode: {
    fontSize: 10,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
  },
  imagePlaceholder: {
    flex: 1,
    width: '100%',
    borderRadius: 4,
    marginTop: 4,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  bgColada: {
    backgroundColor: '#E61D25',
  },
  bgFaltante: {
    backgroundColor: '#D1E3F8',
  },
  textColada: {
    color: '#0A2540',
  },
  textFaltante: {
    color: '#666',
  },
  placeholderText: {
    fontSize: 8,
    textAlign: 'center',
  },
  playerName: {
    fontSize: 10,
    marginTop: 4,
    color: '#666',
  },
  badgeRepetida: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#F1C40F',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFF',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0A2540',
  },
});
