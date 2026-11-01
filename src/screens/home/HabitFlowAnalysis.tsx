import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';
import { format, parseISO } from 'date-fns';
import { Text } from '../../components/Text';
import { QueryError } from '../../components/QueryError';
import { shiftDate } from '../../domain/date';
import { getHabitFlowStats } from '../../domain/habitStats';
import { habitQueries, useToday } from '../../queries';
import { useI18n } from '../../i18n/react';
import { AnalysisSubtitle } from './AnalysisSubtitle';

export function HabitFlowAnalysis() {
  const { t, language } = useI18n();
  const today = useToday();
  const db = useSQLiteContext();
  const habits = useQuery(habitQueries.list(db));
  const records = useQuery(habitQueries.completions(db, shiftDate(today, -13), today));
  if (habits.isError || records.isError)
    return (
      <QueryError
        message={t('habit.flowFailed')}
        onRetry={() => {
          void habits.refetch();
          void records.refetch();
        }}
      />
    );
  if (!habits.data || !records.data) return <Text>{t('habit.flowLoading')}</Text>;
  const stats = getHabitFlowStats(today, habits.data, records.data);
  const display = (value: number | null) => (value === null ? '—' : `${Number(value.toFixed(1))}%`);
  const change = stats.change === null ? null : Number(stats.change.toFixed(1));
  return (
    <View className="gap-4">
      <AnalysisSubtitle>{t('stats.flowTitle')}</AnalysisSubtitle>
      <View className="mx-1 gap-4 rounded-theme border border-theme-text-secondary/10 bg-theme-surface-muted/60 p-4">
        <View className="flex-row items-center justify-between gap-3">
          <View>
            <Text className="text-sm text-theme-text-secondary">{t('stats.recentAverage')}</Text>
            <Text className="text-3xl font-semibold">{display(stats.recent.average)}</Text>
          </View>
          <View className="items-end">
            <Text className="text-theme-accent font-semibold">
              {change === null
                ? '—'
                : `${change > 0 ? '+' : ''}${change}%p ${change > 0 ? '↑' : change < 0 ? '↓' : ''}`}
            </Text>
            <Text className="text-xs text-theme-text-secondary">
              {t('stats.previousAverage')} {display(stats.previous.average)}
            </Text>
          </View>
        </View>
        <View className="flex-row gap-1">
          {[...stats.recent.days].reverse().map((day) => (
            <View
              key={day.date}
              accessible
              accessibilityLabel={`${day.date}, ${display(day.percent)}`}
              className="flex-1 min-w-0 items-center gap-2"
            >
              <Text className="text-xs text-theme-text-secondary">{display(day.percent)}</Text>
              <View className="h-24 w-2/3 justify-end overflow-hidden rounded-lg bg-theme-border/80">
                <View
                  className="w-full bg-theme-accent"
                  style={{ height: `${day.percent ?? 0}%` }}
                />
              </View>
              <Text
                className={`text-xs ${day.date === today ? 'text-theme-accent font-semibold' : 'text-theme-text-secondary'}`}
              >
                {day.date === today
                  ? language === 'ko'
                    ? '오늘'
                    : 'Today'
                  : language === 'ko'
                    ? ['일', '월', '화', '수', '목', '금', '토'][parseISO(day.date).getDay()]
                    : format(parseISO(day.date), 'EEE')}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
