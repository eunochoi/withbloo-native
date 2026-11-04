import type { ScrollView } from 'react-native';
import { View } from 'react-native';
import type { AnimatedRef } from 'react-native-reanimated';
import Sortable from 'react-native-sortables';
import type { Sober } from '../../db/types';
import { SoberManualSortItem } from './SoberManualSortItem';

export function SoberManualSortList({
  items,
  scrollRef,
  disabled,
  saving,
  dragging,
  onDraggingChange,
  onOrderChange,
  onMove,
}: {
  items: Sober[];
  scrollRef: AnimatedRef<ScrollView>;
  disabled: boolean;
  saving: boolean;
  dragging: boolean;
  onDraggingChange: (dragging: boolean) => void;
  onOrderChange: (order: number[]) => void;
  onMove: (from: number, to: number) => void;
}) {
  return (
    <View className="w-full min-w-0 rounded-xl bg-theme-background p-2">
          <Sortable.Grid
            data={items}
            keyExtractor={(item) => String(item.id)}
            columns={1}
            customHandle
            activeItemScale={1}
            activeItemShadowOpacity={0}
            inactiveItemOpacity={1}
            overDrag="none"
            sortEnabled={!saving && !disabled}
            scrollableRef={scrollRef}
            onDragStart={() => onDraggingChange(true)}
            onDragEnd={({ data }) => {
              onOrderChange(data.map((sober) => sober.id));
              onDraggingChange(false);
            }}
            renderItem={({ item, index }) => (
              <SoberManualSortItem
                sober={item}
                index={index}
                count={items.length}
                disabled={saving || dragging || disabled}
                onMove={onMove}
              />
            )}
          />
    </View>
  );
}
