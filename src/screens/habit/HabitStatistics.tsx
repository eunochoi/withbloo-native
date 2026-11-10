import type { itemAccentColors } from '../../theme/colors';
import { useState } from 'react';
import type { Habit } from '../../db/types';
import { localDate } from '../../domain/date';
import { HabitMonthStatistics } from './HabitMonthStatistics';
import { HabitYearStatistics } from './HabitYearStatistics';

export function HabitStatistics({
  habit,
  dates,
  memoDates = [],
  onSelectDate,
  today,
  unavailable,
  accent,
}: {
  habit: Habit;
  dates: string[];
  memoDates?: string[];
  onSelectDate?: (date: string) => void;
  today: string;
  unavailable: boolean;
  accent?: ReturnType<typeof itemAccentColors>;
}) {
  const [month, setMonth] = useState(today.slice(0, 7));
  const startedDate = localDate(habit.initial_started_at);
  return (
    <>
      <HabitMonthStatistics
        memoDates={memoDates}
        onSelectDate={onSelectDate}
        habit={habit}
        dates={dates}
        month={month}
        onMonthChange={setMonth}
        today={today}
        unavailable={unavailable}
      />
      {habit.priority > 0 && (
        <HabitYearStatistics
          accent={accent}
          dates={dates}
          startedDate={startedDate}
          today={today}
        />
      )}
    </>
  );
}
