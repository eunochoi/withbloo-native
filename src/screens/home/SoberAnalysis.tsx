import { ScrollableName } from '../../components/ScrollableName';
import { AnalysisSubtitle } from './AnalysisSubtitle';
import { getSoberSummary, SOBER_DAY_MS } from '../../domain/sober';
import { formatSoberDuration } from '../../i18n/sober';
import { formatDisplayDate } from '../../i18n/format';
import { useI18n } from '../../i18n/react';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { InfoNotice } from '../../components/InfoNotice';
import { SoberIcon } from '../../components/SoberIcon';
import { Text } from '../../components/Text';
import { UnderlineTab } from '../../components/UnderlineTab';
import type { Sober, SoberRestart } from '../../db/types';
import { getSoberStreaks } from '../../domain/sober';
import { useCurrentMinute } from '../../hooks/useCurrentMinute';
import { useModalNavigation } from '../../navigation/ModalNavigationProvider';
import { useAppTheme } from '../../theme/AppThemeProvider';
import { MUTED_CARD_BORDER_CLASS_NAME, UNDERLINE_TAB_LIST_CLASS_NAME } from '../../theme/classes';
import { AnalysisHeader } from './AnalysisHeader';

export function SoberAnalysis({ sobers, restarts }: { sobers: Sober[]; restarts: SoberRestart[] }) {
  const { t, language, formatLocale } = useI18n();

  const { openModal } = useModalNavigation();
  const now = useCurrentMinute();
  const { rem: appRem } = useAppTheme();
  const [tab, setTab] = useState<'top' | 'bottom'>('top');
  const records = sobers.flatMap((sober) =>
    getSoberStreaks(
      sober,
      restarts.filter((item) => item.sober_id === sober.id),
      now,
    ).map((record) => ({ sober, record })),
  );
  const labels =
    language === 'ko'
      ? ['3일 미만', '3일~1주', '1~2주', '2주~1개월', '1~3개월', '3개월 이상']
      : ['Under 3 days', '3–7 days', '1–2 weeks', '2 weeks–1 month', '1–3 months', '3+ months'];
  const counts = Array<number>(6).fill(0);
  for (const sober of sobers) {
    const duration = getSoberSummary(
      sober,
      restarts.filter((item) => item.sober_id === sober.id),
      now,
    ).duration;
    const index = [3, 7, 14, 30, 90].findIndex((days) => duration < days * SOBER_DAY_MS);
    counts[index < 0 ? 5 : index]++;
  }
  const visibleRecords = records
    .sort(
      (a, b) =>
        (tab === 'top'
          ? b.record.duration - a.record.duration
          : a.record.duration - b.record.duration) ||
        a.sober.id - b.sober.id ||
        Date.parse(a.record.start) - Date.parse(b.record.start),
    )
    .slice(0, 3);
  return (
    <View className="gap-4">
      <AnalysisHeader title={t('stats.soberTitle')}>
        {t('stats.totalItems', { count: sobers.length })}
      </AnalysisHeader>
      <View className="gap-4">
        <AnalysisSubtitle>{t('stats.distributionTitle')}</AnalysisSubtitle>
        <View className="mx-1 gap-4 rounded-theme border border-theme-accent/20 bg-theme-accent-light/50 px-4 py-6">
          <View className="flex-row flex-wrap justify-center gap-y-4">
            {counts.map(
              (count, i) =>
                count > 0 && (
                  <View key={i} className="w-1/3 min-w-0 items-center gap-2 px-1">
                    <View className="flex-row items-center justify-center gap-2">
                      <View
                        className="h-3 w-3 shrink-0 rounded-full bg-theme-accent"
                        style={{ opacity: 0.25 + i * 0.15 }}
                      />
                      <Text className="shrink text-center text-sm text-theme-text-secondary">
                        {labels[i]}
                      </Text>
                    </View>
                    <View className="flex-row items-baseline gap-1">
                      <Text className="text-2xl font-semibold">{count}</Text>
                      <Text className="text-base text-theme-text-secondary">
                        {language === 'ko' ? '개' : 'items'}
                      </Text>
                    </View>
                  </View>
                ),
            )}
          </View>
          {!sobers.length && (
            <Text className="text-center text-sm text-theme-text-secondary">
              {t('stats.soberEmpty')}
            </Text>
          )}
          <View
            accessible
            accessibilityLabel={labels.map((label, i) => `${label}: ${counts[i]}`).join(', ')}
            className={`h-4 flex-row gap-0.5 overflow-hidden rounded-full ${sobers.length ? '' : 'bg-theme-accent/30'}`}
          >
            {counts.map(
              (count, i) =>
                count > 0 && (
                  <View
                    key={i}
                    className="bg-theme-accent"
                    style={{ flexGrow: count, flexBasis: 0, opacity: 0.25 + i * 0.15 }}
                  />
                ),
            )}
          </View>
        </View>
      </View>
      <View accessibilityRole="tablist" className={UNDERLINE_TAB_LIST_CLASS_NAME}>
        {(
          [
            { value: 'top', label: t('stats.longestFirst') },
            { value: 'bottom', label: t('stats.shortestFirst') },
          ] as const
        ).map((option) => (
          <UnderlineTab
            key={option.value}
            selected={tab === option.value}
            onPress={() => setTab(option.value)}
          >
            {option.label}
          </UnderlineTab>
        ))}
      </View>
      <View
        className={`${MUTED_CARD_BORDER_CLASS_NAME} mx-1 p-6 bg-theme-surface-muted/60 ios:curve-continuous rounded-theme`}
      >
        {records.length ? (
          visibleRecords.map(({ sober, record }, index) => {
            const status = record.current ? t('stats.inProgress') : t('stats.ended');
            const duration = formatSoberDuration(record.duration, language);
            const [days, hours, minutes] = duration.split(' ');
            const range = t('stats.dateRange', {
              title: formatDisplayDate(record.start, formatLocale, 'shortDateTime'),
              value: record.current
                ? t('sober.current')
                : formatDisplayDate(record.end, formatLocale, 'shortDateTime'),
            });
            return (
              <Pressable
                key={`${sober.id}:${record.start}:${record.current ? 'current' : record.end}:${index}`}
                accessibilityRole="button"
                accessibilityLabel={t('stats.recordDetails', {
                  title: sober.name,
                  value: `${status}, ${duration}`,
                  setting: range,
                })}
                onPress={() => {
                  openModal(`/sober/${sober.id}`);
                }}
                className={`flex-row items-center gap-4 min-h-12 ${index > 0 ? 'pt-6' : ''} ${index < visibleRecords.length - 1 ? 'pb-6 border-b border-theme-border/50' : ''}`}
              >
                <View className="h-9 w-9 shrink-0 items-center justify-center">
                  <SoberIcon
                    name={sober.icon_key}
                    colorKey={sober.icon_color}
                    size={appRem * 2.25}
                  />
                </View>
                <View className="flex-1 min-w-0 gap-1">
                  <ScrollableName className="text-base leading-relaxed">
                    {sober.name}
                  </ScrollableName>
                  <Text
                    className={`text-sm ${record.current ? 'text-theme-accent' : 'text-theme-text-secondary'}`}
                  >
                    {status}
                  </Text>
                </View>
                <View className="shrink items-end gap-1">
                  <View className="flex-row items-baseline gap-1">
                    <Text
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      className="text-theme-text-primary font-semibold text-2xl"
                    >
                      {days.slice(0, -1)}
                    </Text>
                    <Text className="text-base text-theme-text-secondary">
                      {t('stats.daysUnit')}
                    </Text>
                  </View>
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    className="text-base text-theme-text-secondary"
                  >
                    {hours} {minutes}
                  </Text>
                </View>
              </Pressable>
            );
          })
        ) : (
          <Text className="text-center text-theme-text-secondary text-sm">
            {t('stats.soberEmpty')}
          </Text>
        )}
      </View>
      <InfoNotice numberOfLines={0} adjustsFontSizeToFit={false}>
        {t('stats.soberNotice')}
      </InfoNotice>
    </View>
  );
}
