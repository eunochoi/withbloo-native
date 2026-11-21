import { SheetHeader } from '../../components/SheetHeader';
import { useRouter } from 'expo-router';
import { useI18n } from '../../i18n/react';
import { RecordMenuButton } from '../../components/RecordMenuButton';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import type { Sober } from '../../db/types';
import { deleteSober } from '../../db/sober';
import { useRecordMutation } from '../../queries';
import { SheetModal } from '../../components/SheetModal';
import type { BottomSheetModal } from '@expo/ui/community/bottom-sheet';
import { PickerAction } from '../../components/PickerAction';
import { ConfirmModal } from '../../components/ConfirmModal';
import { NoticeHost, useNotice } from '../../components/NoticeProvider';

export function SoberMenu({
  sober,
  onDeleted,
  showDetail = false,
  disabled = false,
}: {
  sober: Sober;
  onDeleted?: () => void;
  showDetail?: boolean;
  disabled?: boolean;
}) {
  const { t } = useI18n();

  const db = useSQLiteContext();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const { showNotice } = useNotice();
  const mutation = useRecordMutation(
    () => deleteSober(db, sober.id),
    'sober',
    undefined,
    (error) =>
      showNotice({ tone: 'error', title: t('sober.deleteFailed'), message: error.message }),
  );
  const sheet = useRef<BottomSheetModal>(null);
  const afterDismiss = useRef<(() => void) | undefined>(undefined);
  useEffect(() => {
    if (open) sheet.current?.present();
    else sheet.current?.dismiss();
  }, [open]);
  const closeSheet = (action?: () => void) => {
    if (afterDismiss.current) return false;
    afterDismiss.current = action;
    sheet.current?.dismiss();
    return true;
  };
  return (
    <>
      <RecordMenuButton
        accessibilityLabel={t('sober.menu', { value: sober.name })}
        accessibilityState={{ disabled: disabled || mutation.isPending }}
        disabled={disabled || mutation.isPending}
        onPress={() => setOpen(true)}
        className="-mr-3.5 h-11 w-8 items-center justify-center"
      />
      <SheetModal
        ref={sheet}
        onDismiss={() => {
          const action = afterDismiss.current;
          afterDismiss.current = undefined;
          (() => setOpen(false))();
          action?.();
        }}

      >
        <SheetHeader title={sober.name} scrollableTitle onClose={closeSheet} />

        <ScrollView
          className="mx-1 shrink grow-0"
          contentContainerClassName="gap-7 py-8"
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-3">
            {showDetail && (
              <PickerAction
                icon="info-outline"
                title={t('habit.menuDetail')}
                description={t('sober.detailHint')}
                singleLineDescription
                onPress={() => closeSheet(() => router.navigate(`/sober/${sober.id}`))}
              />
            )}
            <PickerAction
              icon="edit"
              title={t('sober.editAction')}
              description={t('sober.editHint')}
              singleLineDescription
              onPress={() => closeSheet(() => router.navigate(`/sober/${sober.id}/edit`))}
            />
            <PickerAction
              icon="delete-outline"
              title={t('diary.deleteAction')}
              description={t('sober.deleteHint')}
              singleLineDescription
              danger
              onPress={() => closeSheet(() => setConfirm(true))}
            />
          </View>
        </ScrollView>

        <NoticeHost modal />
      </SheetModal>
      <ConfirmModal
        visible={confirm}
        danger
        title={t('sober.deleteTitle')}
        message={t('sober.deleteWarning', { value: sober.name })}
        confirmLabel={t('common.delete')}
        onCancel={() => setConfirm(false)}
        onConfirm={() => mutation.mutateAsync(undefined)}
        onConfirmed={onDeleted}
      />
    </>
  );
}
