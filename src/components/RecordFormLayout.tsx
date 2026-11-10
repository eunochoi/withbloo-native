import type { ReactNode } from 'react';
import type { Href } from 'expo-router';
import { View } from 'react-native';
import { BottomSheetPage } from './bottom-sheet/BottomSheetPage';

export function RecordFormLayout({
  title,
  headerButton,
  backRoute,
  onBeforeClose,
  closeRequested = false,
  onClosed,
  overlays,
  children,
  scrollEnabled = true,
}: {
  title: string;
  headerButton?: ReactNode;
  backRoute: Href;
  onBeforeClose?: () => boolean;
  closeRequested?: boolean;
  onClosed?: () => void;
  overlays?: ReactNode;
  children: ReactNode;
  scrollEnabled?: boolean;
}) {
  return (
    <>
      <BottomSheetPage
        title={title}
        headerButton={headerButton}
        backRoute={backRoute}
        onBeforeClose={onBeforeClose}
        closeRequested={closeRequested}
        onClosed={onClosed}
        scrollEnabled={scrollEnabled}
      >
        <View className="gap-6">{children}</View>
      </BottomSheetPage>
      {overlays}
    </>
  );
}
