import { NoticeHost } from '../../components/NoticeProvider';
import { SheetHeader } from '../../components/SheetHeader';
import { useI18n } from '../../i18n/react';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SheetModal } from '../../components/SheetModal';
import type { BottomSheetModal } from '@expo/ui/community/bottom-sheet';
import { HeaderAction } from '../../components/HeaderAction';
import { InfoNotice } from '../../components/InfoNotice';
import { PickerOption } from '../../components/PickerOption';
import { Text } from '../../components/Text';
import { HabitStars } from './HabitStars';

export function HabitPriorityPicker({
  value,
  onApply,
  onClose,
}: {
  value: number;
  onApply: (value: number) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const priorityLabels = [t('habit.free'), t('habit.low'), t('habit.normal'), t('habit.high')];

  const [draft, setDraft] = useState(value);
  const sheet = useRef<BottomSheetModal>(null);
  useEffect(() => {
    sheet.current?.present();
  }, []);
  const closeSheet = () => sheet.current?.dismiss();
  return (
    <SheetModal ref={sheet} onDismiss={onClose}>
      <SheetHeader
        title={t('habit.priority')}
        headerButton={
          <HeaderAction
            label={t('common.done')}
            onPress={() => {
              onApply(draft);
              closeSheet();
            }}
          />
        }
        onClose={closeSheet}
      />

      <ScrollView
        className="mx-1 shrink grow-0"
        contentContainerClassName="py-8"
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-3">
          {[
            [0, 1],
            [2, 3],
          ].map((row) => (
            <View key={row[0]} className="flex-row gap-3">
              {row.map((priority) => {
                const label =
                  priority === 0
                    ? t('habit.freeLabel')
                    : t('habit.priorityDaily', { value: priorityLabels[priority] });
                return (
                  <View key={priority} className="flex-1">
                    <PickerOption
                      selected={draft === priority}
                      accessibilityLabel={label}
                      onPress={() => setDraft(priority)}
                    >
                      <HabitStars priority={priority} />
                      <Text
                        className={`text-sm font-normal ${draft === priority ? 'text-theme-accent-deep' : 'text-theme-text-secondary'}`}
                      >
                        {label}
                      </Text>
                    </PickerOption>
                  </View>
                );
              })}
            </View>
          ))}
          <InfoNotice>{t('habit.freeItemsNotice')}</InfoNotice>
        </View>
      </ScrollView>
      <NoticeHost modal />
    </SheetModal>
  );
}
