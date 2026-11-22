import { BottomSheetModal } from '@expo/ui/community/bottom-sheet';
import { cssInterop } from 'nativewind';
import type { ReactNode, Ref } from 'react';
import { Platform, View, useWindowDimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/AppThemeProvider';
import { metrics } from '../theme/tokens.json';

const SheetGestureRoot = cssInterop(GestureHandlerRootView, { className: 'style' });

type SheetModalProps = {
  ref: Ref<BottomSheetModal>;
  onDismiss?: () => void;
  fillHeight?: boolean;
  enablePanDownToClose?: boolean;
  gestureHandlerEnabled?: boolean;
  children: ReactNode;
};

export function SheetModal({
  ref,
  onDismiss,
  fillHeight = false,
  enablePanDownToClose = true,
  gestureHandlerEnabled = false,
  children,
}: SheetModalProps) {
  const { colors } = useAppTheme();
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const minimumTopGap = fillHeight ? 40 : 80;
  const sheetHeight = windowHeight - Math.max(minimumTopGap, insets.top) - insets.bottom;
  const Content = gestureHandlerEnabled ? SheetGestureRoot : View;

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
      <Content
        {...(gestureHandlerEnabled && Platform.OS === 'android' ? { unstable_forceActive: true } : {})}
        className="px-[5%] pt-2"
        style={{ maxHeight: sheetHeight, height: fillHeight ? sheetHeight : undefined }}
      >
        {children}
      </Content>
    </BottomSheetModal>
  );
}
