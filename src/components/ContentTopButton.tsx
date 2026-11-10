import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from './Text';

export function ContentTopButtons({ children }: { children: ReactNode }) {
  return <View className="flex-row flex-wrap justify-end gap-3">{children}</View>;
}

export function ContentTopButton({ label, onPress, disabled, accessibilityLabel, icon }: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  icon?: ReactNode;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label}
      disabled={disabled} onPress={onPress}
      className={`min-h-11 flex-row items-center gap-1 active:opacity-70 ${disabled ? 'opacity-40' : ''}`}>
      {icon}<Text className="text-sm text-theme-accent">{label}</Text>
    </Pressable>
  );
}
