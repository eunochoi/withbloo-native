import type { itemAccentColors } from '../../theme/colors';
import { useI18n } from '../../i18n/react';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Text } from '../../components/Text';
import { getHabitYearSummary } from '../../domain/habitStats';
import { HabitYearChart } from './HabitYearChart';
import { HabitYearHeader } from './HabitYearHeader';

export function HabitYearStatistics({
  dates,
  startedDate,
  today,
  accent,
}: {
  dates: string[];
  startedDate: string;
  today: string;
  accent?: ReturnType<typeof itemAccentColors>;
}) {
  const { t } = useI18n();

  const [year, setYear] = useState(Number(today.slice(0, 4)));
  const yearly = useMemo(
    () => getHabitYearSummary(year, dates, startedDate, today),
    [year, dates, startedDate, today],
  );
  return (
    <View className="gap-4 border-t border-theme-border/30 pt-8">
      <View className="flex-row items-center gap-2">
        <Text
          accessibilityRole="header"
          className="text-lg leading-6 font-semibold text-theme-text-primary"
        >
          {t('habit.yearly')}
        </Text>
      </View>
      <View className="px-1 gap-4">
        <HabitYearHeader
          year={year}
          startedDate={startedDate}
          today={today}
          onYearChange={setYear}
        />

        <View className="gap-4">
          <HabitYearChart color={accent?.color} monthly={yearly.monthly} />
        </View>
      </View>
    </View>
  );
}
