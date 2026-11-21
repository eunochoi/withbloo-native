import { SheetHeader } from '../../components/SheetHeader';
import { useRouter } from 'expo-router';
import { useI18n } from '../../i18n/react';
import { usePreventRemove } from 'expo-router/react-navigation';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SheetModal } from '../../components/SheetModal';
import type { BottomSheetModal } from '@expo/ui/community/bottom-sheet';
import { ConfirmModal } from '../../components/ConfirmModal';
import { NoticeHost, useNotice } from '../../components/NoticeProvider';
import { PickerAction } from '../../components/PickerAction';
import { deleteSoberRestart } from '../../db/sober';
import type { SoberRestart } from '../../db/types';
import { useRecordMutation } from '../../queries';

type Overlay = { kind: 'menu' | 'delete'; record: SoberRestart } | null;

export function SoberRestartActions({
  soberId,
  children,
}: {
  soberId: number;
  children: (actions: {
    pending: boolean;
    onMenu: (record: SoberRestart) => void;
    onBeforeClose: () => boolean;
  }) => ReactNode;
}) {
  const { t } = useI18n();

  const db = useSQLiteContext();
  const router = useRouter();
  const { showNotice } = useNotice();
  const [overlay, setOverlay] = useState<Overlay>(null);
  const menu = overlay?.kind === 'menu' ? overlay.record : null;
  const confirm = overlay?.kind === 'delete' ? overlay.record : null;
  const deleting = useRef(false);
  const mutation = useRecordMutation(
    (restartId: number) => deleteSoberRestart(db, restartId, soberId),
    'sober',
    () => showNotice({ tone: 'success', title: t('sober.restartDeleted') }),
    (error) =>
      showNotice({ tone: 'error', title: t('sober.recordFailed'), message: error.message }),
  );
  const notifyDeleting = () =>
    showNotice({
      tone: 'info',
      title: t('sober.wait'),
      message: t('sober.deletingRestart'),
    });
  usePreventRemove(mutation.isPending, notifyDeleting);
  const onMenu = (record: SoberRestart) => {
    if (!deleting.current && !mutation.isPending) setOverlay({ kind: 'menu', record });
  };
  const onBeforeClose = () => {
    if (!deleting.current && !mutation.isPending) return true;
    notifyDeleting();
    return false;
  };
  const sheet = useRef<BottomSheetModal>(null);
  const afterDismiss = useRef<(() => void) | undefined>(undefined);
  useEffect(() => {
    if (menu !== null) sheet.current?.present();
    else sheet.current?.dismiss();
  }, [menu !== null]);
  const closeSheet = (action?: () => void) => {
    if (afterDismiss.current) return false;
    afterDismiss.current = action;
    sheet.current?.dismiss();
    return true;
  };
  return (
    <>
      {children({ pending: mutation.isPending, onMenu, onBeforeClose })}
      <SheetModal
        ref={sheet}
        onDismiss={() => {
          const action = afterDismiss.current;
          afterDismiss.current = undefined;
          (() => setOverlay(null))();
          action?.();
        }}

      >
        <SheetHeader title={t('sober.restartRecord')} onClose={closeSheet} />

        <ScrollView
          className="mx-1 shrink grow-0"
          contentContainerClassName="gap-7 py-8"
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-3">
            <PickerAction
              icon="edit"
              title={t('sober.editRecord')}
              description={t('sober.editRecordHint')}
              singleLineDescription
              onPress={() => {
                const record = menu;
                closeSheet(() => {
                  if (record)
                    router.navigate({
                      pathname: '/sober/[id]/restart/[restartId]/edit',
                      params: { id: String(soberId), restartId: String(record.id) },
                    });
                });
              }}
            />
            <PickerAction
              icon="delete-outline"
              title={t('sober.deleteRecord')}
              description={t('sober.deleteRecordHint')}
              singleLineDescription
              danger
              onPress={() => {
                const record = menu;
                closeSheet(() => {
                  if (record) setOverlay({ kind: 'delete', record });
                });
              }}
            />
          </View>
        </ScrollView>

        <NoticeHost modal />
      </SheetModal>
      <ConfirmModal
        visible={confirm !== null}
        title={t('sober.deleteRecordTitle')}
        message={t('sober.deleteRecordWarning')}
        danger
        confirmLabel={t('common.delete')}
        onCancel={() => setOverlay(null)}
        onConfirm={async () => {
          if (!confirm || deleting.current || mutation.isPending)
            throw new Error('Operation unavailable');
          deleting.current = true;
          try {
            await mutation.mutateAsync(confirm.id);
          } finally {
            deleting.current = false;
          }
        }}
      />
    </>
  );
}
