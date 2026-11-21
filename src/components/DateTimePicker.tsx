import { NoticeHost } from './NoticeProvider';
import { SheetHeader } from './SheetHeader';
import { SheetModal } from './SheetModal';
import { translateErrorMessage } from '../i18n/errors';
import { useI18n } from '../i18n/react';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { dateTimeDraft, parseDateTime } from '../domain/date';
import type { BottomSheetModal } from '@expo/ui/community/bottom-sheet';
import { HeaderAction } from './HeaderAction';
import { DateTimeFields } from './DateTimeFields';
import { InfoNotice } from './InfoNotice';
import { Text } from './Text';

export function DateTimePicker({
  value,
  minTime,
  description,
  confirmLabel,
  onClose,
  onApply,
}: {
  mode: 'start';
  value: string;
  minTime?: string;
  description?: string;
  confirmLabel?: string;
  onClose: () => void;
  onApply: (iso: string) => void;
}) {
  const { t, language } = useI18n();

  const [draft, setDraft] = useState(() => dateTimeDraft(value));
  const [error, setError] = useState('');
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
        title={language.startsWith('ko') ? '시간 선택' : 'Select time'}
        headerButton={
          <HeaderAction
            label={confirmLabel ?? t('common.done')}
            onPress={() => {
              try {
                const iso = parseDateTime(draft, Date.now());
                if (minTime && Date.parse(iso) < Date.parse(minTime))
                  throw new Error(t('habit.afterStart'));
                onApply(iso);
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
        <View className="gap-5">
          {!!description && <InfoNotice className="mb-2">{description}</InfoNotice>}
          <DateTimeFields
            draft={draft}
            minTime={minTime}
            onChange={(value) => {
              setDraft(value);
              setError('');
            }}
          />
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
