import { useColorScheme } from 'react-native';
import { Theme } from '../constants/Colors';

export function useTheme() {
  const colorScheme = useColorScheme() || 'light';
  return {
    colors: Theme[colorScheme],
    isDark: colorScheme === 'dark'
  };
}
