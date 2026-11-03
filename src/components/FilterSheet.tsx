import { useI18n } from '../i18n/react';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { BottomSheetModal } from './BottomSheetModal';
import { HeaderAction } from './HeaderAction';

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
      headerLeft={
        <HeaderAction
          label={t('ui.reset')}
          accessibilityLabel={t('ui.resetSelection')}
          onPress={onReset}
        />
      }
      headerRight={(close) => (
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
      <View className="gap-7">{children}</View>
    </BottomSheetModal>
  );
}
