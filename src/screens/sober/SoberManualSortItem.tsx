import { ScrollableName } from '../../components/ScrollableName';
import { useI18n } from '../../i18n/react';
import { AppIcon } from '../../components/AppIcon';
import { useAppTheme } from '../../theme/AppThemeProvider';
import { View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Sortable, { useItemContext } from 'react-native-sortables';
import type { Sober } from '../../db/types';
import { SoberIcon } from '../../components/SoberIcon';
import { StarIcon } from '../../components/StarIcon';

export function SoberManualSortItem({
  sober,
  index,
  count,
  disabled,
  onMove,
}: {
  sober: Sober;
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
      <SoberIcon name={sober.icon_key} colorKey={sober.icon_color} size={appRem * 2} />
      <View className="min-w-0 flex-1">
        <ScrollableName className="text-sm font-medium">{sober.name}</ScrollableName>
      </View>
      {sober.is_priority ? <StarIcon size={appRem} color={colors.accent} /> : null}
      <Sortable.Handle style={{ margin: -appRem }}>
        <View
          accessible
          accessibilityRole="button"
          accessibilityLabel={t('sober.orderAction', { value: sober.name })}
          accessibilityHint={t('sober.orderHint')}
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
