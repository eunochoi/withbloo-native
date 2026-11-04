import { ScrollableName } from '../../components/ScrollableName';
import { useI18n } from '../../i18n/react';
import { AppIcon } from '../../components/AppIcon';
import { useAppTheme } from '../../theme/AppThemeProvider';
import { View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Sortable, { useItemContext } from 'react-native-sortables';
import type { Habit } from '../../db/types';
import { HabitStars } from './HabitStars';
import { HabitIcon } from '../../components/HabitIcon';

export function HabitManualSortItem({
  habit,
  index,
  count,
  disabled,
  onMove,
}: {
  habit: Habit;
  index: number;
  count: number;
  disabled: boolean;
  onMove: (from: number, to: number) => void;
}) {
  const { t } = useI18n();

  const { colors, rem: appRem } = useAppTheme();
  const { isActive } = useItemContext();
  const activeStyle = useAnimatedStyle(() => ({
    backgroundColor: isActive.value ? `${colors.accent}1A` : 'transparent',
  }));
  return (
    <Animated.View style={activeStyle} className="h-16 flex-row items-center gap-3 p-3 ios:curve-continuous rounded-xl">
      <HabitIcon name={habit.icon_key} colorKey={habit.icon_color} size={appRem * 2} />
      <View className="min-w-0 flex-1">
        <ScrollableName className="text-sm font-medium">{habit.name}</ScrollableName>
      </View>
      <HabitStars priority={habit.priority} size={appRem * 0.8} />
      <Sortable.Handle style={{ margin: -appRem }}>
        <View
          accessible
          accessibilityRole="button"
          accessibilityLabel={t('habit.orderAction', { value: habit.name })}
          accessibilityHint={t('habit.orderHint')}
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
          <AppIcon name="drag-indicator" size={appRem * 1.25} color={colors.accentDeep} />
        </View>
      </Sortable.Handle>
    </Animated.View>
  );
}
