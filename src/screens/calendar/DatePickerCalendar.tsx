import { useI18n } from '../../i18n/react';
import { useMemo } from 'react';
import { View } from 'react-native';
import { AppIcon } from '../../components/AppIcon';
import { SoberIcon } from '../../components/SoberIcon';
import { HabitIcon } from '../../components/HabitIcon';
import type { Habit, Sober } from '../../db/types';
import { useAppTheme } from '../../theme/AppThemeProvider';
import { calendarDays } from '../../domain/calendar';
import { useMonthSwipe } from '../../hooks/useMonthSwipe';
import { useCalendarNavigation } from '../../hooks/useCalendarNavigation';
import { CalendarDay } from './CalendarDay';
import { CalendarGrid } from './CalendarGrid';
import { CalendarHeader } from './CalendarHeader';

export function DatePickerCalendar({
  month,
  today,
  selected,
  minDate,
  compact = false,
  diaryDates,
  soberRecords,
  habitRecords,
  onMonthChange,
  onSelect,
}: {
  month: string;
  today: string;
  selected: string;
  minDate?: string;
  compact?: boolean;
  diaryDates?: readonly string[];
  habitRecords?: { dates: readonly string[]; iconKey: Habit['icon_key']; iconColor: Habit['icon_color'] };
  soberRecords?: {
    dates: readonly string[];
    iconKey: Sober['icon_key'];
    iconColor: Sober['icon_color'];
  };
  onMonthChange: (month: string) => void;
  onSelect: (date: string) => void;
}) {
  const { t } = useI18n();

  const { colors, iconSizes } = useAppTheme();
  const recorded = useMemo(() => new Set(diaryDates), [diaryDates]);
  const restarted = useMemo(() => new Set(soberRecords?.dates), [soberRecords?.dates]);
  const completed = useMemo(() => new Set(habitRecords?.dates), [habitRecords?.dates]);
  const days = useMemo(() => calendarDays(month), [month]);
  const navigation = useCalendarNavigation(month, onMonthChange, minDate, today);
  const swipe = useMonthSwipe(navigation.changeMonth);
  return (
    <View className="gap-4">
      <CalendarHeader month={month} today={today} navigation={navigation} onTodayPress={() => { onMonthChange(today.slice(0, 7)); onSelect(today); }} />
      <CalendarGrid
        {...swipe.panHandlers}
        accessibilityLabel={t('calendar.datePickerLabel', { value: month })}
      >
        {days.map((date) => {
          const unavailable = !navigation.isDateAvailable(date);
          const hasDiary = date.slice(0, 7) === month && !unavailable && recorded.has(date);
          const hasRestart = date.slice(0, 7) === month && !unavailable && restarted.has(date);
          const hasHabit = date.slice(0, 7) === month && !unavailable && completed.has(date);
          const isSelected = date === selected && date.slice(0, 7) === month && !unavailable;
          return (
            <CalendarDay
              key={date}
              date={date}
              month={month}
              today={today}
              selected={selected}
              label={
                hasDiary
                  ? t('calendar.dateHasDiary', { value: date })
                  : hasRestart
                    ? `${date}, ${t('sober.restartDay')}`
                    : undefined
              }
              showTodayIndicator={false}
              showSelectedIndicator={false}
              disabled={unavailable}
              dimmed={unavailable}
              onSelect={onSelect}
              className={compact ? 'aspect-auto h-10' : undefined}
              contentClassName={isSelected ? 'rounded-full bg-theme-accent' : undefined}
              textClassName={isSelected ? 'text-theme-text-on-accent' : undefined}
            >
              {hasDiary || (hasRestart && soberRecords) || (hasHabit && habitRecords) ? (
                <View
                  className={`w-3/5 aspect-square items-center justify-center ${isSelected ? 'rounded-full bg-theme-accent' : ''}`}
                >
                  {hasDiary ? (
                    <AppIcon
                      name="diary"
                      size={iconSizes.lg}
                      color={isSelected ? colors.textOnAccent : colors.accent}
                    />
                  ) : hasHabit && habitRecords ? (
                    <HabitIcon name={habitRecords.iconKey} colorKey={habitRecords.iconColor} colorOverride={isSelected ? colors.textOnAccent : undefined} size={iconSizes.lg} />
                  ) : soberRecords ? (
                    <SoberIcon
                      name={soberRecords.iconKey}
                      colorKey={soberRecords.iconColor}
                      colorOverride={isSelected ? colors.textOnAccent : undefined}
                      size={iconSizes.lg}
                    />
                  ) : null}
                </View>
              ) : undefined}
            </CalendarDay>
          );
        })}
      </CalendarGrid>
    </View>
  );
}
