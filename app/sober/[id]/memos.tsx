import { ScrollEdgeFade } from '../../../src/components/ScrollEdgeFade';
import { useScrollFade } from '../../../src/hooks/useScrollFade';
import { AnimatedFlatList } from '../../../src/components/AnimatedFlatList';
import { useIsFocused } from 'expo-router/react-navigation';
import { useRouter } from 'expo-router';
import { NoticeHost } from '../../../src/components/NoticeProvider';
import { ContentTopButton, ContentTopButtons } from '../../../src/components/ContentTopButton';
import { formatDisplayDate } from '../../../src/i18n/format';
import { useI18n } from '../../../src/i18n/react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useMemo, useRef, useState } from 'react';
import { ScrollView, ActivityIndicator, View } from 'react-native';
import { AppIcon } from '../../../src/components/AppIcon';
import { SheetHeader } from '../../../src/components/SheetHeader';
import { QueryError } from '../../../src/components/QueryError';
import { QueryState } from '../../../src/components/QueryState';
import { RecordSortPicker } from '../../../src/components/RecordSortPicker';
import { Text } from '../../../src/components/Text';
import type { SoberRestart } from '../../../src/db/types';
import { localDate } from '../../../src/domain/date';
import { soberQueries } from '../../../src/queries';
import { SoberRestartActions } from '../../../src/screens/sober/SoberRestartActions';
import { SoberRestartCard } from '../../../src/screens/sober/SoberRestartCard';
import { useAppTheme } from '../../../src/theme/AppThemeProvider';

type MemoRow = { record: SoberRestart; date: string; firstOfDate: boolean };

