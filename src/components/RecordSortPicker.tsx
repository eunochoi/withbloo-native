import { NoticeHost } from './NoticeProvider';
import { SheetHeader } from './SheetHeader';
import { useI18n } from '../i18n/react';
import { InfoNotice } from './InfoNotice';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, Switch, View } from 'react-native';
import { useAppTheme } from '../theme/AppThemeProvider';
import { SheetModal } from './SheetModal';
import type { BottomSheetModal } from '@expo/ui/community/bottom-sheet';
import { HeaderAction } from './HeaderAction';
import { ContentBottomButton } from './ContentBottomButton';
import { PickerOption } from './PickerOption';
import { Text } from './Text';

export function RecordSortPicker({
  title,
  sort,
  priorityFirst,
  recordSort,
  allowCustom = false,
  ascendingLabel,
  sortLabel,
  onClose,
  onApply,
}: {
  title: string;
  sort: 'ASC' | 'DESC' | 'CUSTOM';
  priorityFirst?: boolean;
  recordSort?: 'ASC' | 'DESC';
  allowCustom?: boolean;
  ascendingLabel?: string;
  sortLabel?: string;
  onClose: () => void;
  onApply: (
    sort: 'ASC' | 'DESC' | 'CUSTOM',
    priorityFirst: boolean,
    recordSort?: 'ASC' | 'DESC',
  ) => void;
}) {
  const { t } = useI18n();
  const { colors } = useAppTheme();
  const [draftSort, setSort] = useState(sort);
  const [draftRecordSort, setRecordSort] = useState(recordSort);
  const [draftPriority, setPriority] = useState(
    sort === 'CUSTOM' ? false : (priorityFirst ?? false),
  );
  const options = [
    { value: 'DESC', label: t('ui.newest') },
    { value: 'ASC', label: ascendingLabel ?? t('ui.oldest') },
    ...(allowCustom ? [{ value: 'CUSTOM', label: t('ui.custom') }] : []),
  ] as { value: 'ASC' | 'DESC' | 'CUSTOM'; label: string }[];
  const prioritySection = priorityFirst !== undefined && (
    <View className="flex-row items-center justify-between gap-3">
      <Text className="text-base font-semibold">{t('ui.priorityFirst')}</Text>
      <Switch
        accessibilityLabel={t('ui.priorityFirst')}
        value={draftPriority}
        onValueChange={(value) => {
          if (value && draftSort === 'CUSTOM') setSort('DESC');
          setPriority(value);
        }}
        ios_backgroundColor={colors.switchTrack}
        trackColor={{ false: colors.switchTrack, true: colors.accent }}
        thumbColor={colors.switchThumb}
      />
    </View>
  );
  const sheet = useRef<BottomSheetModal>(null);
  useEffect(() => {
    sheet.current?.present();
  }, []);
  const closeSheet = () => sheet.current?.dismiss();
  return (
    <SheetModal
      ref={sheet}
      onDismiss={onClose}

    >
      <SheetHeader
        title={title}
        headerButton={
          <HeaderAction
            label={t('common.apply')}
            onPress={() => {
              const priority = draftSort === 'CUSTOM' ? false : draftPriority;
              if (recordSort) onApply(draftSort, priority, draftRecordSort);
              else onApply(draftSort, priority);
              closeSheet();
            }}
          />
        }
        onClose={closeSheet}
      />

      <ScrollView
        className="mx-1 shrink grow-0"
        contentContainerClassName="gap-7 py-8"
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
      >
        {prioritySection}
        {recordSort && (
          <View className="gap-3">
            <Text className="text-base font-semibold">{t('ui.records')}</Text>
            <View className="flex-row gap-3">
              {(['DESC', 'ASC'] as const).map((value) => (
                <View key={value} className="flex-1">
                  <PickerOption
                    keepUncheckedBorder
                    softUncheckedBorder
                    compact
                    selected={draftRecordSort === value}
                    accessibilityLabel={t('ui.currentRecord', {
                      value: t(value === 'DESC' ? 'ui.longest' : 'ui.shortest'),
                    })}
                    onPress={() => setRecordSort(value)}
                  >
                    <Text
                      className={`text-base ${draftRecordSort === value ? 'text-theme-accent-deep' : ''}`}
                    >
                      {t(value === 'DESC' ? 'ui.longest' : 'ui.shortest')}
                    </Text>
                  </PickerOption>
                </View>
              ))}
            </View>
          </View>
        )}
        <View className="gap-3">
          <Text className="text-base font-semibold">
            {sortLabel ?? t('ui.createdDateSort')}
          </Text>
          <View className="flex-row gap-3">
            {options.map((option) => (
              <View key={option.value} className="flex-1">
                <PickerOption
                  keepUncheckedBorder
                  softUncheckedBorder
                  compact
                  selected={draftSort === option.value}
                  accessibilityLabel={option.label}
                  onPress={() => {
                    setSort(option.value);
                    if (option.value === 'CUSTOM') setPriority(false);
                  }}
                >
                  <Text
                    className={`text-base ${draftSort === option.value ? 'text-theme-accent-deep' : ''}`}
                  >
                    {option.label}
                  </Text>
                </PickerOption>
              </View>
            ))}
          </View>
        </View>
        <View className="gap-1">
          <InfoNotice numberOfLines={0} adjustsFontSizeToFit={false}>
            {draftSort === 'CUSTOM'
              ? t('ui.customDescription')
              : recordSort
                ? t('ui.recordsDescription', {
                    value: draftPriority ? t('ui.priorityPrefix') : '',
                  })
                : t('ui.sortDescription', {
                    value: `${draftPriority ? t('ui.importantPrefix') : ''}${(sortLabel ?? t('ui.createdDateSort')).replace(/(?:순)? 정렬$/, '')}`,
                  })}
          </InfoNotice>
          {allowCustom && <InfoNotice numberOfLines={0} adjustsFontSizeToFit={false}>{t('ui.sortPriorityConflict')}</InfoNotice>}
        </View>
        <ContentBottomButton
          label={t('ui.reset')}
          accessibilityLabel={t('ui.resetSelection')}
          onPress={() => {
            setSort('DESC');
            setPriority(false);
            setRecordSort(recordSort ? 'DESC' : undefined);
          }}
        />
      </ScrollView>

      <NoticeHost modal />
    </SheetModal>
  );
}
