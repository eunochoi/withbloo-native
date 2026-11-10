import { ContentTopButton, ContentTopButtons } from '../../components/ContentTopButton';
import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';
import { formatDisplayDate } from '../../i18n/format';
import { translateErrorMessage } from '../../i18n/errors';
import { useI18n } from '../../i18n/react';
import { BottomSheetPage } from '../../components/bottom-sheet/BottomSheetPage';
import { BottomSheetModal } from '../../components/bottom-sheet/BottomSheetModal';
import { useNotice } from '../../components/NoticeProvider';
import { Text } from '../../components/Text';
import { QueryState } from '../../components/QueryState';
import { PickerAction } from '../../components/PickerAction';
import { ConfirmModal } from '../../components/ConfirmModal';
import { RecordMenuButton } from '../../components/RecordMenuButton';
import { RecordSortPicker } from '../../components/RecordSortPicker';
import { AppIcon } from '../../components/AppIcon';
import { useAppTheme } from '../../theme/AppThemeProvider';
import { withReadLock } from '../../db';
import { getHabitById } from '../../db/habit';
import { getSoberById, getSoberRestarts } from '../../db/sober';
import {
  getActivityPage,
  getActivityDay,
  deleteActivityRecord,
  type ActivityRecord,
  type RecordScope,
  type RecordCursor,
} from '../../db/records';
import { dateTimeDraft, isDate, localDate } from '../../domain/date';
import { getSoberAchievements } from '../../domain/sober';
import { useRecordMutation, useToday } from '../../queries';
import { DiaryGallery } from '../diary/DiaryGallery';
import { useModalNavigation } from '../../navigation/ModalNavigationProvider';

