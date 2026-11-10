import { useI18n } from '../../i18n/react';
import { useMemo } from 'react';
import { View } from 'react-native';
import { Text } from '../../components/Text';
import { HabitIcon } from '../../components/HabitIcon';
import type { Habit } from '../../db/types';
import { calendarDays } from '../../domain/calendar';
import { localDate } from '../../domain/date';
import { useCalendarNavigation } from '../../hooks/useCalendarNavigation';
import { useMonthSwipe } from '../../hooks/useMonthSwipe';
import { CalendarDay } from '../calendar/CalendarDay';
import { CalendarGrid } from '../calendar/CalendarGrid';
import { CalendarHeader } from '../calendar/CalendarHeader';

export function HabitMonthStatistics({
  habit,
  dates,
  memoDates = [],
  onSelectDate,
  month,
  onMonthChange,
  today,
  unavailable,
}: {
  habit: Habit;
  dates: string[];
  memoDates?: string[];
  onSelectDate?: (date: string) => void;
  month: string;
  onMonthChange: (month: string) => void;
  today: string;
  unavailable: boolean;
}) {
  const { t } = useI18n();

  const startedDate = localDate(habit.initial_started_at);
  const days = useMemo(() => calendarDays(month), [month]);
  const navigation = useCalendarNavigation(month, onMonthChange, startedDate, today);
  const swipe = useMonthSwipe(navigation.changeMonth);
  const completedDates = useMemo(() => new Set(dates), [dates]);
  return (
    <View className="gap-4">
      <View className="flex-row items-center gap-2">
        <Text
          accessibilityRole="header"
          className="text-lg leading-6 font-semibold text-theme-text-primary"
        >
          {t('habit.monthly')}
        </Text>
      </View>
      <View className="px-1 gap-4">
        <CalendarHeader detail month={month} today={today} navigation={navigation} />
        <View>
          <CalendarGrid
            {...swipe.panHandlers}
            accessibilityLabel={t('habit.calendar', { value: month })}
          >
            {days.map((date) => {
              const outside = date.slice(0, 7) !== month;
              const available = navigation.isDateAvailable(date);
              const completed = !unavailable && !outside && available && completedDates.has(date);
              const empty = !unavailable && !outside && available && !completed;
              return (
                <CalendarDay
                  key={date}
                  date={date}
                  month={month}
                  today={today}
                  onMonthChange={navigation.changeToMonth}
                  disabled={unavailable || !available || (!outside && !onSelectDate)}
                  hasMemo={!unavailable && available && memoDates.includes(date)}
                  onSelect={onSelectDate}
                  dimmed={!available}
                  label={`${date}${completed ? t('habit.hasRecord') : ''}${empty ? t('habit.noRecord') : ''}${memoDates.includes(date) ? t('habit.hasMemo') : ''}`}
                  textClassName="font-medium"
                >
                  {completed ? (
                    <View className="w-3/5 aspect-square items-center justify-center">
                      <HabitIcon name={habit.icon_key} colorKey={habit.icon_color} />
                    </View>
                  ) : undefined}
                </CalendarDay>
              );
            })}
          </CalendarGrid>
        </View>
      </View>
    </View>
  );
}
