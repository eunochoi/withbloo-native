import { NoticeHost } from '../../components/NoticeProvider';
import { SheetHeader } from '../../components/SheetHeader';
import { FormTextInput } from '../../components/FormTextInput';
import { translateErrorMessage } from '../../i18n/errors';
import { useI18n } from '../../i18n/react';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SheetModal } from '../../components/SheetModal';
import type { BottomSheetModal } from '@expo/ui/community/bottom-sheet';
import { Button } from '../../components/Button';
import { HeaderAction } from '../../components/HeaderAction';
import { Text } from '../../components/Text';

const TIME_INPUT_CONTAINER_CLASS_NAME =
  'h-12 w-16 justify-center ios:curve-continuous rounded-2xl border border-theme-border';
const TIME_INPUT_CLASS_NAME =
  'w-full py-0 bg-transparent text-center text-lg leading-tight text-theme-text-primary font-normal';

export function NotificationTimePicker({
  title,
  value,
  onClose,
  onApply,
}: {
  title: string;
  value: string | null;
  onClose: () => void;
  onApply: (time: string | null) => Promise<void>;
}) {
  const { t, language } = useI18n();
  const [hour, setHour] = useState(value?.slice(0, 2) ?? '21');
  const [minute, setMinute] = useState(value?.slice(3) ?? '00');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const saving = useRef(false);
  const apply = async (time: string | null, close: () => void) => {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setError('');
    try {
      await onApply(time);
      saving.current = false;
      close();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : t('common.retryMessage'));
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };
  const sheet = useRef<BottomSheetModal>(null);
  useEffect(() => {
    sheet.current?.present();
  }, []);
  const closeSheet = () => {
    if (!(() => !saving.current)()) return false;
    sheet.current?.dismiss();
    return true;
  };
  return (
    <SheetModal
      ref={sheet}
      onDismiss={onClose}
      enablePanDownToClose={!busy}

    >
      <SheetHeader
        title={title}
        headerButton={
          <HeaderAction
            label={busy ? t('common.saving') : t('common.save')}
            disabled={busy}
            onPress={() => {
              if (
                !/^\d{1,2}$/.test(hour) ||
                !/^\d{1,2}$/.test(minute) ||
                Number(hour) > 23 ||
                Number(minute) > 59
              ) {
                setError(t('settings.invalidTime'));
                return;
              }
              void apply(`${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`, closeSheet);
            }}
          />
        }
        onClose={
          !busy
            ? () => {
                if (!busy) closeSheet();
              }
            : undefined
        }
      />

      <ScrollView
        className="mx-1 shrink grow-0"
        contentContainerClassName="gap-7 py-8"
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-7">
          <View className="flex-row items-center justify-center gap-3">
            <View className={TIME_INPUT_CONTAINER_CLASS_NAME}>
              <FormTextInput
                accessibilityLabel={t('settings.hourInput')}
                keyboardType="number-pad"
                maxLength={2}
                editable={!busy}
                value={hour}
                className={TIME_INPUT_CLASS_NAME}
                style={{ includeFontPadding: false, textAlignVertical: 'center' }}
                onChangeText={(text) => {
                  setHour(text);
                  setError('');
                }}
              />
            </View>
            <Text>:</Text>
            <View className={TIME_INPUT_CONTAINER_CLASS_NAME}>
              <FormTextInput
                accessibilityLabel={t('settings.minuteInput')}
                keyboardType="number-pad"
                maxLength={2}
                editable={!busy}
                value={minute}
                className={TIME_INPUT_CLASS_NAME}
                style={{ includeFontPadding: false, textAlignVertical: 'center' }}
                onChangeText={(text) => {
                  setMinute(text);
                  setError('');
                }}
              />
            </View>
          </View>
          {value !== null && (
            <Button
              outline
              subtle
              label={t('settings.disableReminder')}
              disabled={busy}
              onPress={() => void apply(null, closeSheet)}
            />
          )}
          {!!error && (
            <Text accessibilityRole="alert" className="text-sm text-theme-danger">
              {translateErrorMessage(error, language)}
            </Text>
          )}
        </View>
      </ScrollView>

      <NoticeHost modal />
    </SheetModal>
  );
}
