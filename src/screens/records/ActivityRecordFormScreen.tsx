import { ScrollEdgeFade } from '../../components/ScrollEdgeFade';
import { useScrollFade } from '../../hooks/useScrollFade';
import { View, ScrollView } from 'react-native';
import { useIsFocused } from 'expo-router/react-navigation';
import { useRouter } from 'expo-router';
import { NoticeHost } from '../../components/NoticeProvider';
import { useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { useQuery } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';
import { translateErrorMessage } from '../../i18n/errors';
import { useI18n } from '../../i18n/react';
import { SheetHeader } from '../../components/SheetHeader';
import { useNotice } from '../../components/NoticeProvider';
import { Text } from '../../components/Text';
import { QueryState } from '../../components/QueryState';
import { withReadLock } from '../../db';
import { getHabitById, getCompletionsByHabit } from '../../db/habit';
import { getSoberById, getSoberRestarts } from '../../db/sober';
import {
  getActivityRecord,
  saveActivityRecord,
  type ActivityRecord,
  type RecordScope,
} from '../../db/records';
import { isDate, localDate } from '../../domain/date';
import { useRecordMutation } from '../../queries';
import type { DraftImage } from '../../media';
import { ActivityRecordForm } from './ActivityRecordForm';

export function ActivityRecordFormScreen({
  scope,
  legacy,
}: {
  scope: RecordScope;
  legacy?: boolean;
}) {
  const sheetFade = useScrollFade();
  const router = useRouter();
  const focused = useIsFocused();
  const { t, language } = useI18n();
  const { showNotice } = useNotice();
  const {
    id,
    mode: requestedMode,
    date,
    type,
    restartId,
    recordId,
  } = useLocalSearchParams<{
    id: string;
    mode?: string;
    date?: string;
    type?: string;
    restartId?: string;
    recordId?: string;
  }>();
  const mode = legacy ? (restartId ? 'edit' : 'new') : (requestedMode ?? 'new');
  const selectedRecordId = legacy ? restartId : recordId;
  const parentId = Number(id);
  const valid =
    Number.isSafeInteger(parentId) &&
    parentId > 0 &&
    ['new', 'edit'].includes(mode) &&
    (date === undefined || isDate(date)) &&
    (mode !== 'edit' ||
      (Number.isSafeInteger(Number(selectedRecordId)) && Number(selectedRecordId) > 0));
  const db = useSQLiteContext();
  const parent = useQuery({
    queryKey: [scope, 'id', parentId],
    enabled: valid,
    queryFn: () =>
      withReadLock(async () =>
        scope === 'habit' ? getHabitById(db, parentId) : getSoberById(db, parentId),
      ),
  });
  const selectedRecord = useQuery({
    queryKey: [scope, 'activity-record', parentId, selectedRecordId],
    enabled: valid && mode === 'edit',
    queryFn: () =>
      withReadLock(() => getActivityRecord(db, scope, parentId, Number(selectedRecordId))),
  });
  const recordDraft: Partial<ActivityRecord> | null | undefined =
    mode === 'new'
      ? {
          type:
            scope === 'sober' && (legacy || type !== 'MEMO')
              ? ('RESTART' as const)
              : ('MEMO' as const),
        }
      : mode === 'edit'
        ? selectedRecord.data
        : null;
  const [closed, setClosed] = useState(false);
  const [error, setError] = useState('');
  const saving = useRef(false);
  const restarts = useQuery({
    queryKey: ['sober', 'restarts', parentId],
    enabled: scope === 'sober' && !!parent.data,
    queryFn: () => withReadLock(() => getSoberRestarts(db, parentId)),
  });
  const completions = useQuery({
    queryKey: ['habit', 'completions', parentId],
    enabled: scope === 'habit' && !!parent.data,
    queryFn: () => withReadLock(() => getCompletionsByHabit(db, parentId)),
  });
  const mutation = useRecordMutation(
    async (action: {
      kind: 'save';
      input: {
        id?: number;
        type: 'MEMO' | 'RESTART';
        recorded_at: string;
        memo: string | null;
        images: DraftImage[];
      };
    }) => {
      return saveActivityRecord(db, scope, parentId, action.input);
    },
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
  const title = t(recordDraft?.id ? 'habit.recordFormEdit' : 'habit.recordFormAdd');
  if (parent.data && recordDraft)
    return (
      <ActivityRecordForm
        key={`${recordDraft.id ?? 'new'}:${recordDraft.type}`}
        record={recordDraft}
        scope={scope}
        name={parent.data.name}
        date={date}
        startedAt={parent.data.initial_started_at}
        habitRecords={
          scope === 'habit' && !('goal_mode' in parent.data)
            ? {
                dates: (completions.data ?? []).map((item) => item.date),
                iconKey: parent.data.icon_key,
                iconColor: parent.data.icon_color,
              }
            : undefined
        }
        soberRecords={
          scope === 'sober' && 'goal_mode' in parent.data
            ? {
                dates: (restarts.data ?? []).map((item) => localDate(item.restarted_at)),
                iconKey: parent.data.icon_key,
                iconColor: parent.data.icon_color,
              }
            : undefined
        }
        busy={busy}
        error={error}
        title={title}
        backRoute={scope === 'habit' ? `/habit/${parentId}` : `/sober/${parentId}`}
        closed={closed}
        canClose={() => !saving.current && !busy}
        onCancel={() => !saving.current && !busy}
        onSave={(input) =>
          run({ kind: 'save', input }, () => setClosed(true)).catch(() => undefined)
        }
      />
    );
  return (
    <View className="flex-1 px-[5%] pt-2">
      <SheetHeader
        title={t(mode === 'edit' ? 'habit.recordFormEdit' : 'habit.recordFormAdd')}
        onClose={() =>
          router.canGoBack()
            ? router.back()
            : router.replace(scope === 'habit' ? `/habit/${parentId}` : `/sober/${parentId}`)
        }
      />
      <View className="mx-1 min-h-0 flex-1 overflow-hidden">
        <ScrollView
          onScroll={sheetFade.onScroll}
          scrollEventThrottle={16}
          onLayout={sheetFade.onLayout}
          onContentSizeChange={sheetFade.onContentSizeChange}
          className="flex-1"
          contentContainerClassName="gap-7 py-8 pb-12"
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          <QueryState query={parent} />
          {mode === 'edit' && <QueryState query={selectedRecord} />}
          {mode === 'edit' &&
            !selectedRecord.isPending &&
            !selectedRecord.error &&
            !selectedRecord.data && <Text>{t('sober.restartNotFound')}</Text>}
          {(!valid || (!parent.isPending && !parent.data && !parent.error)) && (
            <Text>{t('sober.checkItemDate')}</Text>
          )}
        </ScrollView>
        <ScrollEdgeFade edge="top" visible={sheetFade.topVisible} />
        <ScrollEdgeFade
          edge="bottom"
          visible={sheetFade.bottomVisible}
          includeBottomInset={false}
          includeToolbar={false}
        />
      </View>
      <NoticeHost modal active={focused} />
    </View>
  );
}
