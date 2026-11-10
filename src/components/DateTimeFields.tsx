import { formatDisplayDate } from '../i18n/format';
import { useI18n } from '../i18n/react';
import { format } from 'date-fns';
import { useState } from 'react';
import { View } from 'react-native';
import type { dateTimeDraft } from '../domain/date';
import type { Habit, Sober } from '../db/types';
import { useCurrentMinute } from '../hooks/useCurrentMinute';
import { DateSelectionForm } from './DateSelectionForm';
import { useAppTheme } from '../theme/AppThemeProvider';
import { AppIcon } from './AppIcon';
import { FormPickerRow } from './FormPickerRow';
import { Text } from './Text';

export function DateTimeFields({
  draft,
  minTime,
  collapsible = false,
  compactCalendar = false,
  disabled = false,
  soberRecords,
  habitRecords,
  onChange,
}: {
  draft: ReturnType<typeof dateTimeDraft>;
  minTime?: string;
  collapsible?: boolean;
  compactCalendar?: boolean;
  disabled?: boolean;
  habitRecords?: { dates: readonly string[]; iconKey: Habit['icon_key']; iconColor: Habit['icon_color'] };
  soberRecords?: {
    dates: readonly string[];
    iconKey: Sober['icon_key'];
    iconColor: Sober['icon_color'];
  };
  onChange: (draft: ReturnType<typeof dateTimeDraft>) => void;
}) {
  const { t, formatLocale } = useI18n();

  const now = useCurrentMinute();
  const today = format(new Date(now), 'yyyy-MM-dd');
  const { colors, iconSizes } = useAppTheme();
  const [month, setMonth] = useState(draft.date.slice(0, 7));
  const [expanded, setExpanded] = useState(!collapsible);
  return (
    <View className="gap-5">
      {collapsible && (
        <View className="gap-2">
          <Text className="text-base">{t('habit.startTime')}</Text>
          <FormPickerRow
            label={`${formatDisplayDate(draft.date, formatLocale, 'date')} ${draft.hour}:${draft.minute}`}
            accessibilityLabel={t('habit.restartTimeChoice')}
            disabled={disabled}
            leading={<AppIcon name="date" size={iconSizes.md} color={colors.textSecondary} />}
            onPress={() => setExpanded(!expanded)}
          />
        </View>
      )}
      {expanded && (
        <View className="gap-5" pointerEvents={disabled ? 'none' : 'auto'}>
          <DateSelectionForm
            time={{ hour: draft.hour, minute: draft.minute, disabled, onChange: (value) => onChange({ ...draft, ...value }) }}
            compact={compactCalendar}
            soberRecords={soberRecords}
            habitRecords={habitRecords}
            month={month}
            selected={draft.date}
            today={today}
            onMonthChange={(value) => {
              if (!disabled) setMonth(value);
            }}
            minDate={minTime ? format(new Date(minTime), 'yyyy-MM-dd') : undefined}
            onSelect={(date) => {
              if (disabled) return;
              onChange({ ...draft, date });
              setMonth(date.slice(0, 7));
            }}
          />
        </View>
      )}
    </View>
  );
}
