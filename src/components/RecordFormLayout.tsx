import type { ReactNode, ComponentProps } from 'react';
import type { Href } from 'expo-router';
import { View } from 'react-native';
import { BottomSheetPage } from './BottomSheetPage';

export function RecordFormLayout({
  title,
  titleAction,
  headerRight,
  backRoute,
  onBeforeClose,
  closeRequested = false,
  onClosed,
  overlays,
  children,
  scrollEnabled = true,
  fillContent = false,
}: {
  title: string;
  titleAction?: ComponentProps<typeof BottomSheetPage>['titleAction'];
  headerRight?: ReactNode;
  backRoute: Href;
  onBeforeClose?: () => boolean;
  closeRequested?: boolean;
  onClosed?: () => void;
  overlays?: ReactNode;
  children: ReactNode;
  scrollEnabled?: boolean;
  fillContent?: boolean;
}) {
  return (
    <>
      <BottomSheetPage
        title={title}
        titleAction={titleAction}
        headerRight={headerRight}
        backRoute={backRoute}
        onBeforeClose={onBeforeClose}
        closeRequested={closeRequested}
        onClosed={onClosed}
        scrollEnabled={scrollEnabled}
        fillContent={fillContent}
      >
        <View className={fillContent ? 'flex-1 min-h-0 justify-between' : 'gap-6'}>{children}</View>
      </BottomSheetPage>
      {overlays}
    </>
  );
}
