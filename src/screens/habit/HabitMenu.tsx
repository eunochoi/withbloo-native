import { SheetHeader } from '../../components/SheetHeader';
import { useRouter } from 'expo-router';
import { useI18n } from '../../i18n/react';
import { RecordMenuButton } from '../../components/RecordMenuButton';
import { NoticeHost, useNotice } from '../../components/NoticeProvider';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { deleteHabit } from '../../db/habit';
import type { Habit } from '../../db/types';
import { useRecordMutation } from '../../queries';
import { ConfirmModal } from '../../components/ConfirmModal';
import { SheetModal } from '../../components/SheetModal';
import type { BottomSheetModal } from '@expo/ui/community/bottom-sheet';
import { PickerAction } from '../../components/PickerAction';

export function HabitMenu({
  habit,
  onDeleted,
  showDetail = false,
}: {
  habit: Habit;
  onDeleted?: () => void;
  showDetail?: boolean;
}) {
  const { t } = useI18n();

  const { showNotice } = useNotice();
  const db = useSQLiteContext();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const mutation = useRecordMutation(
    () => deleteHabit(db, habit.id),
    'habit',
    undefined,
    (error) =>
      showNotice({ tone: 'error', title: t('habit.processFailed'), message: error.message }),
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
        accessibilityLabel={t('habit.menu', { value: habit.name })}
        accessibilityState={{ expanded: open, disabled: mutation.isPending }}
        disabled={mutation.isPending}
        onPress={() => setOpen(true)}
        className="-mr-3.5 h-9 w-8 items-center justify-center"
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
        <SheetHeader title={habit.name} scrollableTitle onClose={closeSheet} />

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
                description={t('habit.menuDetailHint')}
                singleLineDescription
                onPress={() => closeSheet(() => router.navigate(`/habit/${habit.id}`))}
              />
            )}
            <PickerAction
              icon="edit"
              title={t('habit.edit')}
              description={t('habit.editHint')}
              singleLineDescription
              onPress={() => closeSheet(() => router.navigate(`/habit/${habit.id}/edit`))}
            />
            <PickerAction
              icon="delete-outline"
              title={t('habit.delete')}
              description={t('habit.deleteHint')}
              singleLineDescription
              danger
              onPress={() => closeSheet(() => setConfirmOpen(true))}
            />
          </View>
        </ScrollView>

        <NoticeHost modal />
      </SheetModal>
      <ConfirmModal
        danger
        visible={confirmOpen}
        title={t('habit.deleteTitle')}
        message={t('habit.deleteWarning')}
        confirmLabel={t('common.delete')}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => mutation.mutateAsync(undefined)}
        onConfirmed={onDeleted}
      />
    </>
  );
}