export default function SoberMemos() {
  const sheetFade = useScrollFade();
  const router = useRouter();
  const focused = useIsFocused();
  const { t, formatLocale } = useI18n();

  const { id } = useLocalSearchParams<{ id: string }>();
  const soberId = Number(id);
  const validId = Number.isSafeInteger(soberId) && soberId > 0;
  const db = useSQLiteContext();
  const { colors, iconSizes, rem } = useAppTheme();
  const [sort, setSort] = useState<'ASC' | 'DESC'>('DESC');
  const [sorting, setSorting] = useState(false);
  const fetchingNext = useRef(false);
  const sober = useQuery({ ...soberQueries.byId(db, soberId), enabled: validId });
  const list = useInfiniteQuery({
    ...soberQueries.memos(db, soberId, sort),
    enabled: validId && !!sober.data,
  });
  const rows = useMemo(() => {
    const records = list.data?.pages.flatMap((page) => page.records) ?? [];
    let previousDate = '';
    return records.map((record): MemoRow => {
      const date = localDate(record.restarted_at);
      const firstOfDate = previousDate !== date;
      previousDate = date;
      return { record, date, firstOfDate };
    });
  }, [list.data]);
  const loadMore = () => {
    if (fetchingNext.current || list.isFetching || !list.hasNextPage) return;
    fetchingNext.current = true;
    void list
      .fetchNextPage()
      .catch(() => undefined)
      .finally(() => {
        fetchingNext.current = false;
      });
  };
  const backRoute = validId ? (`/sober/${soberId}` as const) : '/sober';
  const empty = list.isPending ? (
    <View className="min-h-48 items-center justify-center">
      <ActivityIndicator color={colors.accent} accessibilityLabel={t('sober.notesLoading')} />
    </View>
  ) : list.isError && !list.data ? (
    <QueryError
      className="min-h-48"
      message={t('sober.notesFailed')}
      onRetry={() => void list.refetch()}
    />
  ) : (
    <View className="min-h-48 items-center justify-center gap-4 pt-8">
      <AppIcon name="history" size={rem * 2.5} color={colors.textSecondary} />
      <Text className="text-center text-lg font-semibold">{t('sober.notesEmpty')}</Text>
      <Text className="text-center text-base leading-relaxed text-theme-text-secondary">
        {t('sober.notesEmptyHint')}
      </Text>
    </View>
  );
  return (
    <SoberRestartActions key={soberId} soberId={soberId}>
      {({ pending, onMenu, onBeforeClose }) =>
        !validId || !sober.data ? (
          <View className="flex-1 px-[5%] pt-2">
            <SheetHeader
              title={t('sober.notesTitle')}
              onClose={() => {
                if (onBeforeClose()) {
                  router.canGoBack() ? router.back() : router.replace(backRoute);
                }
              }}
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
                {validId && <QueryState query={sober} />}
                {(!validId || (!sober.isPending && !sober.error)) && (
                  <Text className="text-center text-base">{t('sober.notFound')}</Text>
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
        ) : (
          <>
            <View className="flex-1 px-[5%] pt-2">
              <SheetHeader
                title={t('sober.notesName', { value: sober.data.name })}
                scrollableTitle={true}
                onClose={() => {
                  if (onBeforeClose()) {
                    router.canGoBack() ? router.back() : router.replace(backRoute);
                  }
                }}
              />
              <View className="mx-1 min-h-0 flex-1 overflow-hidden">
                <AnimatedFlatList
                  onScroll={sheetFade.onScroll}
                  scrollEventThrottle={16}
                  onLayout={sheetFade.onLayout}
                  onContentSizeChange={sheetFade.onContentSizeChange}
                  key={`${soberId}:${sort}`}
                  className="flex-1"
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                  {...{
                    data: rows,
                    keyExtractor: (item: unknown) => String((item as MemoRow).record.id),
                    contentContainerClassName: 'py-8',
                    removeClippedSubviews: false,
                    initialNumToRender: 8,
                    maxToRenderPerBatch: 8,
                    windowSize: 5,
                    ListHeaderComponent:
                      rows.length > 0 ? (
                        <View className="gap-3 pb-6">
                          <ContentTopButtons>
                            <ContentTopButton
                              label={sort === 'DESC' ? t('ui.newest') : t('ui.oldest')}
                              accessibilityLabel={t('sober.notesSortLabel', {
                                value: sort === 'DESC' ? t('ui.newest') : t('ui.oldest'),
                              })}
                              onPress={() => setSorting(true)}
                              icon={
                                <AppIcon name="sort" size={iconSizes.sm} color={colors.accent} />
                              }
                            />
                          </ContentTopButtons>
                        </View>
                      ) : null,
                    renderItem: ({ item: row, index }) => {
                      const item = row as MemoRow;
                      return (
                        <View className="gap-3 pb-3">
                          {item.firstOfDate && (
                            <Text
                              accessibilityRole="header"
                              className={`text-base font-semibold ${index ? 'pt-6' : ''}`}
                            >
                              {formatDisplayDate(item.date, formatLocale, 'long')}
                            </Text>
                          )}
                          <SoberRestartCard
                            record={item.record}
                            pending={pending}
                            onMenu={onMenu}
                          />
                        </View>
                      );
                    },
                    ListEmptyComponent: empty,
                    ListFooterComponent: (
                      <View className="items-center gap-3">
                        {list.isFetchingNextPage && (
                          <ActivityIndicator
                            color={colors.accent}
                            accessibilityLabel={t('sober.notesMoreLoading')}
                          />
                        )}
                        {list.isError && list.data && (
                          <QueryError
                            message={
                              list.isFetchNextPageError
                                ? t('sober.nextNotesFailed')
                                : t('sober.refreshNotesFailed')
                            }
                            onRetry={() => {
                              if (list.isFetchNextPageError) loadMore();
                              else void list.refetch();
                            }}
                          />
                        )}
                      </View>
                    ),
                    onEndReached: () => {
                      if (!list.isError) loadMore();
                    },
                    onEndReachedThreshold: 0.4,
                  }}
                />
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
            {sorting && (
              <RecordSortPicker
                title={t('sober.sortNotes')}
                sortLabel={t('sober.sortRestart')}
                sort={sort}
                onClose={() => setSorting(false)}
                onApply={(value) => {
                  if (value !== 'CUSTOM') setSort(value);
                }}
              />
            )}
          </>
        )
      }
    </SoberRestartActions>
  );
}
