import { NoticeHost } from '../../components/NoticeProvider';
import { SheetHeader } from '../../components/SheetHeader';
import { useI18n } from '../../i18n/react';
import { InfoNotice } from '../../components/InfoNotice';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, Switch, View } from 'react-native';
import { SheetModal } from '../../components/SheetModal';
import type { BottomSheetModal } from '@expo/ui/community/bottom-sheet';
import { FormPickerRow } from '../../components/FormPickerRow';
import { FilterSheet } from '../../components/FilterSheet';
import { PickerOption } from '../../components/PickerOption';
import { Text } from '../../components/Text';
import { useAppTheme } from '../../theme/AppThemeProvider';

export interface SoberFilter {
  priorityOnly: boolean;
  minimumDays: number;
}
export const DEFAULT_SOBER_FILTER: SoberFilter = { priorityOnly: false, minimumDays: 0 };
export const SOBER_RECORD_FILTERS = [
  { days: 0, label: '전체', shortLabel: '' },
  { days: 3, label: '3일 이상', shortLabel: '3일+' },
  { days: 7, label: '1주 이상', shortLabel: '1주+' },
  { days: 14, label: '2주 이상', shortLabel: '2주+' },
  { days: 30, label: '1개월 이상', shortLabel: '1개월+' },
  { days: 90, label: '3개월 이상', shortLabel: '3개월+' },
] as const;

export function SoberFilterPicker({
  filter,
  onClose,
  onApply,
}: {
  filter: SoberFilter;
  onClose: () => void;
  onApply: (filter: SoberFilter) => void;
}) {
  const { t } = useI18n();

  const recordFilters = SOBER_RECORD_FILTERS.map((option) => ({
    ...option,
    label: t(`sober.period${option.days}`),
  }));
  const { colors } = useAppTheme();
  const [draft, setDraft] = useState(filter);
  const [periodOpen, setPeriodOpen] = useState(false);
  const sheet = useRef<BottomSheetModal>(null);
  const afterDismiss = useRef<(() => void) | undefined>(undefined);
  useEffect(() => {
    if (periodOpen) sheet.current?.present();
  }, [periodOpen]);
  const closeSheet = (action?: () => void) => {
    if (afterDismiss.current) return false;
    afterDismiss.current = action;
    sheet.current?.dismiss();
    return true;
  };
  return (
    <FilterSheet
      title={t('sober.filterTitle')}
      onClose={onClose}
      onReset={() => setDraft(DEFAULT_SOBER_FILTER)}
      onApply={() => onApply(draft)}
    >
      <>
        <View className="flex-row items-center justify-between gap-3">
          <Text className="text-base font-semibold text-theme-text-secondary">{t('sober.onlyImportant')}</Text>
          <Switch
            accessibilityLabel={t('sober.onlyImportant')}
            value={draft.priorityOnly}
            onValueChange={(priorityOnly) => setDraft({ ...draft, priorityOnly })}
            ios_backgroundColor={colors.switchTrack}
            trackColor={{ false: colors.switchTrack, true: colors.accent }}
            thumbColor={colors.switchThumb}
          />
        </View>
        <View className="gap-3">
          <Text className="text-base font-semibold text-theme-text-secondary">{t('sober.minimumPeriod')}</Text>
          <FormPickerRow
            label={recordFilters.find((option) => option.days === draft.minimumDays)!.label}
            accessibilityLabel={t('sober.minimumPeriodChoice')}
            disabled={false}
            onPress={() => setPeriodOpen(true)}
          />
          <InfoNotice numberOfLines={0} adjustsFontSizeToFit={false}>
            {t('sober.minimumPeriodHint')}
          </InfoNotice>
        </View>
        {periodOpen && (
          <SheetModal
            ref={sheet}
            onDismiss={() => {
              const action = afterDismiss.current;
              afterDismiss.current = undefined;
              (() => setPeriodOpen(false))();
              action?.();
            }}

          >
            <SheetHeader title={t('sober.minimumPeriod')} onClose={closeSheet} />

            <ScrollView
              className="mx-1 shrink grow-0"
              contentContainerClassName="gap-7 py-8"
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
            >
              <View className="gap-3">
                {recordFilters.map((option) => (
                  <PickerOption
                    keepUncheckedBorder
                    softUncheckedBorder
                    key={option.days}
                    compact
                    selected={draft.minimumDays === option.days}
                    accessibilityLabel={t('sober.currentRecord', { value: option.label })}
                    onPress={() =>
                      closeSheet(() => setDraft({ ...draft, minimumDays: option.days }))
                    }
                  >
                    <Text
                      className={`text-base ${draft.minimumDays === option.days ? 'text-theme-accent-deep' : ''}`}
                    >
                      {option.label}
                    </Text>
                  </PickerOption>
                ))}
              </View>
            </ScrollView>

            <NoticeHost modal />
          </SheetModal>
        )}
      </>
    </FilterSheet>
  );
}
