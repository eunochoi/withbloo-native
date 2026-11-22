import type { ReactNode } from 'react';
import { View, type ScrollView } from 'react-native';
import Animated, { useAnimatedStyle, type AnimatedRef } from 'react-native-reanimated';
import Sortable, { useItemContext } from 'react-native-sortables';
import { useI18n } from '../../i18n/react';
import { useAppTheme } from '../../theme/AppThemeProvider';
import { AppIcon } from '../AppIcon';
import { ScrollableName } from '../ScrollableName';

type SortItem = { id: number; name: string };

export function ManualSortList<T extends SortItem>({
  items,
  scrollRef,
  disabled,
  dragging,
  onDraggingChange,
  onMove,
  renderIcon,
  renderPriority,
  getOrderLabel,
  orderHint,
}: {
  items: T[];
  scrollRef: AnimatedRef<ScrollView>;
  disabled: boolean;
  dragging: boolean;
  onDraggingChange: (dragging: boolean) => void;
  onMove: (from: number, to: number) => void;
  renderIcon: (item: T) => ReactNode;
  renderPriority: (item: T) => ReactNode;
  getOrderLabel: (item: T) => string;
  orderHint: string;
}) {
  return (
    <View className="w-full min-w-0 rounded-xl bg-theme-background p-2">
      <Sortable.Grid
        data={items}
        keyExtractor={(item) => String(item.id)}
        columns={1}
        customHandle
        dragActivationDelay={0}
        enableActiveItemSnap={false}
        activeItemScale={1}
        activeItemShadowOpacity={0}
        inactiveItemOpacity={1}
        overDrag="none"
        sortEnabled={!disabled && items.length > 1}
        scrollableRef={scrollRef}
        onDragStart={() => onDraggingChange(true)}
        onDragEnd={({ fromIndex, toIndex }) => {
          if (fromIndex !== toIndex) onMove(fromIndex, toIndex);
          onDraggingChange(false);
        }}
        renderItem={({ item, index }) => (
          <ManualSortItem
            name={item.name}
            icon={renderIcon(item)}
            priority={renderPriority(item)}
            orderLabel={getOrderLabel(item)}
            orderHint={orderHint}
            index={index}
            count={items.length}
            disabled={disabled || dragging || items.length < 2}
            onMove={onMove}
          />
        )}
      />
    </View>
  );
}

function ManualSortItem({
  name,
  icon,
  priority,
  orderLabel,
  orderHint,
  index,
  count,
  disabled,
  onMove,
}: {
  name: string;
  icon: ReactNode;
  priority: ReactNode;
  orderLabel: string;
  orderHint: string;
  index: number;
  count: number;
  disabled: boolean;
  onMove: (from: number, to: number) => void;
}) {
  const { t } = useI18n();
  const { colors, rem } = useAppTheme();
  const { isActive } = useItemContext();
  const activeStyle = useAnimatedStyle(() => ({
    backgroundColor: isActive.value ? `${colors.accent}1A` : 'transparent',
  }));
  return (
    <Animated.View style={activeStyle} className="h-16 flex-row items-center gap-3 rounded-xl p-3 ios:curve-continuous">
      {icon}
      <View className="min-w-0 flex-1">
        <ScrollableName className="text-sm font-medium">{name}</ScrollableName>
      </View>
      {priority}
      <Sortable.Handle style={{ margin: -rem }}>
        <View
          accessible
          accessibilityRole="button"
          accessibilityLabel={orderLabel}
          accessibilityHint={orderHint}
          accessibilityState={{ disabled }}
          accessibilityActions={[
            { name: 'decrement', label: t('habit.moveUp') },
            { name: 'increment', label: t('habit.moveDown') },
          ]}
          onAccessibilityAction={(event) => {
            if (disabled) return;
            const target = index + (event.nativeEvent.actionName === 'decrement' ? -1 : 1);
            if (target >= 0 && target < count) onMove(index, target);
          }}
          className="h-12 w-12 items-center justify-center p-3"
        >
          <AppIcon name="drag-indicator" size={rem * 1.25} color={colors.accentDeep} />
        </View>
      </Sortable.Handle>
    </Animated.View>
  );
}
