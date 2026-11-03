import { Pressable, type PressableProps } from 'react-native';
import { Text } from './Text';

export function HeaderAction({
  label,
  disabled,
  danger = false,
  side = 'right',
  ...props
}: PressableProps & { label: string; danger?: boolean; side?: 'left' | 'right' }) {
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      className={`min-h-11 min-w-11 items-center justify-center px-1 active:opacity-70 ${disabled ? 'opacity-40' : ''}`}
    >
      <Text
        numberOfLines={1}
        className={`text-lg font-normal ${danger ? 'text-theme-danger' : side === 'left' ? 'text-theme-text-primary' : 'text-theme-accent'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
