import { ScrollEdgeFade } from './ScrollEdgeFade';
import { useScrollFade } from '../hooks/useScrollFade';
import { NoticeHost } from './NoticeProvider';
import { SheetHeader } from './SheetHeader';
import { SheetModal } from './SheetModal';
import { useI18n } from '../i18n/react';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { HABIT_ICON_COLORS, type HabitIconColorKey } from '../domain/constants';
import { useAppTheme } from '../theme/AppThemeProvider';
import { adjustColorBrightness } from '../theme/colors';
import type { BottomSheetModal } from '@expo/ui/community/bottom-sheet';
import { HeaderAction } from './HeaderAction';
import { HabitIcon } from './HabitIcon';
import { SoberIcon } from './SoberIcon';
import { PickerInfoCard } from './PickerInfoCard';
import { PickerGridItem } from './PickerGridItem';
import { Text } from './Text';

export function IconColorPicker({
  value,
  kind = 'habit',
  onApply,
  onClose,
}: {
  value: HabitIconColorKey;
  kind?: 'habit' | 'sober';
  onApply: (value: HabitIconColorKey) => void;
  onClose: () => void;
}) {
  const sheetFade = useScrollFade();
  const { t } = useI18n();

  const [draft, setDraft] = useState(value);
  const { colors, rem } = useAppTheme();
  const keys: HabitIconColorKey[] = [
    'theme',
    ...(Object.keys(HABIT_ICON_COLORS) as (keyof typeof HABIT_ICON_COLORS)[]),
  ];
  const sheet = useRef<BottomSheetModal>(null);
  useEffect(() => {
    sheet.current?.present();
  }, []);
  const closeSheet = () => sheet.current?.dismiss();
  return (
    <SheetModal
      ref={sheet}
      onDismiss={onClose}
      fillHeight

    >
      <SheetHeader
        title={t('habit.iconColor')}
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
      <View className="mx-1">
        <View className="pt-8 pb-4">
          <PickerInfoCard>
            {(kind === 'habit'
              ? (['water', 'walking', 'reading'] as const)
              : (['phone', 'coffee', 'shopping'] as const)
            ).map((name) => (
              <View key={name} className="min-w-0 flex-1 items-center gap-4">
                {kind === 'habit' ? (
                  <HabitIcon
                    name={name as 'water' | 'walking' | 'reading'}
                    colorKey={draft}
                    size={rem * 2.25}
                  />
                ) : (
                  <SoberIcon
                    name={name as 'phone' | 'coffee' | 'shopping'}
                    colorKey={draft}
                    size={rem * 2.25}
                  />
                )}
                <Text className="text-center text-sm font-normal text-theme-text-secondary">
                  {kind === 'habit'
                    ? t(`habitIcons.${name as 'water' | 'walking' | 'reading'}`)
                    : t(`soberIcons.${name as 'phone' | 'coffee' | 'shopping'}`)}
                </Text>
              </View>
            ))}
          </PickerInfoCard>
        </View>
      </View>
      <View className="mx-1 min-h-0 flex-1 overflow-hidden">
        <ScrollView
          onScroll={sheetFade.onScroll}
          scrollEventThrottle={16}
          onLayout={sheetFade.onLayout}
          onContentSizeChange={sheetFade.onContentSizeChange}
          className="min-h-0 flex-1"
          contentContainerClassName={'gap-3 pb-8'}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row flex-wrap gap-y-3 -mx-1.5">
            {keys.map((key) => {
              const { value: backgroundColor } =
                key === 'theme' ? { value: colors.accent } : HABIT_ICON_COLORS[key];
              const label = key === 'theme' ? t('habit.defaultColor') : t(`iconColors.${key}`);
              return (
                <View key={key} className="w-1/3 min-w-0 px-1.5">
                  <PickerGridItem
                    selected={draft === key}
                    label={label}
                    onPress={() => setDraft(key)}
                  >
                    <View
                      className="h-9 w-9 shrink-0 ios:curve-continuous rounded-full border"
                      style={{
                        backgroundColor,
                        borderColor: adjustColorBrightness(backgroundColor, -0.1),
                      }}
                    />
                  </PickerGridItem>
                </View>
              );
            })}
          </View>
        </ScrollView>
        <ScrollEdgeFade edge="top" visible={sheetFade.topVisible} />
        <ScrollEdgeFade
          edge="bottom"
          visible={sheetFade.bottomVisible}
          includeBottomInset={false}
          includeToolbar={false}
        />
      </View>

      <NoticeHost modal />
    </SheetModal>
  );
}
