import type { ReactNode } from 'react';
import { Pressable, View, type PressableProps } from 'react-native';
import { Text } from './Text';

export function UnderlineTab({
  selected,
  children,
  ...props
}: Omit<PressableProps, 'children'> & { selected: boolean; children: ReactNode }) {
  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityState={{ ...props.accessibilityState, selected }}
      className="flex-row items-center gap-2 py-2 pr-2"
    >
      <View
        className={`h-2 w-2 rounded-full ${selected ? 'bg-theme-accent' : 'bg-theme-text-tertiary/70'}`}
      />
      <Text
        className={`text-base ${selected ? 'text-theme-text-primary' : 'text-theme-text-tertiary/70'}`}
      >
        {children}
      </Text>
    </Pressable>
  );
}
