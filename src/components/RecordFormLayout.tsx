import type { ReactNode, ComponentProps } from 'react';
import type { Href } from 'expo-router';
import { View } from 'react-native';
import { BottomSheetPage } from './bottom-sheet/BottomSheetPage';

export function RecordFormLayout({
  title,
  titleAction,
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
  titleAction?: ComponentProps<typeof BottomSheetPage>['titleAction'];
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
        titleAction={titleAction}
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
