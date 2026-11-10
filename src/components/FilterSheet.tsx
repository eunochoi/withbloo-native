import { useI18n } from '../i18n/react';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { BottomSheetModal } from './bottom-sheet/BottomSheetModal';
import { HeaderAction } from './HeaderAction';
import { ContentBottomButton } from './ContentBottomButton';

export function FilterSheet({
  title,
  children,
  onClose,
  onReset,
  onApply,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  onReset: () => void;
  onApply: () => void;
}) {
  const { t } = useI18n();
  return (
    <BottomSheetModal
      visible
      title={title}
      headerButton={(close) => (
        <HeaderAction
          label={t('common.apply')}
          accessibilityLabel={t('ui.applyTitle', { title })}
          onPress={() => {
            onApply();
            close();
          }}
        />
      )}
      scrollFade
      onClose={onClose}
    >
      <View className="gap-5">

        {children}
        <ContentBottomButton label={t('ui.reset')} accessibilityLabel={t('ui.resetSelection')} onPress={onReset} />
      </View>
    </BottomSheetModal>
  );
}
