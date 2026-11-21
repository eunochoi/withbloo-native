import { NoticeHost } from './NoticeProvider';
import { SheetHeader } from './SheetHeader';
import { SheetModal } from './SheetModal';
import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { ScrollView, View } from 'react-native';
import { parseDateTime } from '../domain/date';
import { formatDisplayDate } from '../i18n/format';
import { useI18n } from '../i18n/react';
import type { BottomSheetModal } from '@expo/ui/community/bottom-sheet';
import { DateTimeFields } from './DateTimeFields';
import { FormPickerRow } from './FormPickerRow';
import { HeaderAction } from './HeaderAction';
import { Text } from './Text';

type Props = ComponentProps<typeof DateTimeFields> & { minTime: string };
export function RecordDateTimeField({ draft, minTime, disabled, onChange, ...props }: Props) {
  const { t, language, formatLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(draft);
  const [error, setError] = useState('');
  const sheet = useRef<BottomSheetModal>(null);
  useEffect(() => {
    if (open) sheet.current?.present();
  }, [open]);
  const closeSheet = () => sheet.current?.dismiss();
  return (
    <View className="gap-2">
      <Text className="text-lg font-semibold">
        {language.startsWith('ko') ? '기록 일시' : 'Record date and time'}
      </Text>
      <FormPickerRow
        label={`${formatDisplayDate(draft.date, formatLocale, 'date')} ${draft.hour}:${draft.minute}`}
        accessibilityLabel={
          language.startsWith('ko') ? '기록 일시 선택' : 'Choose record date and time'
        }
        disabled={!!disabled}
        onPress={() => {
          setPending(draft);
          setError('');
          setOpen(true);
        }}
      />
      {open && (
        <SheetModal
          ref={sheet}
          onDismiss={() => setOpen(false)}
          fillHeight

        >
          <SheetHeader
            title={language.startsWith('ko') ? '시간 선택' : 'Select time'}
            headerButton={
              <HeaderAction
                label={t('common.done')}
                onPress={() => {
                  try {
                    const iso = parseDateTime(pending, Date.now());
                    if (
                      Math.floor(Date.parse(iso) / 60000) <
                      Math.floor(Date.parse(minTime) / 60000)
                    )
                      throw new Error(t('habit.afterStart'));
                    onChange(pending);
                    closeSheet();
                  } catch (failure) {
                    setError(failure instanceof Error ? failure.message : t('habit.retry'));
                  }
                }}
              />
            }
            onClose={closeSheet}
          />

          <ScrollView
            className="mx-1 min-h-0 flex-1"
            contentContainerClassName="gap-7 py-8"
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            <DateTimeFields
              {...props}
              draft={pending}
              minTime={minTime}
              onChange={(value) => {
                setPending(value);
                setError('');
              }}
            />
            {!!error && (
              <Text accessibilityRole="alert" className="text-sm text-theme-danger">
                {error}
              </Text>
            )}
          </ScrollView>

          <NoticeHost modal />
        </SheetModal>
      )}
    </View>
  );
}
