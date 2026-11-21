import { NoticeHost } from '../../components/NoticeProvider';
import { SheetHeader } from '../../components/SheetHeader';
import { formatSoberGoal } from '../../i18n/sober';
import { useI18n } from '../../i18n/react';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, Switch, TextInput, View } from 'react-native';
import { SheetModal } from '../../components/SheetModal';
import type { BottomSheetModal } from '@expo/ui/community/bottom-sheet';
import { PickerOption } from '../../components/PickerOption';
import { HeaderAction } from '../../components/HeaderAction';
import { AppIcon } from '../../components/AppIcon';
import { InfoNotice } from '../../components/InfoNotice';
import { Text } from '../../components/Text';
import { SOBER_GOALS } from '../../domain/sober';
import { SOBER_MAX_GOAL_DAYS } from '../../domain/limits';
import { useAppTheme } from '../../theme/AppThemeProvider';

export function SoberGoalPicker({
  mode,
  days,
  onClose,
  onApply,
}: {
  mode: 'AUTO' | 'MANUAL';
  days: number | null;
  onClose: () => void;
  onApply: (mode: 'AUTO' | 'MANUAL', days: number | null) => void;
}) {
  const { t, language } = useI18n();
  const { colors, iconSizes } = useAppTheme();

  const [selection, setSelection] = useState<'AUTO' | 'PERIOD' | 'CUSTOM'>(
    mode === 'AUTO' ? 'AUTO' : SOBER_GOALS.some((value) => value === days) ? 'PERIOD' : 'CUSTOM',
  );
  const [period, setPeriod] = useState(SOBER_GOALS.find((value) => value === days) ?? 7);
  const [customDays, setCustomDays] = useState(String(days ?? 7));
  const customDayCount = Number(customDays);
  const validCustomDays =
    /^\d+$/.test(customDays) && customDayCount >= 1 && customDayCount <= SOBER_MAX_GOAL_DAYS;
  const canApply = selection !== 'CUSTOM' || validCustomDays;
  const sheet = useRef<BottomSheetModal>(null);
  useEffect(() => {
    sheet.current?.present();
  }, []);
  const closeSheet = () => sheet.current?.dismiss();

  const sections = [
    {
      id: 'AUTO',
      icon: 'auto-awesome',
      title: t('sober.autoGoal'),
      hint: t('sober.autoGoalHint'),
      content: (
        <InfoNotice numberOfLines={0} adjustsFontSizeToFit={false}>
          {SOBER_GOALS.map((value) => formatSoberGoal(value, language)).join(' → ')}
        </InfoNotice>
      ),
    },
    {
      id: 'PERIOD',
      icon: 'flag',
      title: t('sober.choosePeriod'),
      hint: t('sober.choosePeriodHint'),
      content: (
        <View className="gap-2">
          {[0, 3, 6].map((offset) => (
            <View key={offset} className="flex-row gap-2">
              {SOBER_GOALS.slice(offset, offset + 3).map((value) => (
                <View key={value} className="flex-1">
                  <PickerOption
                    compact
                    keepUncheckedBorder
                    softUncheckedBorder
                    selected={period === value}
                    accessibilityLabel={formatSoberGoal(value, language)}
                    onPress={() => setPeriod(value)}
                  >
                    <Text className={period === value ? 'text-sm text-theme-accent-deep' : 'text-sm'}>
                      {formatSoberGoal(value, language)}
                    </Text>
                  </PickerOption>
                </View>
              ))}
            </View>
          ))}
        </View>
      ),
    },
    {
      id: 'CUSTOM',
      icon: 'edit',
      title: t('sober.customGoal'),
      hint: t('sober.customGoalHint'),
      content: (
        <>
          <View
            className={`h-12 flex-row items-center gap-2 rounded-2xl border bg-theme-surface px-4 ios:curve-continuous ${
              selection === 'CUSTOM' && !validCustomDays ? 'border-theme-danger' : 'border-theme-border'
            }`}
          >
            <TextInput
              accessibilityLabel={t('sober.goalInput')}
              editable={selection === 'CUSTOM'}
              keyboardType="number-pad"
              maxLength={5}
              value={customDays}
              onChangeText={setCustomDays}
              className="h-full min-w-0 flex-1 bg-transparent p-0 text-base font-normal text-theme-text-primary"
            />
            <Text className="text-sm text-theme-text-secondary">{t('sober.daysUnit')}</Text>
          </View>
          {selection === 'CUSTOM' && !validCustomDays && (
            <Text accessibilityRole="alert" className="text-sm text-theme-danger">
              {t(customDayCount > SOBER_MAX_GOAL_DAYS ? 'sober.goalTooLong' : 'sober.goalInvalidDays')}
            </Text>
          )}
        </>
      ),
    },
  ] as const;

  return (
    <SheetModal ref={sheet} onDismiss={onClose} fillHeight>
      <SheetHeader
        title={t('sober.goalTitle')}
        headerButton={
          <HeaderAction
            label={t('common.apply')}
            disabled={!canApply}
            onPress={() => {
              if (!canApply) return;
              if (selection === 'AUTO') onApply('AUTO', null);
              else onApply('MANUAL', selection === 'PERIOD' ? period : customDayCount);
              closeSheet();
            }}
          />
        }
        onClose={closeSheet}
      />

      <ScrollView
        className="mx-1 shrink grow-0"
        contentContainerClassName="py-8"
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-12">
          {sections.map(({ id, icon, title, hint, content }) => {
            const selected = selection === id;
            return (
              <View key={id} className="gap-4">
                <View className="flex-row items-center gap-2">
                  <View className="h-5 w-5 shrink-0 items-center justify-center">
                    <AppIcon name={icon} size={iconSizes.md} color={colors.accent} accessible={false} />
                  </View>
                  <Text className="min-w-0 flex-1 text-lg font-semibold">{title}</Text>
                  <Switch
                    accessibilityLabel={title}
                    value={selected}
                    onValueChange={(checked) => setSelection(checked ? id : id === 'AUTO' ? 'PERIOD' : 'AUTO')}
                    ios_backgroundColor={colors.switchTrack}
                    trackColor={{ false: colors.switchTrack, true: colors.accent }}
                    thumbColor={colors.switchThumb}
                  />
                </View>
                <View
                  className="gap-3 pl-7"
                  style={{ opacity: selected ? 1 : 0.4 }}
                  pointerEvents={selected ? 'auto' : 'none'}
                  accessibilityElementsHidden={!selected}
                  importantForAccessibility={selected ? 'auto' : 'no-hide-descendants'}
                >
                  <Text className="text-sm leading-5 text-theme-text-secondary">{hint}</Text>
                  {content}
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
