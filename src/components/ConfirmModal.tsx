import { useRef, useState, type ComponentProps } from 'react';
import { BottomSheetModal } from './BottomSheetModal';
import { View } from 'react-native';
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
  return (
    <BottomSheetModal
      visible={visible}
      title={title}
      onBeforeClose={() => !pending.current}
      onClose={() => {
        const accepted = confirmed.current;
        confirmed.current = false;
        onCancel();
        if (accepted) onConfirmed?.();
      }}
    >
      {(close) => (
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
                close();
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
            onPress={() => close()}
          />
        </View>
      )}
    </BottomSheetModal>
  );
}
