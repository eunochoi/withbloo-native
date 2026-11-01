import type { itemAccentColors } from '../../theme/colors';
import type { ComponentProps } from 'react';
import { View } from 'react-native';
import { AppIcon } from '../../components/AppIcon';
import { Text } from '../../components/Text';
import { useAppTheme } from '../../theme/AppThemeProvider';

export function HabitStatisticsSummary({
  stats,
  unavailable,
  accent,
}: {
  stats: {
    label: string;
    icon: ComponentProps<typeof AppIcon>['name'];
    value: number | string;
    unit: string;
  }[];
  unavailable: boolean;
  accent?: ReturnType<typeof itemAccentColors>;
}) {
  const { colors, iconSizes } = useAppTheme();
  return (
    <View
      style={
        accent ? { backgroundColor: accent.background } : undefined
      }
      className="border border-theme-border/50 flex-row py-2 bg-theme-accent-light/50 ios:curve-continuous rounded-theme"
    >
      {stats.map((stat, index) => (
        <View
          key={stat.label}
          className={`flex-1 items-center gap-2.5 py-2 border-theme-border/50 ${index > 0 ? 'border-l' : 'border-l-0'}`}
        >
          <AppIcon name={stat.icon} size={iconSizes.lg} color={accent?.color ?? colors.accent} />
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            className="w-full px-1 text-center text-theme-text-secondary text-sm"
          >
            {stat.label}
          </Text>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            className="w-full px-1 text-center text-theme-text-primary font-bold text-lg"
          >
            {unavailable ? '—' : stat.value}{' '}
            <Text className="text-theme-text-secondary font-bold text-sm">{stat.unit}</Text>
          </Text>
        </View>
      ))}
    </View>
  );
}
