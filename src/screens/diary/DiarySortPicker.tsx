import { SheetModal } from '../../components/SheetModal';
import type { BottomSheetModal } from '@expo/ui/community/bottom-sheet';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SheetHeader } from '../../components/SheetHeader';
import { ContentBottomButton } from '../../components/ContentBottomButton';
import { HeaderAction } from '../../components/HeaderAction';
import { InfoNotice } from '../../components/InfoNotice';
import { PickerOption } from '../../components/PickerOption';
import { Text } from '../../components/Text';
import { useI18n } from '../../i18n/react';

export function DiarySortPicker({
  sort,
  onClose,
  onApply,
}: {
  sort: 'ASC' | 'DESC';
  onClose: () => void;
  onApply: (sort: 'ASC' | 'DESC') => void;
}) {
  const { t } = useI18n();
  const [draftSort, setDraftSort] = useState(sort);
  const sheet = useRef<BottomSheetModal>(null);
  useEffect(() => {
    sheet.current?.present();
  }, []);

  return (
    <SheetModal
      ref={sheet}
      onDismiss={onClose}

    >
      <SheetHeader
        title={t('diary.sortTitle')}
        onClose={() => sheet.current?.dismiss()}
        headerButton={
          <HeaderAction
            label={t('common.apply')}
            onPress={() => {
              onApply(draftSort);
              sheet.current?.dismiss();
            }}
          />
        }
      />
      <ScrollView
        className="mx-1 shrink grow-0"
        contentContainerClassName="gap-8 py-8"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        <View className="gap-3">
          <Text className="text-base font-semibold">{t('diary.dateSort')}</Text>
          <View className="flex-row gap-3">
            {(['DESC', 'ASC'] as const).map((value) => {
              const label = t(value === 'DESC' ? 'ui.newest' : 'ui.oldest');
              return (
                <View key={value} className="flex-1">
                  <PickerOption
                    keepUncheckedBorder
                    softUncheckedBorder
                    compact
                    selected={draftSort === value}
                    accessibilityLabel={label}
                    onPress={() => setDraftSort(value)}
                  >
                    <Text
                      className={`text-base ${draftSort === value ? 'text-theme-accent-deep' : ''}`}
                    >
                      {label}
                    </Text>
                  </PickerOption>
                </View>
              );
            })}
          </View>
        </View>
        <InfoNotice numberOfLines={0} adjustsFontSizeToFit={false}>
          {t('ui.sortDescription', { value: t('diary.dateSort').replace(/(?:순)? 정렬$/, '') })}
        </InfoNotice>
        <ContentBottomButton
          label={t('ui.reset')}
          accessibilityLabel={t('ui.resetSelection')}
          onPress={() => setDraftSort('DESC')}
        />
      </ScrollView>
    </SheetModal>
  );
}
