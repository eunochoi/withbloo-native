import { differenceInCalendarDays, parseISO } from 'date-fns';
import { View } from 'react-native';
import { Text } from '../../components/Text';
import type { Habit } from '../../db/types';
import { localDate } from '../../domain/date';
import { getHabitMonthSummary, getHabitYearSummary } from '../../domain/habitStats';
import { formatDisplayDate } from '../../i18n/format';
import { useI18n } from '../../i18n/react';
import { SoberInfoCarousel } from '../sober/SoberInfoCarousel';

export function HabitInfoCarousel({ habit, dates, today, unavailable, color }: {
  habit: Habit;
  dates: string[];
  today: string;
  unavailable: boolean;
  color: string;
}) {
  const { t, formatLocale } = useI18n();
  const space = formatLocale.startsWith('ko') ? '' : ' ';
  const startedDate = localDate(habit.initial_started_at);
  const month = getHabitMonthSummary(today.slice(0, 7), startedDate, dates, today);
  const year = getHabitYearSummary(Number(today.slice(0, 4)), dates, startedDate, today);
  const latest = dates.filter((date) => date >= startedDate && date <= today).sort().at(-1);
  const daysAgo = latest ? differenceInCalendarDays(parseISO(today), parseISO(latest)) : null;
  const free = habit.priority === 0;
  const count = (value: number) => unavailable ? '—' : `${value}${space}${t('habit.timesUnit', { count: value })}`;
  const rate = (value: string | null) => unavailable || value === null ? '—' : `${value}%`;
  const progress = (completed: number, targetDays: number) => unavailable ? '—' : `${count(completed)} / ${targetDays}${space}${t('habit.daysUnit', { count: targetDays })}`;
  const firstLabel = t(free ? 'habit.recentRecord' : 'habit.thisMonthCompletion');
  const secondLabel = t(free ? 'habit.thisMonthRecord' : 'habit.thisYearCompletion');
  const primary = unavailable ? '—' : free ? (latest ? formatDisplayDate(latest, formatLocale, 'short') : t('habit.noRecords')) : progress(month.completed, month.completed + month.missed);
  const subtitle = unavailable ? '—' : free
    ? latest ? daysAgo === 0 ? t('calendar.today') : t('habit.daysAgo', { count: daysAgo ?? 0 }) : ''
    : `${formatDisplayDate(`${today.slice(0, 7)}-01`, formatLocale, 'month')} · ${t('habit.rate')} ${rate(month.rate)}`;
  const details = free
    ? [{ label: t('habit.thisMonthRecord'), value: count(month.completed) }, { label: t('habit.averageInterval'), value: unavailable || month.averageInterval === null ? '—' : `${Number(month.averageInterval.toFixed(1))}${space}${t('habit.daysUnit', { count: Number(month.averageInterval.toFixed(1)) })}` }]
    : [{ label: t('habit.thisYearCompletion'), value: progress(year.completed, year.completed + year.missed) }, { label: t('habit.thisYearRate'), value: rate(year.rate) }];
  return (
    <SoberInfoCarousel color={color} labels={[firstLabel, secondLabel]} pages={[
      <View key="current" className="items-center gap-0.5">
        <Text className="text-center text-sm text-theme-text-secondary">{firstLabel}</Text>
        <View className="min-h-12 justify-center self-stretch"><Text className="text-center text-3xl leading-tight font-bold text-theme-text-primary">{primary}</Text></View>
        <Text className="text-center text-sm text-theme-text-secondary">{subtitle}</Text>
      </View>,
      <View key="summary" className="flex-row">
        {details.map((item) => <View key={item.label} className="flex-1 min-w-0 items-center gap-2 px-2"><View className="items-center gap-1">
          <Text className="text-center text-base font-semibold text-theme-text-primary">{item.label}</Text>
          <Text className="text-center text-base tracking-tighter font-medium text-theme-text-primary">{item.value}</Text>
        </View></View>)}
      </View>,
    ]} />
  );
}
