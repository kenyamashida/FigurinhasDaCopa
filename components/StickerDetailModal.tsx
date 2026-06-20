import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback, ActivityIndicator, Image } from 'react-native';
import { useAlbum } from '../hooks/useAlbum';
import { useTheme } from '../hooks/useTheme';
import { useRaridade } from '../hooks/useRaridade';
import { useWishlist } from '../hooks/useWishlist';
import { Ionicons } from '@expo/vector-icons';

interface StickerDetailModalProps {
  visible: boolean;
  onClose: () => void;
  sticker: any;
  status: any;
}

export default function StickerDetailModal({ visible, onClose, sticker, status }: StickerDetailModalProps) {
  const { toggleSticker, updateRepeats } = useAlbum();
  const { colors, isDark } = useTheme();
  const { wishlist, toggleWishlist } = useWishlist();
  const [updating, setUpdating] = useState(false);
  
  const { data: raridade, isLoading: loadingRaridade } = useRaridade(visible ? sticker?.codigo : undefined);

  if (!sticker) return null;

  const isColada = status?.quantidade_colada > 0;
  const qtdRepetida = status?.quantidade_repetida || 0;
  const isOnWishlist = wishlist?.includes(sticker.codigo);

  const handleToggleColada = async () => {
    setUpdating(true);
    await toggleSticker.mutateAsync({ codigo: sticker.codigo, atual: status?.quantidade_colada || 0 });
    setUpdating(false);
  };

  const handleRepeats = async (delta: number) => {
    const newVal = Math.max(0, qtdRepetida + delta);
    setUpdating(true);
    await updateRepeats.mutateAsync({ codigo: sticker.codigo, repetidas: newVal });
    setUpdating(false);
  };

  // Define a imagem da figurinha
  let imageUrl = '';
  if (sticker.tipo === 'escudo' || sticker.tipo === 'time' || sticker.posicao_campo === 'Especial') {
    imageUrl = (!sticker.country_code || sticker.country_code === 'un') ? 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4b/2026_FIFA_World_Cup_logo.svg/512px-2026_FIFA_World_Cup_logo.svg.png' : `https://flagcdn.com/w160/${sticker.country_code}.png`;
  } else {
    imageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(sticker.nome_jogador)}&background=random&color=fff&size=128`;
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableWithoutFeedback>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.header}>
              <Text style={[styles.codigo, { color: colors.text }]}>{sticker.codigo}</Text>
              <Text style={[styles.selecao, { color: colors.textSecondary }]}>{sticker.selecao}</Text>
            </View>
            
            <View style={styles.content}>
              <View style={styles.stickerPreviewRow}>
                {/* Visualização da Figurinha */}
                <View style={[
                  styles.stickerPreviewCard,
                  isColada ? styles.previewColada : styles.previewFaltante,
                  sticker.tipo === 'especial' && styles.previewEspecial
                ]}>
                  <Image 
                    source={{ uri: imageUrl }} 
                    style={[styles.previewImage, { opacity: isColada ? 1 : 0.2 }]} 
                    resizeMode="cover"
                  />
                  {!isColada && (
                    <View style={styles.previewLock}>
                      <Ionicons name="lock-closed" size={24} color="rgba(0,0,0,0.3)" />
                    </View>
                  )}
                </View>

                {/* Dados do Jogador */}
                <View style={styles.stickerInfoCol}>
                  <Text style={[styles.nome, { color: colors.text }]}>{sticker.nome_jogador}</Text>
                  {sticker.posicao_campo && (
                    <Text style={[styles.posicao, { color: colors.textSecondary }]}>{sticker.posicao_campo}</Text>
                  )}
                  {sticker.grupo && (
                    <Text style={[styles.grupoText, { color: colors.textSecondary }]}>Grupo {sticker.grupo}</Text>
                  )}
                  
                  {loadingRaridade ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 8, alignSelf: 'flex-start' }} />
                  ) : raridade ? (
                    <View style={[styles.rarityBadge, { borderColor: raridade.e_brilhante ? colors.accent : colors.border }]}>
                      <Text style={[styles.rarityText, { color: raridade.e_brilhante ? colors.accent : colors.text }]}>
                        {raridade.raridade_dinamica}
                      </Text>
                      <Text style={[styles.raritySubtext, { color: colors.textSecondary }]}>
                        {raridade.total_usuarios_com_figurinha} colecionadores têm
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            <View style={styles.actions}>
              <View style={styles.actionRow}>
                <Text style={[styles.actionLabel, { color: colors.text }]}>Status no Álbum:</Text>
                <TouchableOpacity 
                  style={[
                    styles.statusButton, 
                    isColada ? [styles.statusColada, { backgroundColor: colors.secondary, borderColor: colors.secondary }] 
                             : [styles.statusFaltante, { backgroundColor: colors.background, borderColor: colors.border }]
                  ]}
                  onPress={handleToggleColada}
                  disabled={updating}
                >
                  <Text style={[
                    styles.statusButtonText, 
                    !isColada && { color: colors.textSecondary }
                  ]}>
                    {isColada ? '✅ Colada' : '❌ Faltante'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.actionRow}>
                <Text style={[styles.actionLabel, { color: colors.text }]}>Repetidas para troca:</Text>
                <View style={styles.stepper}>
                  <TouchableOpacity 
                    style={[styles.stepperButton, { backgroundColor: colors.background, borderColor: colors.border }]} 
                    onPress={() => handleRepeats(-1)}
                    disabled={updating || qtdRepetida === 0}
                  >
                    <Text style={[styles.stepperText, { color: colors.text }]}>-</Text>
                  </TouchableOpacity>
                  <Text style={[styles.stepperValue, { color: colors.text }]}>{qtdRepetida}</Text>
                  <TouchableOpacity 
                    style={[styles.stepperButton, { backgroundColor: colors.background, borderColor: colors.border }]} 
                    onPress={() => handleRepeats(1)}
                    disabled={updating}
                  >
                    <Text style={[styles.stepperText, { color: colors.text }]}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.actionRow}>
                <Text style={[styles.actionLabel, { color: colors.text }]}>Wishlist (Procura-se):</Text>
                <TouchableOpacity 
                  style={[
                    styles.statusButton, 
                    isOnWishlist ? [styles.statusColada, { backgroundColor: colors.accent, borderColor: colors.accent }] 
                                 : [styles.statusFaltante, { backgroundColor: colors.background, borderColor: colors.border }]
                  ]}
                  onPress={() => toggleWishlist.mutate({ codigo: sticker.codigo, isOnWishlist: !!isOnWishlist })}
                  disabled={toggleWishlist.isPending}
                >
                  <Text style={[
                    styles.statusButtonText, 
                    !isOnWishlist && { color: colors.textSecondary }
                  ]}>
                    {isOnWishlist ? '⭐ Na Wishlist' : 'Adicionar'}
                  </Text>
                </TouchableOpacity>
              </View>

            </View>

            <TouchableOpacity style={[styles.closeButton, { backgroundColor: colors.background }]} onPress={onClose}>
              <Text style={[styles.closeButtonText, { color: colors.text }]}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 300,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  codigo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0A2540',
  },
  selecao: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  content: {
    marginBottom: 24,
  },
  nome: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0A2540',
  },
  posicao: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  actions: {
    gap: 16,
    marginBottom: 24,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 16,
    color: '#0A2540',
    fontWeight: '500',
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusColada: {
    backgroundColor: '#0A2540',
    borderColor: '#0A2540',
  },
  statusFaltante: {
    backgroundColor: '#F5F9FF',
    borderColor: '#D1E3F8',
  },
  statusButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  statusButtonTextFaltante: {
    color: '#666',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1E3F8',
  },
  stepperText: {
    fontSize: 20,
    color: '#0A2540',
    fontWeight: 'bold',
  },
  stepperValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A2540',
    minWidth: 20,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#F5F9FF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#0A2540',
    fontWeight: 'bold',
    fontSize: 16,
  },
  rarityBadge: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  rarityText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  raritySubtext: {
    fontSize: 10,
    marginTop: 2,
  },
  stickerPreviewRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  stickerPreviewCard: {
    width: 90,
    height: 126,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1E3F8',
    padding: 4,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  previewColada: {
    borderColor: '#0A2540',
    borderWidth: 2,
  },
  previewFaltante: {
    opacity: 0.7,
  },
  previewEspecial: {
    borderColor: '#F1C40F',
    borderWidth: 2,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  previewLock: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickerInfoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  grupoText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  }
});
