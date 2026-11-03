import { View } from 'react-native';
import { useI18n } from '../../i18n/react';
import { useAppTheme } from '../../theme/AppThemeProvider';

export function CalendarPageSkeleton() {
  const { t } = useI18n();
  const { rem } = useAppTheme();

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={t('calendar.monthLoading')}
      accessibilityState={{ busy: true }}
      className="grow gap-4"
    >
      <View className="h-10 flex-row items-center justify-between gap-3">
        <View className="h-7 w-32 rounded bg-theme-skeleton" />
        <View className="flex-row gap-3">
          {[0, 1, 2].map((index) => (
            <View key={index} className="h-8 w-8 rounded-full bg-theme-skeleton" />
          ))}
        </View>
      </View>
      <View className="h-10 flex-row items-center gap-1">
        {Array.from({ length: 7 }, (_, index) => (
          <View key={index} className="flex-1 items-center">
            <View className="h-5 w-5 rounded bg-theme-skeleton" />
          </View>
        ))}
      </View>
      <View className="grow gap-1">
        {Array.from({ length: 6 }, (_, row) => (
          <View key={row} className="grow flex-row gap-1" style={{ minHeight: rem * 3.5 }}>
            {Array.from({ length: 7 }, (_, column) => (
              <View key={column} className="flex-1 items-center justify-center gap-1">
                <View className="h-4 w-4 rounded bg-theme-skeleton" />
                <View className="h-7 w-7 rounded-full bg-theme-skeleton" />
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}
