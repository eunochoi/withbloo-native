import { Keyboard, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { useI18n } from '../../i18n/react';
import type { useBottomSheetMotion } from './useBottomSheetMotion';
import type { CloseBottomSheet } from './useBottomSheetLifecycle';

export function BottomSheetBackdrop({
  motion,
  dismissible,
  dim,
  onClose,
}: {
  motion: ReturnType<typeof useBottomSheetMotion>;
  dismissible: boolean;
  dim: boolean;
  onClose: CloseBottomSheet;
}) {
  const { t } = useI18n();
  return (
    <Animated.View style={motion.backdropStyle} className="absolute inset-0">
      <Pressable
        accessible={dismissible}
        disabled={!dismissible}
        accessibilityRole="button"
        accessibilityLabel={t('common.close')}
        onPress={() => {
          if (Keyboard.isVisible()) Keyboard.dismiss();
          else onClose();
        }}
        className={`absolute inset-0 ${dim ? 'bg-theme-overlay/10' : ''}`}
      />
    </Animated.View>
  );
}
