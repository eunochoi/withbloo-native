import { NoticeHost } from '../../components/NoticeProvider';
import { SheetHeader } from '../../components/SheetHeader';
import { useEffect, useRef } from 'react';
import { useI18n } from '../../i18n/react';
import { ScrollView, View } from 'react-native';
import { SheetModal } from '../../components/SheetModal';
import type { BottomSheetModal } from '@expo/ui/community/bottom-sheet';
import { PickerAction } from '../../components/PickerAction';

export function BackupDestinationPicker({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (destination: 'device' | 'share') => void;
}) {
  const { t } = useI18n();
  const sheet = useRef<BottomSheetModal>(null);
  const afterDismiss = useRef<(() => void) | undefined>(undefined);
  useEffect(() => {
    sheet.current?.present();
  }, []);
  const closeSheet = (action?: () => void) => {
    if (afterDismiss.current) return false;
    afterDismiss.current = action;
    sheet.current?.dismiss();
    return true;
  };
  return (
    <SheetModal
      ref={sheet}
      onDismiss={() => {
        const action = afterDismiss.current;
        afterDismiss.current = undefined;
        onClose();
        action?.();
      }}

    >
      <SheetHeader title={t('settings.backupDestination')} onClose={closeSheet} />

      <ScrollView
        className="mx-1 shrink grow-0"
        contentContainerClassName="gap-7 py-8"
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-3">
          <PickerAction
            icon="save-alt"
            title={t('settings.saveToDevice')}
            description={t('settings.saveToDeviceDescription')}
            onPress={() => closeSheet(() => onSelect('device'))}
          />
          <PickerAction
            icon="share"
            title={t('settings.shareBackup')}
            description={t('settings.shareBackupDescription')}
            onPress={() => closeSheet(() => onSelect('share'))}
          />
        </View>
      </ScrollView>

      <NoticeHost modal />
    </SheetModal>
  );
}