export function ActivityRecordListScreen({ scope }: { scope: RecordScope }) {
  const { t, language, formatLocale } = useI18n();
  const { colors, iconSizes, rem } = useAppTheme();
  const { showNotice } = useNotice();
  const { openModal } = useModalNavigation();
  const { id, date } = useLocalSearchParams<{ id: string; date?: string }>();
  const mode = date ? 'day' : 'list';
  const parentId = Number(id);
  const valid = Number.isSafeInteger(parentId) && parentId > 0 && (date === undefined || isDate(date));
  const today = useToday();
  const db = useSQLiteContext();
  const parent = useQuery({
    queryKey: [scope, 'id', parentId],
    enabled: valid,
    queryFn: () =>
      withReadLock(async () =>
        scope === 'habit' ? getHabitById(db, parentId) : getSoberById(db, parentId),
      ),
  });
  const [sort, setSort] = useState<'ASC' | 'DESC'>('DESC');
  const [sorting, setSorting] = useState(false);
  const [menu, setMenu] = useState<ActivityRecord | null>(null);
  const [deleting, setDeleting] = useState<ActivityRecord | null>(null);
  const [error, setError] = useState('');
  const saving = useRef(false);
  const list = useInfiniteQuery({
    queryKey: [scope, 'activity-records', parentId, sort],
    enabled: valid && !!parent.data && mode === 'list',
    initialPageParam: null as RecordCursor | null,
    queryFn: ({ pageParam }) =>
      withReadLock(() => getActivityPage(db, scope, parentId, sort, pageParam)),
    getNextPageParam: (page) => page.nextCursor,
  });
  const day = useQuery({
    queryKey: [scope, 'activity-day', parentId, date],
    enabled: valid && !!parent.data && mode === 'day',
    queryFn: () => withReadLock(() => getActivityDay(db, scope, parentId, date!)),
  });
  const restarts = useQuery({
    queryKey: ['sober', 'restarts', parentId],
    enabled: scope === 'sober' && !!parent.data,
    queryFn: () => withReadLock(() => getSoberRestarts(db, parentId)),
  });
  const mutation = useRecordMutation(
    async (action: { id: number }) => deleteActivityRecord(db, scope, parentId, action.id),
    scope,
  );
  const busy = mutation.isPending;
  usePreventRemove(busy, () => setError(t('habit.recordSaving')));
  const run = async (action: Parameters<typeof mutation.mutateAsync>[0], done: () => void) => {
    if (saving.current) return;
    saving.current = true;
    setError('');
    try {
      await mutation.mutateAsync(action);
      done();
    } catch (failure) {
      const message = failure instanceof Error ? failure.message : t('common.retryMessage');
      setError(message);
      showNotice({
        tone: 'error',
        title: t('sober.recordFailed'),
        message: translateErrorMessage(message, language),
      });
      throw failure;
    } finally {
      saving.current = false;
    }
  };
  const rows =
    mode === 'day' ? (day.data ?? []) : (list.data?.pages.flatMap((page) => page.records) ?? []);
  const listQuery = mode === 'day' ? day : list;
  const canAdd =
    !!parent.data &&
    (!date || (date >= localDate(parent.data.initial_started_at) && date <= today));
  const title = mode === 'day' && isDate(date)
    ? formatDisplayDate(date, formatLocale, 'day')
    : t(scope === 'sober' ? 'sober.viewNotes' : 'habit.allRecords');
  return (
    <>
      <BottomSheetPage
        title={title}
        scrollableTitle
        backRoute={scope === 'habit' ? `/habit/${parentId}` : `/sober/${parentId}`}
        onBeforeClose={() => !saving.current && !busy}

      >
        <QueryState query={parent} />
        {!valid || (!parent.isPending && !parent.data && !parent.error) ? (
          <Text>{t('sober.checkItemDate')}</Text>
        ) : parent.data ? (
          <View className="gap-3 pb-6">
            {mode === 'day' && canAdd && (
              <ContentTopButtons><ContentTopButton label={t('habit.recordAdd')} disabled={busy}
                icon={<AppIcon name="add" size={iconSizes.sm} color={colors.accent} />}
                onPress={() => openModal({ pathname: scope === 'habit' ? '/habit/[id]/record-form' : '/sober/[id]/record-form', params: { id, mode: 'new', date, type: scope === 'sober' ? 'RESTART' : 'MEMO' } })} /></ContentTopButtons>
            )}
            {mode === 'list' && rows.length > 0 && (
              <ContentTopButtons><ContentTopButton label={t(sort === 'DESC' ? 'habit.latestFirst' : 'habit.oldestFirst')}
                icon={<AppIcon name="sort" size={iconSizes.sm} color={colors.accent} />} onPress={() => setSorting(true)} /></ContentTopButtons>
            )}
            <QueryState query={listQuery} />
            {scope === 'sober' &&
              mode === 'day' &&
              parent.data &&
              'goal_mode' in parent.data &&
              getSoberAchievements(parent.data, restarts.data ?? [], Date.now())
                .filter((achievement) => localDate(achievement.achievedAt) === date)
                .map((achievement) => (
                  <View
                    key={achievement.achievedAt}
                    className="flex-row items-center gap-3 rounded-2xl border border-theme-border/50 p-4"
                  >
                    <AppIcon name="auto-awesome" size={iconSizes.lg} color={colors.achievement} />
                    <Text>{t('sober.achievement', { count: achievement.days })}</Text>
                  </View>
                ))}
            {!listQuery.isPending && !listQuery.error && !rows.length && (
              <View className="min-h-48 items-center justify-center gap-4 pt-8">
                <AppIcon name="history" size={rem * 2.5} color={colors.textSecondary} />
                <Text className="text-center text-lg font-semibold">{t('habit.noMemos')}</Text>
                <Text className="text-center text-base leading-relaxed text-theme-text-secondary">
                  {t('habit.noMemosHint')}
                </Text>
              </View>
            )}
            {rows.map((record, index) => (
              <View key={record.id} className="gap-3">
                {mode !== 'day' &&
                  (index === 0 ||
                    localDate(rows[index - 1].recorded_at) !== localDate(record.recorded_at)) && (
                    <Text className={`font-semibold ${index ? 'pt-6' : ''}`}>
                      {formatDisplayDate(record.recorded_at, formatLocale, 'day')}
                    </Text>
                  )}
                <View className="gap-2 ios:curve-continuous rounded-2xl border border-theme-border/50 p-4">
                  <View className="flex-row items-center justify-between gap-3">
                    <Text className="text-base">
                      {dateTimeDraft(record.recorded_at).hour}:
                      {dateTimeDraft(record.recorded_at).minute}
                      {` · ${t(scope === 'sober' && record.type === 'RESTART' ? 'sober.restartRecord' : 'habit.record')}`}
                    </Text>
                    <RecordMenuButton
                      muted
                      className="h-11 w-11 items-center justify-center"
                      accessibilityLabel={t('habit.recordMenu')}
                      onPress={() => setMenu(record)}
                    />
                  </View>
                  {!!record.images?.length && <DiaryGallery images={record.images} detail cardAspect />}
                  {!!record.memo && <Text className="text-sm leading-relaxed text-theme-text-secondary">{record.memo}</Text>}
                </View>
              </View>
            ))}
            {mode !== 'day' && list.hasNextPage && (
              <Pressable
                accessibilityRole="button"
                disabled={list.isFetching}
                onPress={() => void list.fetchNextPage()}
                className="min-h-11 items-center justify-center"
              >
                <Text className="text-theme-accent">{t('habit.moreRecords')}</Text>
              </Pressable>
            )}
            {!!error && (
              <Text accessibilityRole="alert" className="text-theme-danger">
                {translateErrorMessage(error, language)}
              </Text>
            )}
          </View>
        ) : null}
      </BottomSheetPage>
      <BottomSheetModal
        visible={!!menu}
        title={t('habit.recordMenu')}
        onClose={() => {
          setMenu(null);
        }}
      >
        {(close) => (
          <View className="gap-3">
            <PickerAction
              description={t('sober.editRecordHint')}
                  icon="edit"
                  title={t('habit.recordEdit')}
                  onPress={() => {
                    const record = menu;
                    close(() => {
                      setMenu(null);
                      if (record) openModal({ pathname: scope === 'habit' ? '/habit/[id]/record-form' : '/sober/[id]/record-form', params: { id, mode: 'edit', recordId: String(record.id) } });
                    });
                  }}
                />
                <PickerAction
                  description={t('sober.deleteRecordHint')}
                  icon="delete-outline"
                  title={t('habit.recordDelete')}
                  danger
                  onPress={() => {
                    const record = menu;
                    close(() => {
                      setMenu(null);
                      setDeleting(record);
                    });
                  }}
                />
          </View>
        )}
      </BottomSheetModal>
      <ConfirmModal
        visible={!!deleting}
        title={t('sober.deleteRecordTitle')}
        message={t(
          deleting?.type === 'RESTART' ? 'sober.deleteRecordWarning' : 'habit.memoDeleteWarning',
        )}
        danger
        confirmLabel={t('common.delete')}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) await run({ id: deleting.id }, () => setDeleting(null));
        }}
      />
      {sorting && (
        <RecordSortPicker
          title={t('habit.recordSort')}
          sortLabel={t('habit.recordSort')}
          sort={sort}
          onClose={() => setSorting(false)}
          onApply={(value) => {
            if (value !== 'CUSTOM') setSort(value);
            setSorting(false);
          }}
        />
      )}
    </>
  );
}
