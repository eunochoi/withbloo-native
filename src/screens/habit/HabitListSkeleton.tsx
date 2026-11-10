import { useI18n } from '../../i18n/react';
import { View } from 'react-native';

export function HabitListSkeleton() {
  const { t } = useI18n();

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={t('habit.listLoading')}
      accessibilityState={{ busy: true }}
      className="w-full"
    >
      <View className="flex-row flex-wrap">
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            className={`w-1/2 border-theme-border/50 ${index < 2 ? 'border-b' : 'border-b-0'} ${index % 2 === 0 ? 'border-r' : 'border-r-0'}`}
          >
            <View className="flex-1 gap-6 px-2 py-5">
              <View className="items-center gap-2">
                <View className="h-8 w-8 ios:curve-continuous rounded-full bg-theme-skeleton" />
                <View className="h-6 w-3/4 ios:curve-continuous rounded bg-theme-skeleton" />
                <View className="h-5 w-16 ios:curve-continuous rounded bg-theme-skeleton" />
              </View>
              <View className="flex-row justify-around">
                {[0, 1, 2, 3].map((day) => (
                  <View key={day} className="flex-1 items-center gap-1">
                    <View className="h-5 w-4 ios:curve-continuous rounded bg-theme-skeleton" />
                    <View className="h-5 w-4 ios:curve-continuous rounded bg-theme-skeleton" />
                    <View className="mt-1 h-5 w-5 ios:curve-continuous rounded-md bg-theme-skeleton" />
                  </View>
                ))}
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
