import { Pressable, type PressableProps } from 'react-native';
import { Text } from './Text';

export function HeaderAction({
  label,
  disabled,
  danger = false,
  ...props
}: PressableProps & { label: string; danger?: boolean }) {
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
        className={`text-lg font-semibold ${danger ? 'text-theme-danger' : 'text-theme-accent'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
