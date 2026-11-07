import type { FlatList } from 'react-native';
import type { AnimatedRef } from 'react-native-reanimated';
import { AnimatedFlatList } from '../AnimatedFlatList';
import type { BottomSheetListProps, BottomSheetScrollProps } from './BottomSheetScrollViewport';

export function BottomSheetList({
  list,
  contentKey,
  ...scrollProps
}: BottomSheetScrollProps & {
  list: BottomSheetListProps;
  contentKey?: string | number;
}) {
  const { ref, ...viewport } = scrollProps;
  return (
    <AnimatedFlatList
      {...viewport}
      {...list}
      key={contentKey}
      ref={ref as unknown as AnimatedRef<FlatList>}
    />
  );
}
