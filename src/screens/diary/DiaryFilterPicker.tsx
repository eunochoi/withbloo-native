import { ScrollEdgeFade } from '../../components/ScrollEdgeFade';
import { useScrollFade } from '../../hooks/useScrollFade';
import { useI18n } from '../../i18n/react';
import { SheetModal } from '../../components/SheetModal';
import type { BottomSheetModal } from '@expo/ui/community/bottom-sheet';
import type { UseQueryResult } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SheetHeader } from '../../components/SheetHeader';
import { SheetSectionHeading } from '../../components/SheetSectionHeading';
import { ContentBottomButton } from '../../components/ContentBottomButton';
import { FormPickerRow } from '../../components/FormPickerRow';
import { HeaderAction } from '../../components/HeaderAction';
import { InfoNotice } from '../../components/InfoNotice';
import { PickerOption } from '../../components/PickerOption';
import { QueryState } from '../../components/QueryState';
import { Text } from '../../components/Text';
import {
  DIARY_EMOTION_GROUPS,
  DIARY_SEASONS,
  type DiaryEmotionGroup,
  type DiarySeason,
} from '../../domain/diaryFilters';
import { selectionSummary } from '../../domain/selection';

export function DiaryFilterPicker({
  year,
  yearsQuery,
  seasons,
  emotionGroups,
  currentYear,
  onClose,
  onApply,
}: {
  year: number | null;
  yearsQuery: UseQueryResult<number[], Error>;
  seasons: DiarySeason[];
  emotionGroups: DiaryEmotionGroup[];
  currentYear: number;
  onClose: () => void;
  onApply: (
    year: number | null,
    seasons: DiarySeason[],
    emotionGroups: DiaryEmotionGroup[],
  ) => void;
}) {
  const sheetFade = useScrollFade();
  const { t } = useI18n();
  const sheet = useRef<BottomSheetModal>(null);
  const yearSheet = useRef<BottomSheetModal>(null);
  useEffect(() => {
    sheet.current?.present();
  }, []);

  const initialYear = year !== null && year >= 1900 && year <= currentYear ? year : null;
  const [draftYear, setYear] = useState(initialYear);
  const [draftSeasons, setSeasons] = useState(seasons);
  const [draftEmotionGroups, setEmotionGroups] = useState(emotionGroups);
  const selectedYear =
    draftYear !== null &&
    yearsQuery.data !== undefined &&
    !yearsQuery.isError &&
    !yearsQuery.data.includes(draftYear)
      ? null
      : draftYear;
  return (
    <SheetModal
      ref={sheet}
      onDismiss={onClose}
    >
      <SheetHeader
        title={t('diary.filterTitle')}
        onClose={() => sheet.current?.dismiss()}
        headerButton={
          <HeaderAction
            label={t('common.apply')}
            accessibilityLabel={t('ui.applyTitle', { title: t('diary.filterTitle') })}
            onPress={() => {
              onApply(selectedYear, draftSeasons, draftEmotionGroups);
              sheet.current?.dismiss();
            }}
          />
        }
      />
      <View className="mx-1 shrink grow-0 overflow-hidden">
        <ScrollView
          onScroll={sheetFade.onScroll}
          scrollEventThrottle={16}
          onLayout={sheetFade.onLayout}
          onContentSizeChange={sheetFade.onContentSizeChange}
          className="min-h-0 shrink grow-0"
          contentContainerClassName="gap-8 py-8"
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          <View className="gap-10">
            <SheetSectionHeading icon="filter-list" title={t('ui.filterConditions')} />
            <View className="gap-6 pl-7">
              <View className="gap-3">
                <Text className="text-base font-semibold text-theme-text-secondary">{t('diary.yearLabel')}</Text>
                <FormPickerRow
                  label={
                    selectedYear === null
                      ? t('diary.allYears')
                      : t('home.year', { count: selectedYear })
                  }
                  accessibilityLabel={t('home.chooseYear')}
                  disabled={false}
                  onPress={() => yearSheet.current?.present()}
                />
              </View>
              <View className="gap-3">
                <View className="flex-row items-baseline justify-between gap-3">
                  <Text className="text-base font-semibold text-theme-text-secondary">{t('diary.seasonLabel')}</Text>
                  <Text className="min-w-0 shrink text-right text-sm text-theme-text-secondary">
                    {selectionSummary(
                      draftSeasons.map((season) => t(`diary.${season}`)),
                      4,
                      t('diary.allSeasons'),
                    )}
                  </Text>
                </View>
                <View className="gap-3">
                  {(
                    [
                      ['spring', 'summer'],
                      ['autumn', 'winter'],
                    ] as const
                  ).map((row, index) => (
                    <View key={index} className="flex-row gap-3">
                      {row.map((value) => {
                        const selected = draftSeasons.includes(value);
                        return (
                          <View key={value} className="flex-1 min-w-0">
                            <PickerOption
                              keepUncheckedBorder
                              softUncheckedBorder
                              compact
                              checkbox
                              selected={selected}
                              accessibilityLabel={t(`diary.${value}`)}
                              onPress={() =>
                                setSeasons(
                                  (Object.keys(DIARY_SEASONS) as DiarySeason[]).filter((season) =>
                                    season === value ? !selected : draftSeasons.includes(season),
                                  ),
                                )
                              }
                            >
                              <Text
                                className={`text-base ${selected ? 'text-theme-accent-deep' : ''}`}
                              >
                                {t(`diary.${value}`)}
                              </Text>
                            </PickerOption>
                          </View>
                        );
                      })}
                    </View>
                  ))}
                </View>
                <InfoNotice numberOfLines={0} adjustsFontSizeToFit={false}>
                  {(
                    [
                      ['spring', 'summer'],
                      ['autumn', 'winter'],
                    ] as const
                  )
                    .map((row) =>
                      row
                        .map((season) => `${t(`diary.${season}`)} ${t(`diary.${season}Months`)}`)
                        .join(', '),
                    )
                    .join('\n')}
                </InfoNotice>
              </View>
              <View className="gap-3">
                <View className="flex-row items-baseline justify-between gap-3">
                  <Text className="text-base font-semibold text-theme-text-secondary">{t('diary.emotionLabel')}</Text>
                  <Text className="shrink text-sm text-theme-text-secondary">
                    {selectionSummary(
                      draftEmotionGroups.map((group) => t(`diary.${group}`)),
                      3,
                      t('diary.allEmotions'),
                    )}
                  </Text>
                </View>
                <View className="flex-row gap-3">
                  {(Object.keys(DIARY_EMOTION_GROUPS) as DiaryEmotionGroup[]).map((value) => {
                    const selected = draftEmotionGroups.includes(value);
                    return (
                      <View key={value} className="flex-1 min-w-0">
                        <PickerOption
                          keepUncheckedBorder
                          softUncheckedBorder
                          compact
                          dense
                          checkbox
                          className="flex-1"
                          selected={selected}
                          accessibilityLabel={t(`diary.${value}`)}
                          onPress={() =>
                            setEmotionGroups(
                              (Object.keys(DIARY_EMOTION_GROUPS) as DiaryEmotionGroup[]).filter(
                                (group) =>
                                  group === value ? !selected : draftEmotionGroups.includes(group),
                              ),
                            )
                          }
                        >
                          <Text className={`text-base ${selected ? 'text-theme-accent-deep' : ''}`}>
                            {t(`diary.${value}`)}
                          </Text>
                          <View className="min-h-8 w-full items-center justify-center">
                            <Text className="w-full text-center text-xs leading-4 text-theme-text-secondary">
                              {t(`diary.${value}Names`)}
                            </Text>
                          </View>
                        </PickerOption>
                      </View>
                    );
                  })}
                </View>
                <InfoNotice numberOfLines={0} adjustsFontSizeToFit={false}>
                  {t('diary.multiHint')}
                </InfoNotice>
              </View>
            </View>
          </View>
          <ContentBottomButton
            label={t('ui.reset')}
            accessibilityLabel={t('ui.resetSelection')}
            onPress={() => {
              setYear(null);
              setSeasons([]);
              setEmotionGroups([]);
            }}
          />
        </ScrollView>
        <ScrollEdgeFade edge="top" visible={sheetFade.topVisible} />
        <ScrollEdgeFade
          edge="bottom"
          visible={sheetFade.bottomVisible}
          includeBottomInset={false}
          includeToolbar={false}
        />
      </View>
      <SheetModal
        ref={yearSheet}
      >
        <SheetHeader
          title={t('home.chooseYear')}
          onClose={() => yearSheet.current?.dismiss()}
        />
        <ScrollView
          className="mx-1 shrink grow-0"
          contentContainerClassName="gap-3 py-8"
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {[null, ...(yearsQuery.data ?? [])].map((value) => (
            <PickerOption
              keepUncheckedBorder
              softUncheckedBorder
              key={value ?? 'all'}
              compact
              selected={selectedYear === value}
              accessibilityLabel={
                value === null ? t('diary.allYears') : t('home.year', { count: value })
              }
              onPress={() => {
                setYear(value);
                yearSheet.current?.dismiss();
              }}
            >
              <Text
                className={`text-base ${selectedYear === value ? 'text-theme-accent-deep' : ''}`}
              >
                {value === null ? t('diary.allYears') : t('home.year', { count: value })}
              </Text>
            </PickerOption>
          ))}
          <QueryState query={yearsQuery} />
        </ScrollView>
      </SheetModal>
    </SheetModal>
  );
}
