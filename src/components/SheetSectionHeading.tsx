import type { ComponentProps } from 'react';
import { View } from 'react-native';
import { useAppTheme } from '../theme/AppThemeProvider';
import { AppIcon } from './AppIcon';
import { Text } from './Text';

export function SheetSectionHeading({
  icon,
  title,
}: {
  icon: ComponentProps<typeof AppIcon>['name'];
  title: string;
}) {
  const { colors, iconSizes } = useAppTheme();
  return (
    <View className="flex-row items-center gap-2">
      <View className="h-5 w-5 shrink-0 items-center justify-center">
        <AppIcon name={icon} size={iconSizes.md} color={colors.accent} accessible={false} />
      </View>
      <Text accessibilityRole="header" className="min-w-0 flex-1 text-lg font-semibold">
        {title}
      </Text>
    </View>
  );
}
