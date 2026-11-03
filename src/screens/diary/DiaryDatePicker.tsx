import { useI18n } from '../../i18n/react';
import { InfoNotice } from '../../components/InfoNotice';
import { useQuery } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { View } from 'react-native';
import { BottomSheetModal } from '../../components/BottomSheetModal';
import { HeaderAction } from '../../components/HeaderAction';
import { QueryError } from '../../components/QueryError';
import { isDate } from '../../domain/date';
import { diaryQueries, useToday } from '../../queries';
import { DatePickerCalendar } from '../calendar/DatePickerCalendar';

export function DiaryDatePicker({
  value,
  diaryId,
  onClose,
  onApply,
}: {
  value: string | null;
  diaryId?: number;
  onClose: () => void;
  onApply: (date: string) => void;
}) {
  const { t } = useI18n();

  const db = useSQLiteContext();
  const today = useToday();
  const [draft, setDraft] = useState(value);
  const [month, setMonth] = useState((value ?? today).slice(0, 7));
  const diaries = useQuery(diaryQueries.month(db, month));
  const existing = useQuery({
    ...diaryQueries.byDate(db, draft ?? ''),
    enabled: draft !== null,
  });
  const occupied = !!existing.data && existing.data.id !== diaryId;
  const disabled =
    draft === null ||
    existing.isPending ||
    existing.isError ||
    occupied ||
    !isDate(draft) ||
    draft > today;
  return (
    <BottomSheetModal
      visible
      fixedHeight
      title={t('diary.chooseDate')}
      onClose={onClose}
      headerLeft={
        <HeaderAction
          side="left"
          label={t('calendar.today')}
          accessibilityLabel={t('diary.chooseToday')}
          accessibilityHint={t('diary.chooseTodayHint')}
          onPress={() => {
            setDraft(today);
            setMonth(today.slice(0, 7));
          }}
        />
      }
      headerRight={(close) => (
        <HeaderAction
          label={t('common.done')}
          disabled={disabled}
          onPress={() => {
            if (!disabled && draft !== null) {
              onApply(draft);
              close();
            }
          }}
        />
      )}
    >
      <View className="gap-4">
        <DatePickerCalendar
          month={month}
          today={today}
          selected={draft ?? ''}
          minDate="1900-01-01"
          diaryDates={diaries.data?.map((diary) => diary.date)}
          onMonthChange={setMonth}
          onSelect={(next) => {
            if (!isDate(next) || next < '1900-01-01' || next > today) return;
            setDraft(next);
            setMonth(next.slice(0, 7));
          }}
        />
        {diaries.isError ? (
          <QueryError
            message={t('diary.recordedDatesFailed')}
            onRetry={() => void diaries.refetch()}
          />
        ) : draft !== null && existing.isError ? (
          <QueryError
            message={t('diary.selectedDateFailed')}
            onRetry={() => void existing.refetch()}
          />
        ) : (
          <InfoNotice>
            {draft === null
              ? t('diary.chooseDateHint')
              : existing.isPending
                ? t('diary.checkingDate')
                : occupied
                  ? t('diary.dateOccupied')
                  : t('diary.datePreserved')}
          </InfoNotice>
        )}
      </View>
    </BottomSheetModal>
  );
}
