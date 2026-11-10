import { useEffect, type ReactNode } from 'react';
import { Keyboard, Modal, View, useWindowDimensions, type ScrollView } from 'react-native';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import type { AnimatedRef } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomSheetLifecycle, type CloseBottomSheet } from './useBottomSheetLifecycle';
import { useScrollFade } from '../../hooks/useScrollFade';
import { useAppTheme } from '../../theme/AppThemeProvider';
import { BottomSheetHeader } from './BottomSheetHeader';
import { BottomSheetBackdrop } from './BottomSheetBackdrop';
import { BottomSheetContent } from './BottomSheetContent';
import type { BottomSheetListProps } from './BottomSheetScrollViewport';
import { NoticeHost } from '../NoticeProvider';

export function BottomSheetModal({
  visible,
  title,
  scrollableTitle,
  handleColor,
  headerButton,
  contentHeader,
  onClose,
  children,
  list,
  fixedHeight = false,
  scrollFade = false,
  contentKey,
  contentFullBleed = false,
  presentation = 'modal',
  noticeHostActive = false,
  dimBackdrop = true,
  menuAction,
  dismissOnBack = true,
  dismissible = true,
  preserveHandle = false,
  onBeforeClose,
  onOpening,
  onOpened,
  footer,
  scrollEnabled = true,
  contentContainerClassName,
  onContentSizeChange,
  scrollRef,
}: {
  visible: boolean;
  title?: string;
  scrollableTitle?: boolean;
  handleColor?: string;
  headerButton?: ReactNode | ((closeSheet: CloseBottomSheet) => ReactNode);
  contentHeader?: ReactNode;
  onClose: () => void;
  children?: ReactNode | ((closeSheet: CloseBottomSheet) => ReactNode);
  fixedHeight?: boolean;
  scrollFade?: boolean;
  contentKey?: string | number;
  contentFullBleed?: boolean;
  presentation?: 'modal' | 'screen';
  noticeHostActive?: boolean;
  dimBackdrop?: boolean;
  menuAction?: ReactNode;
  dismissOnBack?: boolean;
  dismissible?: boolean;
  preserveHandle?: boolean;
  onBeforeClose?: () => boolean;
  onOpening?: () => void;
  onOpened?: () => void;
  footer?: ReactNode | ((closeSheet: CloseBottomSheet) => ReactNode);
  scrollEnabled?: boolean;
  contentContainerClassName?: string;
  onContentSizeChange?: (width: number, height: number) => void;
  scrollRef?: AnimatedRef<ScrollView>;
  list?: BottomSheetListProps;
}) {
  const { rem: appRem, reducedMotion: reduceMotion } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const fade = useScrollFade();
  const { onScrollOffset } = fade;
  useEffect(() => onScrollOffset(0), [contentKey, onScrollOffset]);
  const sheetHeight = Math.max(0, Math.min(height * 0.95, height - insets.top));
  const { present, bodyVisible, closingBody, session, motion, closeSheet, onShow } =
    useBottomSheetLifecycle({
      visible,
      title: title ?? '',
      onClose,
      onBeforeClose,
      onOpening,
      onOpened,
      presentation,
      dismissOnBack,
      dismissible,
      height,
      rem: appRem,
      reducedMotion: reduceMotion,
      scrollFade,
      contentKey,
      onScrollOffset,
      scrollEnabled,
      headerOnlyDrag: !list,
      scrollRef,
    });
  const headerContent = (
    <View
      onStartShouldSetResponderCapture={() => Keyboard.isVisible()}
      onResponderRelease={() => Keyboard.dismiss()}
    >
      <BottomSheetHeader
        handleColor={handleColor}
        title={title}
        scrollableTitle={scrollableTitle}
        headerButton={typeof headerButton === 'function' ? headerButton(closeSheet) : headerButton}
        menuAction={menuAction}
        onClose={dismissible || preserveHandle ? () => closeSheet() : undefined}
        handleDisabled={!dismissible}
      />
    </View>
  );
  const header = contentFullBleed ? (
    <View className="px-[5%]">{headerContent}</View>
  ) : (
    headerContent
  );
  const sheet = (
    <BottomSheetContent
      session={session}
      motion={motion}
      closingBody={closingBody}
      sheetHeight={sheetHeight}
      fixedHeight={fixedHeight}
      contentFullBleed={contentFullBleed}
      list={list}
      header={header}
      contentHeader={contentHeader}
      fade={fade}
      scrollEnabled={scrollEnabled}
      scrollFade={scrollFade}
      contentContainerClassName={contentContainerClassName}
      onContentSizeChange={onContentSizeChange}
      contentKey={contentKey}
      footer={footer}
      insets={insets}
      appRem={appRem}
      closeSheet={closeSheet}
    >
      {children}
    </BottomSheetContent>
  );
  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View
        className="flex-1 justify-end"
        style={{
          paddingLeft: insets.left,
          paddingRight: insets.right,
        }}
      >
        {bodyVisible && (
          <BottomSheetBackdrop
            key={`backdrop-${session}`}
            motion={motion}
            dismissible={dismissible}
            dim={dimBackdrop}
            onClose={closeSheet}
          />
        )}
        {bodyVisible &&
          (!list ? sheet : <GestureDetector gesture={motion.panGesture}>{sheet}</GestureDetector>)}
        <NoticeHost modal active={present && (presentation === 'modal' || noticeHostActive)} />
      </View>
    </GestureHandlerRootView>
  );
  if (presentation === 'screen') return present ? content : null;
  return (
    <Modal
      visible={present}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={() => {
        if (dismissOnBack && dismissible) closeSheet();
      }}
      onShow={onShow}
    >
      {content}
    </Modal>
  );
}
