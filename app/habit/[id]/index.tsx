import { useModalNavigation } from '../../../src/navigation/ModalNavigationProvider';
import { getActivityDates } from '../../../src/db/records';
import { withReadLock } from '../../../src/db';
import { ScrollableName } from '../../../src/components/ScrollableName';
import { resolveIconColor } from '../../../src/domain/constants';
import { itemAccentColors } from '../../../src/theme/colors';
import { formatDisplayDate } from '../../../src/i18n/format';
import { useI18n } from '../../../src/i18n/react';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useMemo } from 'react';
import { View } from 'react-native';
import { BottomSheetPage } from '../../../src/components/bottom-sheet/BottomSheetPage';
import { HabitIcon } from '../../../src/components/HabitIcon';
import { Button } from '../../../src/components/Button';
import { InfoNotice } from '../../../src/components/InfoNotice';
import { QueryState } from '../../../src/components/QueryState';
import { Text } from '../../../src/components/Text';
import { ProgressBar } from '../../../src/components/ProgressBar';
import { localDate } from '../../../src/domain/date';
import { getHabitMonthSummary } from '../../../src/domain/habitStats';
import { habitQueries, useToday } from '../../../src/queries';
import { HabitMenu } from '../../../src/screens/habit/HabitMenu';
import { HabitStars } from '../../../src/screens/habit/HabitStars';
import { HabitStatistics } from '../../../src/screens/habit/HabitStatistics';
import { HabitInfoCarousel } from '../../../src/screens/habit/HabitInfoCarousel';
import { useAppTheme } from '../../../src/theme/AppThemeProvider';

export default function HabitDetail() {
  const { t, formatLocale } = useI18n();

  const { rem: appRem, colors, mode } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const { openModal } = useModalNavigation();
  const memos = useQuery({ queryKey: ['habit', 'memo-dates', Number(id)], queryFn: () => withReadLock(() => getActivityDates(db, 'habit', Number(id))) });
  const router = useRouter();
  const today = useToday();
  const query = useQuery(habitQueries.byId(db, Number(id)));
  const records = useQuery(habitQueries.completionsByHabit(db, Number(id)));
  const dates = useMemo(() => (records.data ?? []).map((record) => record.date), [records.data]);
  const habit = query.data;
  const monthRate = habit && !records.isPending && !records.isError
    ? getHabitMonthSummary(today.slice(0, 7), localDate(habit.initial_started_at), dates, today).rate
    : null;
  const accent = itemAccentColors(
    resolveIconColor(habit?.icon_color ?? 'theme', colors.accent),
    colors.surface,
    mode,
  );
  return (
    <>
      <BottomSheetPage
        backRoute="/habit"
        handleColor={accent.color}
        title={t('habit.detailTitle')}
        menuAction={
          habit ? (
            <HabitMenu habit={habit} onDeleted={() => router.dismissTo('/habit')} />
          ) : undefined
        }
      >
        <View className="gap-8">
          <QueryState query={query} />
          <QueryState query={records} />
          {habit ? (
            <>
              <View className="gap-8">
                <View className="w-full min-w-0 items-center gap-3">
                  <HabitIcon name={habit.icon_key} colorKey={habit.icon_color} size={appRem * 4} />
                  <HabitStars color={accent.color} priority={habit.priority} size={appRem * 1.125} />
                  <View className="w-[90%] min-w-0">
                    <ScrollableName heading className="text-center text-xl font-semibold">{habit.name}</ScrollableName>
                  </View>
                </View>
                <HabitInfoCarousel habit={habit} dates={dates} today={today} unavailable={records.isPending || records.isError} color={accent.color} />
                {!!habit.description?.trim() && (
                  <Text textBreakStrategy="highQuality" lineBreakStrategyIOS="standard" className="w-[90%] min-w-0 self-center text-center text-base leading-relaxed text-theme-text-secondary">{habit.description}</Text>
                )}
                {habit.priority > 0 && (
                  <View className="w-[90%] self-center gap-3">
                    <View className="flex-row justify-between gap-2">
                      <Text className="text-sm text-theme-text-secondary">{t('habit.monthProgress')}</Text>
                      <Text className="text-sm text-theme-text-secondary">{monthRate === null ? '—' : `${monthRate}%`}</Text>
                    </View>
                    {monthRate === null ? (
                      <View className="h-5 w-full rounded-full bg-theme-border/80" />
                    ) : (
                      <ProgressBar value={Number(monthRate)} color={accent.color} accessibilityLabel={t('habit.monthProgress')} />
                    )}
                  </View>
                )}
                <View className="gap-3 px-1">
                  <Button label={t('habit.recordAdd')} labelWeight="normal" style={{ backgroundColor: accent.color, borderColor: accent.color }} labelStyle={{ color: colors.surface }} onPress={() => openModal({ pathname: '/habit/[id]/record-form', params: { id, mode: 'new' } })} />
                  <Button label={t('habit.allRecords')} labelWeight="normal" subtle onPress={() => openModal({ pathname: '/habit/[id]/records', params: { id } })} />
                </View>
              </View>
              <HabitStatistics
                accent={accent}
                habit={habit}
                dates={dates}
                memoDates={memos.data ?? []}
                onSelectDate={(date) => openModal({ pathname: '/habit/[id]/records', params: { id, mode: 'day', date } })}
                today={today}
                unavailable={records.isPending || records.isError}
              />
              <View className="px-1 gap-2">
                <InfoNotice numberOfLines={0} adjustsFontSizeToFit={false}>
                  {t('habit.started', {
                    value: formatDisplayDate(
                      habit.initial_started_at,
                      formatLocale,
                      'shortDateTime',
                    ),
                  })}
                </InfoNotice>
                {habit.priority === 0 && (
                  <InfoNotice numberOfLines={0} adjustsFontSizeToFit={false}>
                    {t('habit.intervalNotice')}
                  </InfoNotice>
                )}
                {habit.priority > 0 && (
                  <>
                    <InfoNotice numberOfLines={0} adjustsFontSizeToFit={false}>
                      {t('habit.eligibleNotice')}
                    </InfoNotice>
                    <InfoNotice numberOfLines={0} adjustsFontSizeToFit={false}>
                      {t('habit.rateNotice')}
                    </InfoNotice>
                  </>
                )}
              </View>
            </>
          ) : !query.isPending && !query.error ? (
            <Text>{t('habit.notFound')}</Text>
          ) : null}
        </View>
      </BottomSheetPage>
    </>
  );
}
