import { useI18n } from '../i18n/react';
import { useState } from 'react';
import { View, type ScrollView } from 'react-native';
import { HABIT_ICON_COLORS, type HabitIconColorKey } from '../domain/constants';
import { useAppTheme } from '../theme/AppThemeProvider';
import { adjustColorBrightness } from '../theme/colors';
import { AnimatedFlatList } from './AnimatedFlatList';
import { BottomSheetModal } from './BottomSheetModal';
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
  const { t } = useI18n();

  const [draft, setDraft] = useState(value);
  const { colors, rem } = useAppTheme();
  const keys: HabitIconColorKey[] = [
    'theme',
    ...(Object.keys(HABIT_ICON_COLORS) as (keyof typeof HABIT_ICON_COLORS)[]),
  ];
  return (
    <BottomSheetModal
      visible
      fixedHeight
      scrollFade
      title={t('habit.iconColor')}
      onClose={onClose}
      fixedContent={
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
      }
      headerRight={(close) => (
        <HeaderAction
          label={t('common.done')}
          onPress={() => {
            onApply(draft);
            close();
          }}
        />
      )}
      renderScrollView={({ ref, ...scrollProps }) => (
        <AnimatedFlatList
          {...scrollProps}
          ref={(list) => {
            const nativeScroll = list?.getNativeScrollRef();
            ref(nativeScroll && 'scrollTo' in nativeScroll ? (nativeScroll as ScrollView) : null);
          }}
          data={keys}
          numColumns={3}
          keyExtractor={(key) => key}
          contentContainerClassName="gap-3 pb-8"
          columnWrapperClassName="gap-3"
          renderItem={({ item: key }) => {
            const { value: backgroundColor } =
              key === 'theme' ? { value: colors.accent } : HABIT_ICON_COLORS[key];
            const label = key === 'theme' ? t('habit.defaultColor') : t(`iconColors.${key}`);
            return (
              <View className="flex-1 min-w-0">
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
          }}
        />
      )}
    />
  );
}
