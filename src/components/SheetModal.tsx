import { BottomSheetModal } from '@expo/ui/community/bottom-sheet';
import type { ReactNode, Ref } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/AppThemeProvider';
import { metrics } from '../theme/tokens.json';

type SheetModalProps = {
  ref: Ref<BottomSheetModal>;
  onDismiss?: () => void;
  fillHeight?: boolean;
  enablePanDownToClose?: boolean;
  children: ReactNode;
};

export function SheetModal({
  ref,
  onDismiss,
  fillHeight = false,
  enablePanDownToClose = true,
  children,
}: SheetModalProps) {
  const { colors } = useAppTheme();
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const minimumTopGap = fillHeight ? 40 : 80;
  const sheetHeight = windowHeight - Math.max(minimumTopGap, insets.top) - insets.bottom;

  return (
    <BottomSheetModal
      ref={ref}
      onDismiss={onDismiss}
      enableDynamicSizing
      enablePanDownToClose={enablePanDownToClose}
      handleComponent={null}
      backgroundStyle={{
        backgroundColor: colors.surface,
        borderRadius: metrics.androidSheetCornerRadius,
      }}
    >
      <View
        className="px-[5%] pt-2"
        style={{ maxHeight: sheetHeight, height: fillHeight ? sheetHeight : undefined }}
      >
        {children}
      </View>
    </BottomSheetModal>
  );
}
