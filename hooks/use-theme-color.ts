import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * Theme colors for light and dark mode
 */
const Colors = {
  light: {
    text: '#111827',
    background: '#FFFFFF',
    tint: '#3B82F6',
    icon: '#6B7280',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#3B82F6',
  },
  dark: {
    text: '#F9FAFB',
    background: '#111827',
    tint: '#60A5FA',
    icon: '#9CA3AF',
    tabIconDefault: '#6B7280',
    tabIconSelected: '#60A5FA',
  },
};

/**
 * Hook to get theme color based on current color scheme
 * 
 * @param props - Object with light and dark color overrides
 * @param colorName - Name of the color to get (e.g., 'text', 'background')
 * @returns The color value for the current theme
 */
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
): string {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

