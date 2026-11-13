import { type ComponentProps, type ReactNode } from 'react';
import type { ScrollView } from 'react-native';
import type { AnimatedRef } from 'react-native-reanimated';
import { BottomSheetList } from './BottomSheetList';
import { AnimatedFlatList } from '../AnimatedFlatList';
import { View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import type { useBottomSheetMotion } from './useBottomSheetMotion';
import type { useScrollFade } from '../../hooks/useScrollFade';
import { AnimatedScrollView } from '../AnimatedScrollView';
import { BottomSheetScroll } from './BottomSheetScroll';
import { ScrollEdgeFade } from '../ScrollEdgeFade';

export type BottomSheetScrollProps = ComponentProps<typeof AnimatedScrollView> & {
  ref: AnimatedRef<ScrollView>;
};

export type BottomSheetListProps = Omit<ComponentProps<typeof AnimatedFlatList>, 'ref'> & {
  contentContainerClassName?: string;
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
  list,
  insetContent = false,
  contentContainerClassName = 'gap-7 py-8',
  onContentSizeChange,
}: {
  motion: ReturnType<typeof useBottomSheetMotion>;
  fade: ReturnType<typeof useScrollFade>;
  fixedHeight: boolean;
  scrollEnabled: boolean;
  scrollFade: boolean;
  contentKey?: string | number;
  bottomPadding?: number;
  children?: ReactNode;
  list?: BottomSheetListProps;
  insetContent?: boolean;
  contentContainerClassName?: string;
  onContentSizeChange?: (width: number, height: number) => void;
}) {
  const scrollProps: BottomSheetScrollProps = {
    ref: motion.scrollRef,
    scrollEnabled,
    onLayout: fade.onLayout,
    onContentSizeChange: fade.onContentSizeChange,
    onScroll: motion.onScroll,
    scrollEventThrottle: 16,
    showsVerticalScrollIndicator: false,
    showsHorizontalScrollIndicator: false,
    className: `${fixedHeight ? 'flex-1' : 'grow-0 shrink'} min-h-0`,
    contentContainerClassName: 'gap-7 py-8',
    contentContainerStyle:
      bottomPadding === undefined ? undefined : { paddingBottom: bottomPadding },
    nestedScrollEnabled: true,
    bounces: false,
    overScrollMode: 'never',
    keyboardShouldPersistTaps: 'handled',
    keyboardDismissMode: 'none',
  };
  const viewport = (
    <View
      className={`${fixedHeight ? 'flex-1' : 'shrink'} min-h-0 overflow-hidden ${insetContent ? 'mx-1' : ''}`}
    >
      {list ? (
        <GestureDetector gesture={motion.scrollGesture}>
          <BottomSheetList {...scrollProps} list={list} contentKey={contentKey} />
        </GestureDetector>
      ) : (
        <GestureDetector gesture={motion.scrollGesture}>
          <BottomSheetScroll
            motion={motion}
            fade={fade}
            fixedHeight={fixedHeight}
            scrollEnabled={scrollEnabled}
            contentKey={contentKey}
            bottomPadding={bottomPadding}
            contentContainerClassName={contentContainerClassName}
            onContentSizeChange={onContentSizeChange}
          >
            {children}
          </BottomSheetScroll>
        </GestureDetector>
      )}
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
  return viewport;
}
