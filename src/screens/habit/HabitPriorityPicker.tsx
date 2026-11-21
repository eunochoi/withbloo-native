import { NoticeHost } from '../../components/NoticeProvider';
import { SheetHeader } from '../../components/SheetHeader';
import { useI18n } from '../../i18n/react';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, Switch, View } from 'react-native';
import { SheetModal } from '../../components/SheetModal';
import type { BottomSheetModal } from '@expo/ui/community/bottom-sheet';
import { AppIcon } from '../../components/AppIcon';
import { HeaderAction } from '../../components/HeaderAction';
import { InfoNotice } from '../../components/InfoNotice';
import { PickerOption } from '../../components/PickerOption';
import { Text } from '../../components/Text';
import { useAppTheme } from '../../theme/AppThemeProvider';
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
  const { colors, iconSizes } = useAppTheme();
  const priorityLabels = [t('habit.noPriority'), t('habit.low'), t('habit.normal'), t('habit.high')];
  const priorityDescriptions = [
    t('habit.freePriorityDescription'),
    t('habit.lowPriorityDescription'),
    t('habit.normalPriorityDescription'),
    t('habit.highPriorityDescription'),
  ];

  const [daily, setDaily] = useState(value > 0);
  const [dailyPriority, setDailyPriority] = useState(value > 0 ? value : 1);
  const sections = [
    { daily: false, title: t('habit.free'), icon: 'edit', priorities: [0] },
    { daily: true, title: t('habit.daily'), icon: 'calendar', priorities: [1, 2, 3] },
  ] as const;
  const sheet = useRef<BottomSheetModal>(null);
  useEffect(() => {
    sheet.current?.present();
  }, []);
  const closeSheet = () => sheet.current?.dismiss();
  return (
    <SheetModal ref={sheet} onDismiss={onClose} fillHeight>
      <SheetHeader
        title={t('habit.priority')}
        headerButton={
          <HeaderAction
            label={t('common.done')}
            onPress={() => {
              onApply(daily ? dailyPriority : 0);
              closeSheet();
            }}
          />
        }
        onClose={closeSheet}
      />

      <ScrollView
        className="mx-1 min-h-0 flex-1"
        contentContainerClassName="py-8"
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-12">
          {sections.map((section) => {
            const active = daily === section.daily;
            return (
              <View key={section.icon} className="gap-4">
                <View className="flex-row items-center gap-2">
                  <View className="h-5 w-5 shrink-0 items-center justify-center">
                    <AppIcon
                      name={section.icon}
                      size={iconSizes.md}
                      color={colors.accent}
                      accessible={false}
                    />
                  </View>
                  <Text className="min-w-0 flex-1 text-lg font-semibold">{section.title}</Text>
                  <Switch
                    accessibilityLabel={section.title}
                    value={active}
                    onValueChange={(checked) => setDaily(checked === section.daily)}
                    ios_backgroundColor={colors.switchTrack}
                    trackColor={{ false: colors.switchTrack, true: colors.accent }}
                    thumbColor={colors.switchThumb}
                  />
                </View>
                <View
                  className="gap-3 pl-7"
                  style={{ opacity: active ? 1 : 0.4 }}
                  pointerEvents={active ? 'auto' : 'none'}
                  accessibilityElementsHidden={!active}
                  importantForAccessibility={active ? 'auto' : 'no-hide-descendants'}
                >
                  {section.priorities.map((priority) => {
                    const label = priorityLabels[priority];
                    const selected = active && (priority === 0 || priority === dailyPriority);
                    return (
                      <PickerOption
                        key={priority}
                        selected={selected}
                        keepUncheckedBorder
                        softUncheckedBorder
                        accessibilityLabel={
                          priority === 0
                            ? t('habit.freeLabel')
                            : t('habit.priorityDaily', { value: label })
                        }
                        onPress={() => {
                          if (priority > 0) setDailyPriority(priority);
                          else setDaily(false);
                        }}
                        className="flex-row justify-between gap-3 rounded-2xl"
                      >
                        <View className="min-w-0 flex-1 gap-1">
                          <Text
                            className={`text-base font-semibold ${selected ? 'text-theme-accent-deep' : 'text-theme-text-primary'}`}
                          >
                            {label}
                          </Text>
                          <Text className="text-sm leading-5 text-theme-text-secondary">
                            {priorityDescriptions[priority]}
                          </Text>
                        </View>
                        <HabitStars priority={priority} className="shrink-0" />
                      </PickerOption>
                    );
                  })}
                  {!section.daily && (
                    <InfoNotice numberOfLines={0} adjustsFontSizeToFit={false}>
                      {t('habit.freeItemsNotice')}
                    </InfoNotice>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <NoticeHost modal />
    </SheetModal>
  );
}
