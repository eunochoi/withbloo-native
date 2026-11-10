import type { ComponentProps, ReactNode } from 'react';
import { View } from 'react-native';
import { formatDisplayDate } from '../i18n/format';
import { useI18n } from '../i18n/react';
import { DatePickerCalendar } from '../screens/calendar/DatePickerCalendar';
import { AppIcon } from './AppIcon';
import { Text } from './Text';
import { FormTextInput } from './FormTextInput';
import { useAppTheme } from '../theme/AppThemeProvider';

type Props = ComponentProps<typeof DatePickerCalendar> & {
  time?: { hour: string; minute: string; disabled?: boolean; onChange: (value: { hour: string; minute: string }) => void };
  children?: ReactNode;
};

export function DateSelectionForm({ time, children, ...calendar }: Props) {
  const { t, formatLocale } = useI18n();
  const { colors, iconSizes } = useAppTheme();
  return (
    <View className="gap-5">
      <View className="flex-row items-center gap-4 rounded-2xl bg-theme-surface-muted p-4">
        <AppIcon name="date" size={iconSizes.lg} color={colors.accent} />
        <View className="min-w-0 flex-1 gap-1">
          <Text className="text-lg font-semibold">{calendar.selected ? formatDisplayDate(calendar.selected, formatLocale, 'long') : t('diary.chooseDateHint')}</Text>
          {time && <Text className="text-base text-theme-text-secondary">{time.hour}:{time.minute}</Text>}
        </View>
      </View>
      <DatePickerCalendar {...calendar} />
      {time && (
        <View className="flex-row items-center justify-between gap-3">
          <Text className="text-lg font-semibold">{formatLocale.startsWith('ko') ? '시간' : 'Time'}</Text>
          <View className="flex-row items-center gap-3">
            {(['hour', 'minute'] as const).map((field, index) => (
              <View key={field} className="flex-row items-center gap-3">
                {index === 1 && <Text>:</Text>}
                <View className="h-12 w-16 justify-center rounded-2xl border border-theme-border">
                  <FormTextInput accessibilityLabel={t(field === 'hour' ? 'habit.hourInput' : 'habit.minuteInput')}
                    keyboardType="number-pad" maxLength={2} editable={!time.disabled} value={time[field]}
                    onChangeText={(value) => time.onChange({ hour: time.hour, minute: time.minute, [field]: value })}
                    className="w-full bg-transparent py-0 text-center text-lg leading-tight text-theme-text-primary font-normal"
                    style={{ includeFontPadding: false, textAlignVertical: 'center' }} />
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
      {children}
    </View>
  );
}
