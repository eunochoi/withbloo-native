import { NoticeHost } from '../../components/NoticeProvider';
import { SheetHeader } from '../../components/SheetHeader';
import { useI18n } from '../../i18n/react';
import { InfoNotice } from '../../components/InfoNotice';
import { useQuery } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SheetModal } from '../../components/SheetModal';
import type { BottomSheetModal } from '@expo/ui/community/bottom-sheet';
import { HeaderAction } from '../../components/HeaderAction';
import { QueryError } from '../../components/QueryError';
import { isDate } from '../../domain/date';
import { diaryQueries, useToday } from '../../queries';
import { DateSelectionForm } from '../../components/DateSelectionForm';

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
  const { t, language } = useI18n();

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
  const notice = useRef(t('diary.chooseDateHint'));
  if (draft === null) notice.current = t('diary.chooseDateHint');
  else if (!existing.isFetching && !existing.isPending && !existing.isError)
    notice.current = t(occupied ? 'diary.dateOccupied' : 'diary.datePreserved');
  const disabled =
    draft === null ||
    existing.isPending ||
    existing.isFetching ||
    existing.isError ||
    occupied ||
    !isDate(draft) ||
    draft > today;
  const sheet = useRef<BottomSheetModal>(null);
  useEffect(() => {
    sheet.current?.present();
  }, []);
  const closeSheet = () => sheet.current?.dismiss();
  return (
    <SheetModal
      ref={sheet}
      onDismiss={onClose}
      fillHeight

    >
      <SheetHeader
        title={language.startsWith('ko') ? '날짜 선택' : 'Select date'}
        headerButton={
          <HeaderAction
            label={t('common.done')}
            disabled={disabled}
            onPress={() => {
              if (!disabled && draft !== null) {
                onApply(draft);
                closeSheet();
              }
            }}
          />
        }
        onClose={closeSheet}
      />

      <ScrollView
        className="mx-1 min-h-0 flex-1"
        contentContainerClassName="gap-7 py-8"
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-4">
          <DateSelectionForm
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
            <InfoNotice>{notice.current}</InfoNotice>
          )}
        </View>
      </ScrollView>

      <NoticeHost modal />
    </SheetModal>
  );
}
