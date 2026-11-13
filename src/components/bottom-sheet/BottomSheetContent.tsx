import { type ReactNode } from 'react';
import { Keyboard, View } from 'react-native';
import Animated from 'react-native-reanimated';
import type { useBottomSheetMotion } from './useBottomSheetMotion';
import type { useScrollFade } from '../../hooks/useScrollFade';
import type { CloseBottomSheet } from './useBottomSheetLifecycle';
import { BottomSheetScrollViewport, type BottomSheetListProps } from './BottomSheetScrollViewport';

export function BottomSheetContent({
  session,
  motion,
  closingBody,
  sheetHeight,
  fixedHeight,
  contentFullBleed,
  list,
  header,
  contentHeader,
  fade,
  scrollEnabled,
  scrollFade,
  contentContainerClassName,
  onContentSizeChange,
  contentKey,
  footer,
  insets,
  appRem,
  children,
  closeSheet,
}: {
  session: number;
  motion: ReturnType<typeof useBottomSheetMotion>;
  closingBody: boolean;
  sheetHeight: number;
  fixedHeight: boolean;
  contentFullBleed: boolean;
  list?: BottomSheetListProps;
  header: ReactNode;
  contentHeader?: ReactNode;
  fade: ReturnType<typeof useScrollFade>;
  scrollEnabled: boolean;
  scrollFade: boolean;
  contentContainerClassName?: string;
  onContentSizeChange?: (width: number, height: number) => void;
  contentKey?: string | number;
  footer?: ReactNode | ((closeSheet: CloseBottomSheet) => ReactNode);
  insets: { bottom: number };
  appRem: number;
  children?: ReactNode | ((closeSheet: CloseBottomSheet) => ReactNode);
  closeSheet: CloseBottomSheet;
}) {
  return (
    <Animated.View
      key={`sheet-${session}`}
      style={motion.sheetStyle}
      pointerEvents={closingBody ? 'none' : 'auto'}
      collapsable={false}
      className="w-full shrink"
    >
      <View
        onLayout={motion.onSheetLayout}
        accessibilityViewIsModal
        className={`w-full shrink ios:curve-continuous rounded-t-4xl border-[1px] border-theme-border bg-theme-surface ${contentFullBleed ? '' : 'px-[5%]'} pt-2 shadow-2xl shadow-theme-overlay/60 ios:shadow-lg ios:shadow-theme-overlay/20`}
        style={{
          maxHeight: sheetHeight,
          height: fixedHeight ? sheetHeight : undefined,
        }}
      >
        {header}
        {contentHeader && (
          <View className={contentFullBleed ? 'px-[5%]' : 'mx-1'}>
            {contentHeader}
          </View>
        )}
        <BottomSheetScrollViewport
          motion={motion}
          insetContent={!contentFullBleed}
          list={list}
          fade={fade}
          fixedHeight={fixedHeight}
          scrollEnabled={scrollEnabled}
          scrollFade={scrollFade}
          contentContainerClassName={contentContainerClassName}
          onContentSizeChange={onContentSizeChange}
          contentKey={contentKey}
          bottomPadding={!footer && insets.bottom > 0 ? appRem * 2 + insets.bottom : undefined}
        >
          {typeof children === 'function' ? children(closeSheet) : children}
        </BottomSheetScrollViewport>
        {footer && (
          <View
            onStartShouldSetResponderCapture={() => Keyboard.isVisible()}
            onResponderRelease={() => Keyboard.dismiss()}
            className={contentFullBleed ? 'pb-4 px-[5%]' : 'pb-4'}
            style={insets.bottom > 0 ? { paddingBottom: appRem + insets.bottom } : undefined}
          >
            {typeof footer === 'function' ? footer(closeSheet) : footer}
          </View>
        )}
      </View>
    </Animated.View>
  );
}
