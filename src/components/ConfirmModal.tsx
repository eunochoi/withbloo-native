import { NoticeHost } from './NoticeProvider';
import { SheetHeader } from './SheetHeader';
import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { SheetModal } from './SheetModal';
import type { BottomSheetModal } from '@expo/ui/community/bottom-sheet';
import { ScrollView, View } from 'react-native';
import { useI18n } from '../i18n/react';
import { PickerAction } from './PickerAction';

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  icon = 'delete-outline',
  danger = false,
  onCancel,
  onConfirm,
  onConfirmed,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  icon?: ComponentProps<typeof PickerAction>['icon'];
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<unknown> | void;
  onConfirmed?: () => void;
}) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const confirmed = useRef(false);
  const sheet = useRef<BottomSheetModal>(null);
  useEffect(() => {
    if (visible) sheet.current?.present();
    else sheet.current?.dismiss();
  }, [visible]);
  const closeSheet = () => {
    if (!(() => !pending.current)()) return false;
    sheet.current?.dismiss();
    return true;
  };
  return (
    <SheetModal
      ref={sheet}
      onDismiss={() => {
        const accepted = confirmed.current;
        confirmed.current = false;
        onCancel();
        if (accepted) onConfirmed?.();
      }}
      enablePanDownToClose={!busy}

    >
      <SheetHeader
        title={title}
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
        <View className="gap-3">
          <PickerAction
            icon={icon}
            title={confirmLabel}
            description={message}
            danger={danger}
            disabled={busy}
            onPress={async () => {
              if (pending.current) return;
              pending.current = true;
              setBusy(true);
              try {
                await onConfirm();
                confirmed.current = true;
                pending.current = false;
                closeSheet();
              } catch {
                // The caller displays the operation error; keep the confirmation open.
              } finally {
                pending.current = false;
                setBusy(false);
              }
            }}
          />
          <PickerAction
            icon="undo"
            title={cancelLabel ?? t('common.cancel')}
            description={t('common.cancelDescription')}
            disabled={busy}
            onPress={() => closeSheet()}
          />
        </View>
      </ScrollView>

      <NoticeHost modal />
    </SheetModal>
  );
}
