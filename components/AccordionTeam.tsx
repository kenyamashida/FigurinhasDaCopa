import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

interface AccordionTeamProps {
  teamName: string;
  countryCode: string;
  total: number;
  collected: number;
  children: React.ReactNode;
}

export default function AccordionTeam({ teamName, countryCode, total, collected, children }: AccordionTeamProps) {
  const [expanded, setExpanded] = useState(false);
  const { colors } = useTheme();

  const percentage = total > 0 ? (collected / total) * 100 : 0;
  const isComplete = collected === total && total > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <TouchableOpacity 
        style={styles.header} 
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Image 
            source={{ uri: `https://flagcdn.com/w80/${countryCode}.png` }} 
            style={styles.flag} 
            resizeMode="cover"
          />
          <View>
            <Text style={[styles.teamName, { color: colors.text }]}>{teamName}</Text>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {collected} / {total} figurinhas
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
            <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: isComplete ? colors.success : colors.primary }]} />
          </View>
          <Ionicons 
            name={expanded ? "chevron-up" : "chevron-down"} 
            size={24} 
            color={colors.textSecondary} 
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={[styles.content, { borderTopColor: colors.border }]}>
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flag: {
    width: 40,
    height: 30,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  teamName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressText: {
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBarBg: {
    width: 60,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  content: {
    padding: 16,
    paddingTop: 8,
    borderTopWidth: 1,
  }
});
