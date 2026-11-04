import type { ScrollView } from 'react-native';
import { View } from 'react-native';
import type { AnimatedRef } from 'react-native-reanimated';
import Sortable from 'react-native-sortables';
import type { Habit } from '../../db/types';
import { HabitManualSortItem } from './HabitManualSortItem';

export function HabitManualSortList({
  items,
  scrollRef,
  disabled,
  saving,
  dragging,
  onDraggingChange,
  onOrderChange,
  onMove,
}: {
  items: Habit[];
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
              onOrderChange(data.map((habit) => habit.id));
              onDraggingChange(false);
            }}
            renderItem={({ item, index }) => (
              <HabitManualSortItem
                habit={item}
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
