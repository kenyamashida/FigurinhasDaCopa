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
import AccordionTeam from '../../../components/AccordionTeam';
import { ScrollView } from 'react-native';
import { Image } from 'react-native';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 4;
const PADDING = 16;
const CARD_WIDTH = (width - 32 - (COLUMN_COUNT - 1) * 8) / COLUMN_COUNT;

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

  const groupedCatalogo = useMemo(() => {
    const groups: Record<string, { teamName: string; countryCode: string; stickers: any[]; total: number; collected: number }> = {};
    
    filteredCatalogo.forEach((item: any) => {
      if (!groups[item.selecao]) {
        groups[item.selecao] = {
          teamName: item.selecao,
          countryCode: item.country_code || 'un',
          stickers: [],
          total: 0,
          collected: 0,
        };
      }
      
      const status = mapInventario.get(item.codigo);
      const isColada = status?.quantidade_colada > 0;
      
      groups[item.selecao].stickers.push(item);
      groups[item.selecao].total++;
      if (isColada) {
        groups[item.selecao].collected++;
      }
    });
    
    return Object.values(groups);
  }, [filteredCatalogo, mapInventario]);

  const renderSticker = (item: any) => {
    const isEspecial = item.tipo === 'especial';
    const status = mapInventario.get(item.codigo);
    const isColada = status?.quantidade_colada > 0;
    const qtdRepetida = status?.quantidade_repetida || 0;
    
    // Define a imagem da figurinha
    let imageUrl = '';
    if (item.tipo === 'escudo' || item.tipo === 'time' || item.posicao_campo === 'Especial') {
      imageUrl = `https://flagcdn.com/w160/${item.country_code || 'un'}.png`;
    } else {
      // Usa uma API de avatares com as iniciais do jogador para simular uma foto
      imageUrl = `https://ui-avatars.com/api/?name=${item.nome_jogador.replace(/ /g, '+')}&background=random&color=fff&size=128`;
    }
    
    return (
      <View style={styles.cardContainer} key={item.codigo}>
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
            <Image 
              source={{ uri: imageUrl }} 
              style={[styles.stickerImage, { opacity: isColada ? 1 : 0.2 }]} 
              resizeMode="cover" 
            />
            {!isColada && (
              <View style={styles.missingOverlay}>
                <Ionicons name="lock-closed" size={16} color="rgba(0,0,0,0.3)" />
              </View>
            )}
          </View>
          <Text style={[styles.playerName, isColada ? styles.textColada : styles.textFaltante]} numberOfLines={1}>
            {item.nome_jogador}
          </Text>
          {qtdRepetida > 0 && (
            <View style={styles.badgeRepetida}>
              <Text style={styles.badgeText}>+{qtdRepetida}</Text>
            </View>
          )}
        </TouchableOpacity>
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

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {groupedCatalogo.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhuma figurinha encontrada.</Text>
        ) : (
          groupedCatalogo.map((group) => (
            <AccordionTeam 
              key={group.teamName}
              teamName={group.teamName}
              countryCode={group.countryCode}
              total={group.total}
              collected={group.collected}
            >
              <View style={styles.stickerGrid}>
                {group.stickers.map((item) => renderSticker(item))}
              </View>
            </AccordionTeam>
          ))
        )}
      </ScrollView>

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
  scrollContainer: {
    paddingVertical: 16,
    paddingBottom: 80,
  },
  stickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    fontSize: 16,
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
    overflow: 'hidden',
  },
  stickerImage: {
    width: '100%',
    height: '100%',
  },
  missingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgColada: {
    backgroundColor: '#E61D25',
  },
  bgFaltante: {
    backgroundColor: '#E0E0E0',
  },
  textColada: {
    color: '#0A2540',
  },
  textFaltante: {
    color: '#999',
  },
  playerName: {
    fontSize: 8,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '600',
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
