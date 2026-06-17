import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.secondary, // Azul escuro
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarActiveTintColor: colors.tabIconSelected, // Vermelho Copa
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
      }}
    >
      <Tabs.Screen
        name="album/index"
        options={{
          title: 'Meu Álbum',
          tabBarLabel: 'Álbum',
          tabBarIcon: ({ color, size }) => <Ionicons name="albums-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="mapa/index"
        options={{
          title: 'Mapa de Trocas',
          tabBarLabel: 'Mapa',
          tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="match/index"
        options={{
          title: 'Trocas Perfeitas',
          tabBarLabel: 'Match',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="swap-horizontal-circle-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ranking/index"
        options={{
          title: 'Ranking',
          tabBarLabel: 'Ranking',
          tabBarIcon: ({ color, size }) => <Ionicons name="trophy-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat/index"
        options={{
          title: 'Mensagens',
          tabBarLabel: 'Chat',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="perfil/index"
        options={{
          title: 'Meu Perfil',
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="album/scanner"
        options={{
          href: null,
          title: 'Escanear Figurinha',
        }}
      />
      <Tabs.Screen
        name="chat/[matchId]"
        options={{
          href: null,
          title: 'Chat',
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
