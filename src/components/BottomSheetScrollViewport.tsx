import { useEffect, useRef, type ComponentProps, type ReactNode } from 'react';
import type { ScrollView } from 'react-native';
import type { AnimatedRef } from 'react-native-reanimated';
import { Keyboard, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import type { useBottomSheetMotion } from '../hooks/useBottomSheetMotion';
import type { useScrollFade } from '../hooks/useScrollFade';
import { AnimatedScrollView } from './AnimatedScrollView';
import { ScrollEdgeFade } from './ScrollEdgeFade';

export type BottomSheetScrollProps = ComponentProps<typeof AnimatedScrollView> & {
  ref: AnimatedRef<ScrollView>;
};

export function BottomSheetScrollViewport({
  motion,
  fade,
  fixedHeight,
  scrollEnabled,
  scrollFade,
  contentKey,
  bottomPadding,
  children,
  renderScrollView,
  header,
}: {
  motion: ReturnType<typeof useBottomSheetMotion>;
  fade: ReturnType<typeof useScrollFade>;
  fixedHeight: boolean;
  scrollEnabled: boolean;
  scrollFade: boolean;
  contentKey?: string | number;
  bottomPadding?: number;
  children?: ReactNode;
  renderScrollView?: (props: BottomSheetScrollProps) => ReactNode;
  header?: ReactNode;
}) {
  const focusedInput = useRef<number | null>(null);

  useEffect(() => {
    const shown = Keyboard.addListener('keyboardDidShow', () => {
      if (focusedInput.current !== null) {
        motion.scrollRef.current?.scrollResponderScrollNativeHandleToKeyboard(focusedInput.current, 16, true);
      }
    });
    return () => shown.remove();
  }, [motion.scrollRef]);

  const scrollProps: BottomSheetScrollProps = {
    ref: motion.scrollRef,
    scrollEnabled,
    onFocus: (event) => {
      focusedInput.current = event.nativeEvent.target;
      if (Keyboard.isVisible() && focusedInput.current !== null) {
        motion.scrollRef.current?.scrollResponderScrollNativeHandleToKeyboard(focusedInput.current, 16, true);
      }
    },
    onBlur: () => { focusedInput.current = null; },
    onLayout: fade.onLayout,
    onContentSizeChange: fade.onContentSizeChange,
    onScroll: motion.onScroll,
    scrollEventThrottle: 16,
    showsVerticalScrollIndicator: false,
    showsHorizontalScrollIndicator: false,
    className: `${fixedHeight ? 'flex-1' : 'grow-0 shrink'} min-h-0`,
    contentContainerClassName: 'gap-7 pt-6 pb-7',
    contentContainerStyle:
      bottomPadding === undefined ? undefined : { paddingBottom: bottomPadding },
    nestedScrollEnabled: true,
    bounces: false,
    overScrollMode: 'never',
    keyboardShouldPersistTaps: 'never',
    keyboardDismissMode: 'none',
  };
  const viewport = (
    <View className={`${fixedHeight ? 'flex-1' : 'shrink'} min-h-0 overflow-hidden`}>
      <GestureDetector gesture={motion.scrollGesture}>
        {renderScrollView ? (
          renderScrollView(scrollProps)
        ) : (
          <AnimatedScrollView key={contentKey} {...scrollProps}>
            {children}
          </AnimatedScrollView>
        )}
      </GestureDetector>
      {scrollFade && (
        <>
          <ScrollEdgeFade edge="top" visible={fade.topVisible} />
          <ScrollEdgeFade
            edge="bottom"
            visible={fade.bottomVisible}
            includeBottomInset={false}
            includeToolbar={false}
          />
        </>
      )}
    </View>
  );
  return header ? (
    <View className={`${fixedHeight ? 'flex-1' : 'shrink'} min-h-0`}>
      {header}
      {viewport}
    </View>
  ) : (
    viewport
  );
}
