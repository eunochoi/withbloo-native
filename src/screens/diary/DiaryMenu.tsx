import { SheetHeader } from '../../components/SheetHeader';
import { useRouter } from 'expo-router';
import { formatDisplayDate } from '../../i18n/format';
import { useI18n } from '../../i18n/react';
import { RecordMenuButton } from '../../components/RecordMenuButton';
import { NoticeHost, useNotice } from '../../components/NoticeProvider';
import { ScrollView, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';
import { deleteDiary } from '../../db/diary';
import type { Diary } from '../../db/types';
import { cleanupImages } from '../../media';
import { useRecordMutation } from '../../queries';
import { ConfirmModal } from '../../components/ConfirmModal';
import { SheetModal } from '../../components/SheetModal';
import type { BottomSheetModal } from '@expo/ui/community/bottom-sheet';
import { PickerAction } from '../../components/PickerAction';

export function DiaryMenu({
  diary,
  today,
  onDeleted,
  showDetail = false,
}: {
  diary: Diary;
  today: string;
  onDeleted?: () => void;
  showDetail?: boolean;
}) {
  const { t, formatLocale } = useI18n();

  const { showNotice } = useNotice();
  const db = useSQLiteContext();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const mutation = useRecordMutation(
    async () => {
      const files = await deleteDiary(db, diary.id);
      await cleanupImages(db, files);
    },
    'diary',
    undefined,
    (error) =>
      showNotice({ tone: 'error', title: t('diary.processFailed'), message: error.message }),
  );
  const title = t('diary.dateTitle', {
    value: formatDisplayDate(diary.date, formatLocale, 'date'),
  });
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
        muted
        accessibilityLabel={t('diary.menu')}
        accessibilityState={{ expanded: open, disabled: mutation.isPending }}
        disabled={mutation.isPending}
        onPress={() => setOpen(true)}
        className="h-11 w-11 items-center justify-center ios:curve-continuous rounded-full"
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
        <SheetHeader title={title} onClose={closeSheet} />

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
                title={t('diary.detail')}
                description={t('diary.detailHint')}
                singleLineDescription
                onPress={() => closeSheet(() => router.navigate(`/diary/${diary.id}`))}
              />
            )}
            <PickerAction
              icon="edit"
              title={t('diary.edit')}
              description={t('diary.editHint')}
              singleLineDescription
              disabled={diary.date > today}
              onPress={() =>
                closeSheet(() => {
                  router.navigate(`/diary/${diary.id}/edit`);
                })
              }
            />
            <PickerAction
              icon="delete-outline"
              title={t('diary.delete')}
              description={t('diary.deleteHint')}
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
        title={t('diary.deleteTitle')}
        message={t('diary.deleteWarning')}
        confirmLabel={t('common.delete')}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => mutation.mutateAsync(undefined)}
        onConfirmed={onDeleted}
      />
    </>
  );
}
