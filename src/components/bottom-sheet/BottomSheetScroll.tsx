import type { ReactNode } from 'react';
import type { useBottomSheetMotion } from './useBottomSheetMotion';
import type { useScrollFade } from '../../hooks/useScrollFade';
import { KeyboardAwareAnimatedScrollView } from '../AnimatedScrollView';

export function BottomSheetScroll({
  motion,
  fade,
  fixedHeight,
  scrollEnabled,
  contentKey,
  bottomPadding,
  children,
  contentContainerClassName,
  onContentSizeChange,
}: {
  motion: ReturnType<typeof useBottomSheetMotion>;
  fade: ReturnType<typeof useScrollFade>;
  fixedHeight: boolean;
  scrollEnabled: boolean;
  contentKey?: string | number;
  bottomPadding?: number;
  children?: ReactNode;
  contentContainerClassName: string;
  onContentSizeChange?: (width: number, height: number) => void;
}) {
  return (
    <KeyboardAwareAnimatedScrollView
      key={contentKey}
      ref={(instance) => {
        motion.scrollRef(instance);
      }}
      className={`${fixedHeight ? 'flex-1' : 'grow-0 shrink'} min-h-0`}
      contentContainerClassName={contentContainerClassName}
      contentContainerStyle={
        bottomPadding === undefined ? undefined : { paddingBottom: bottomPadding }
      }
      scrollEnabled={scrollEnabled}
      onLayout={fade.onLayout}
      onContentSizeChange={(width, height) => {
        fade.onContentSizeChange(width, height);
        onContentSizeChange?.(width, height);
      }}
      onScroll={fade.onScroll}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
      bounces={false}
      overScrollMode="never"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="none"
      mode="layout"
      bottomOffset={16}
    >
      {children}
    </KeyboardAwareAnimatedScrollView>
  );
}
